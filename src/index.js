/**
 * WordPress Auto-Tagging API - Optimized Cloudflare Worker
 * 
 * Implements the exact 10-step operational flow:
 * 1. Input validation → 2. De-dupe guard → 3. Fetch & cache tags → 4. Generate AI tags
 * 5. Clean/normalize → 6. Match vs cached → 7. Create missing tags → 8. Assign to post
 * 9. Log to Google Sheets → 10. Return JSON
 */

// Circuit breaker state management
const circuitBreakerState = {
  isOpen: false,
  failureCount: 0,
  lastFailureTime: null
};

// Constants
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 60 seconds
const MAX_RETRY_DELAY = 30000; // 30 seconds
const INITIAL_RETRY_DELAY = 1000; // 1 second
const CACHE_TTL = 600; // 10 minutes
const DEDUPE_CACHE_TTL = 300; // 5 minutes for de-dupe guard

/**
 * Main export for Cloudflare Workers
 */
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};

/**
 * Main request handler implementing the 10-step flow
 */
async function handleRequest(request, env) {
  // Only handle POST requests to /api/auto-tag
  if (request.method !== 'POST') {
    return createErrorResponse('METHOD_NOT_ALLOWED', 'Only POST method is allowed', 405);
  }

  const url = new URL(request.url);
  if (url.pathname !== '/api/auto-tag') {
    return createErrorResponse('NOT_FOUND', 'Endpoint not found', 404);
  }

  const requestId = generateRequestId();
  const startTime = Date.now();
  let retryCount = 0;

  try {
    // Authentication validation
    const authResult = validateAuthentication(request, env);
    if (!authResult.isValid) {
      return createErrorResponse('AUTHENTICATION_FAILED', authResult.message, 401, {
        error_code: authResult.error_code,
        request_id: requestId
      });
    }

    const requestData = await request.json();
    
    // STEP 1: Input validation
    const validationResult = validateInput(requestData);
    if (!validationResult.isValid) {
      return createErrorResponse('VALIDATION_ERROR', validationResult.message, 400, {
        field: validationResult.field,
        details: validationResult.details,
        request_id: requestId
      });
    }

    // STEP 2: De-dupe guard - Request fingerprinting
    const requestFingerprint = generateRequestFingerprint(requestData);
    const isDuplicate = await checkDuplicateRequest(requestFingerprint);
    if (isDuplicate) {
      return createErrorResponse('DUPLICATE_REQUEST', 'Request already processed within 5 minutes', 409, {
        request_id: requestId,
        fingerprint: requestFingerprint
      });
    }

    // Mark request as processing
    await markRequestProcessing(requestFingerprint);

    // Test mode for AI-only functionality
    if (requestData.wp_url.includes('test-mode') || requestData.wp_url.includes('jsonplaceholder')) {
      const aiResult = await generateTagsWithAI(requestData, env);
      const response = createSuccessResponse(requestData, aiResult.tags, [], Date.now() - startTime, aiResult.retryCount, requestId, true);
      
      // Log to Google Sheets (non-blocking)
      logToGoogleSheets(createLogData({
        requestData,
        assignedTags: aiResult.tags,
        createdTags: [],
        processingTime: Date.now() - startTime,
        retries: aiResult.retryCount,
        status: 'success',
        requestId
      }), env).catch(console.warn);
      
      return response;
    }

    // STEP 3: Fetch & cache WordPress tags
    const existingTags = await fetchWordPressTags(requestData.wp_url, requestData.wp_auth);
    
    // STEP 4: Generate AI tags
    const aiResult = await generateTagsWithAI(requestData, env);
    retryCount = aiResult.retryCount;
    
    // STEP 5: Clean/normalize AI tags
    const normalizedTags = cleanAndNormalizeTags(aiResult.tags);
    
    // STEP 6: Match vs cached tags
    const { matchedTags, missingTags } = matchTagsWithExisting(normalizedTags, existingTags);
    
    // STEP 7: Create missing tags
    const createdTags = [];
    const allTagIds = [...matchedTags.map(tag => tag.id)];
    
    for (const missingTag of missingTags) {
      const newTag = await createWordPressTag(requestData.wp_url, requestData.wp_auth, missingTag);
      createdTags.push(newTag.name);
      allTagIds.push(newTag.id);
    }
    
    // STEP 8: Assign tags to post
    await assignTagsToPost(requestData.wp_url, requestData.wp_auth, requestData.post_id, allTagIds);
    
    const processingTime = Date.now() - startTime;
    const assignedTagNames = [...matchedTags.map(tag => tag.name), ...createdTags];
    
    // STEP 9: Log to Google Sheets (non-blocking)
    logToGoogleSheets(createLogData({
      requestData,
      assignedTags: assignedTagNames,
      createdTags,
      processingTime,
      retries: retryCount,
      status: 'success',
      requestId
    }), env).catch(console.warn);
    
    // STEP 10: Return billing-ready JSON
    return createSuccessResponse(requestData, assignedTagNames, createdTags, processingTime, retryCount, requestId);

  } catch (error) {
    console.error('Request processing failed:', error);
    
    const errorResponse = handleError(error, requestId);
    const processingTime = Date.now() - startTime;
    
    // Log error to Google Sheets (non-blocking)
    try {
      const requestData = await request.json().catch(() => ({}));
      logToGoogleSheets(createLogData({
        requestData,
        assignedTags: [],
        createdTags: [],
        processingTime,
        retries: retryCount,
        status: 'error',
        requestId,
        errorCode: errorResponse.error_code,
        errorMessage: errorResponse.message
      }), env).catch(console.warn);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(JSON.stringify(errorResponse), {
      status: errorResponse.http_status || 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * STEP 1: Input Validation
 */
function validateInput(data) {
  const requiredFields = ['wp_url', 'wp_auth', 'post_id', 'is_live'];
  for (const field of requiredFields) {
    if (!data[field]) {
      return {
        isValid: false,
        message: `Missing required field: ${field}`,
        field: field
      };
    }
  }

  // Validate wp_url format
  try {
    new URL(data.wp_url);
  } catch {
    return {
      isValid: false,
      message: 'Invalid WordPress URL format',
      field: 'wp_url'
    };
  }

  // Validate post_id is positive integer
  if (!Number.isInteger(data.post_id) || data.post_id <= 0) {
    return {
      isValid: false,
      message: 'post_id must be a positive integer',
      field: 'post_id'
    };
  }

  // Validate is_live is exactly "yes"
  if (data.is_live !== 'yes') {
    return {
      isValid: false,
      message: 'Post is not live or tags already exist.',
      field: 'is_live',
      details: 'is_live must be "yes" and tags must be empty'
    };
  }

  // Validate tags field is empty or null
  if (data.tags && data.tags !== '' && data.tags !== null) {
    return {
      isValid: false,
      message: 'Post already has tags assigned',
      field: 'tags',
      details: 'is_live must be "yes" and tags must be empty'
    };
  }

  return { isValid: true };
}

/**
 * Authentication validation
 */
function validateAuthentication(request, env) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return {
      isValid: false,
      message: 'Missing Authorization header',
      error_code: 'MISSING_AUTH_HEADER'
    };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return {
      isValid: false,
      message: 'Invalid Authorization header format. Expected: Bearer <token>',
      error_code: 'INVALID_AUTH_FORMAT'
    };
  }

  const token = authHeader.substring(7);
  
  if (!token || token.trim() === '') {
    return {
      isValid: false,
      message: 'Empty Bearer token',
      error_code: 'EMPTY_TOKEN'
    };
  }

  const validApiKeys = getValidApiKeys(env);
  
  if (!validApiKeys.includes(token)) {
    return {
      isValid: false,
      message: 'Invalid or expired API key',
      error_code: 'INVALID_API_KEY'
    };
  }

  return { isValid: true };
}

/**
 * Get valid API keys from environment
 */
function getValidApiKeys(env) {
  const primaryKey = env.API_KEY;
  const clientKeys = env.CLIENT_API_KEYS ? env.CLIENT_API_KEYS.split(',').map(key => key.trim()) : [];
  return [primaryKey, ...clientKeys].filter(key => key && key.length > 0);
}

/**
 * STEP 2: De-dupe guard - Generate request fingerprint
 */
function generateRequestFingerprint(data) {
  const fingerprint = `${data.wp_url}:${data.post_id}:${data.is_live}`;
  return btoa(fingerprint).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
}

/**
 * Check for duplicate request (placeholder - implement with KV store)
 */
async function checkDuplicateRequest(fingerprint) {
  // TODO: Implement with Cloudflare KV store
  // const cached = await env.KV_NAMESPACE.get(`dedupe:${fingerprint}`);
  // return cached !== null;
  return false; // Placeholder
}

/**
 * Mark request as processing (placeholder - implement with KV store)
 */
async function markRequestProcessing(fingerprint) {
  // TODO: Implement with Cloudflare KV store
  // await env.KV_NAMESPACE.put(`dedupe:${fingerprint}`, 'processing', { expirationTtl: DEDUPE_CACHE_TTL });
}

/**
 * STEP 3: Fetch WordPress tags with pagination
 */
async function fetchWordPressTags(wpUrl, wpAuth) {
  const cacheKey = `wp_tags_${btoa(wpUrl)}`;
  
  // Check cache first (placeholder)
  // const cached = await getFromCache(cacheKey);
  // if (cached) return cached;

  let allTags = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`${wpUrl}/wp-json/wp/v2/tags?per_page=100&page=${page}`, {
      headers: {
        'Authorization': `Basic ${wpAuth}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('WORDPRESS_AUTH_FAILED');
      }
      if (response.status === 429) {
        throw new Error('WORDPRESS_RATE_LIMIT');
      }
      throw new Error(`WORDPRESS_API_ERROR: ${response.status}`);
    }

    const tags = await response.json();
    allTags = [...allTags, ...tags];
    
    // Check X-WP-TotalPages header for proper pagination
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
    hasMore = page < totalPages;
    page++;
  }

  // Cache the results (placeholder)
  // await setCache(cacheKey, allTags, CACHE_TTL);
  
  return allTags;
}

/**
 * STEP 4: Generate AI tags with circuit breaker
 */
async function generateTagsWithAI(requestData, env) {
  if (isCircuitBreakerOpen()) {
    throw new Error('AI_SERVICE_UNAVAILABLE');
  }

  const prompt = formatAIPrompt(requestData);
  let retryCount = 0;
  let delay = INITIAL_RETRY_DELAY;

  while (true) {
    try {
      const response = await fetch(`https://api.chatwith.tools/v1/chatbot/${env.CHATWITH_CHATBOT_ID}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.CHATWITH_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: prompt,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`AI_API_ERROR: ${response.status}`);
      }

      const result = await response.json();
      const aiResponse = result.response || result.message || result.content || result.text || result;
      const tags = parseAIResponse(aiResponse);
      
      if (tags.length === 0) {
        throw new Error('AI_INVALID_RESPONSE');
      }

      resetCircuitBreaker();
      return { tags, retryCount };

    } catch (error) {
      retryCount++;
      recordCircuitBreakerFailure();
      
      console.log(`AI API attempt ${retryCount} failed:`, error.message);
      
      if (circuitBreakerState.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
        openCircuitBreaker();
        throw new Error('AI_SERVICE_UNAVAILABLE');
      }

      const jitter = Math.random() * 0.1 * delay;
      await sleep(delay + jitter);
      delay = Math.min(delay * 2, MAX_RETRY_DELAY);
    }
  }
}

/**
 * Format AI prompt
 */
function formatAIPrompt(data) {
  return `Generate exactly 3 relevant tags for this WordPress post:

Title: ${data.title || 'N/A'}
Content: ${data.content ? data.content.substring(0, 500) : 'N/A'}
League: ${data.league || 'N/A'}
Home Team: ${data.home_team || 'N/A'}
Away Team: ${data.away_team || 'N/A'}

Requirements:
- Maximum 3 tags
- Each tag 2-4 words maximum
- Focus on sports, teams, and relevant topics
- Return as comma-separated list`;
}

/**
 * Parse AI response to extract tags
 */
function parseAIResponse(response) {
  if (Array.isArray(response)) {
    return response
      .filter(tag => tag && typeof tag === 'string' && tag.trim().length > 0)
      .map(tag => tag.trim().toLowerCase())
      .slice(0, 3);
  }
  
  if (!response || typeof response !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(response);
    if (Array.isArray(parsed)) {
      return parsed
        .filter(tag => tag && typeof tag === 'string' && tag.trim().length > 0)
        .map(tag => tag.trim().toLowerCase())
        .slice(0, 3);
    }
  } catch (e) {
    // Continue with text parsing
  }

  let tags = [];
  
  if (response.includes(',')) {
    tags = response
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0 && tag.length <= 50);
  } else {
    const words = response
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && word.length <= 50);
    
    tags = words.slice(0, 3);
  }

  return tags.slice(0, 3);
}

/**
 * STEP 5: Enhanced tag normalization
 */
function cleanAndNormalizeTags(tags) {
  return tags
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => {
      // Drop tags >50 chars or containing emoji
      if (tag.length > 50) return false;
      if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(tag)) return false;
      return tag.length > 0;
    })
    .filter((tag, index, arr) => arr.indexOf(tag) === index) // Dedupe
    .slice(0, 3); // Cap at 3
}

/**
 * STEP 6: Match tags vs cached
 */
function matchTagsWithExisting(normalizedTags, existingTags) {
  const matchedTags = [];
  const missingTags = [];

  for (const aiTag of normalizedTags) {
    const existingTag = existingTags.find(tag => 
      tag.name.toLowerCase().trim() === aiTag ||
      tag.slug.toLowerCase() === aiTag.replace(/\s+/g, '-')
    );
    
    if (existingTag) {
      matchedTags.push(existingTag);
    } else {
      missingTags.push(aiTag);
    }
  }

  return { matchedTags, missingTags };
}

/**
 * STEP 7: Create missing WordPress tags
 */
async function createWordPressTag(wpUrl, wpAuth, tagName) {
  const response = await fetch(`${wpUrl}/wp-json/wp/v2/tags`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${wpAuth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: tagName,
      slug: tagName.toLowerCase().replace(/\s+/g, '-')
    })
  });

  if (!response.ok) {
    throw new Error(`WORDPRESS_TAG_CREATE_FAILED: ${response.status}`);
  }

  return await response.json();
}

/**
 * STEP 8: Assign tags to WordPress post
 */
async function assignTagsToPost(wpUrl, wpAuth, postId, tagIds) {
  const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts/${postId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${wpAuth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tags: tagIds
    })
  });

  if (!response.ok) {
    throw new Error(`WORDPRESS_TAG_ASSIGN_FAILED: ${response.status}`);
  }

  return await response.json();
}

/**
 * STEP 9: Google Sheets logging with 10 specific columns
 */
async function logToGoogleSheets(logData, env) {
  if (!env.GOOGLE_SHEETS_API_KEY || !env.GOOGLE_SHEETS_ID) {
    console.warn('Google Sheets credentials not configured, skipping logging');
    return;
  }

  try {
    const values = [[
      logData.timestamp,
      logData.post_id,
      logData.wp_url,
      logData.assigned_tags.join(', '),
      logData.created_tags.join(', '),
      logData.processing_time_ms,
      logData.ai_retries,
      logData.status,
      logData.error_code || '',
      logData.request_id
    ]];

    // Use configurable sheet name with fallback
    const sheetName = env.GOOGLE_SHEETS_SHEET_NAME || env.DEFAULT_SHEET_NAME || 'Sheet1';
    
    // Google Sheets API automatically appends to the next available row
    // The :append endpoint ensures data is added sequentially without overwriting
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEETS_ID}/values/${sheetName}:append`;
    const queryParams = new URLSearchParams({
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS', // Ensures new rows are inserted
      key: env.GOOGLE_SHEETS_API_KEY
    });

    const response = await fetch(`${apiUrl}?${queryParams}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: values,
        majorDimension: 'ROWS'
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Google Sheets logging failed: ${response.status} - ${errorText}`);
    } else {
      const result = await response.json().catch(() => null);
      if (result?.updates?.updatedRows) {
        console.log(`Successfully logged to Google Sheets: ${result.updates.updatedRows} row(s) added`);
      }
    }
  } catch (error) {
    console.error('Google Sheets logging error:', error);
  }
}

/**
 * Create log data object with reduced parameters
 */
function createLogData(logParams) {
  const {
    requestData,
    assignedTags = [],
    createdTags = [],
    processingTime = 0,
    retries = 0,
    status,
    requestId,
    errorCode = '',
    errorMessage = ''
  } = logParams;

  return {
    timestamp: new Date().toISOString(),
    post_id: requestData?.post_id || null,
    wp_url: requestData?.wp_url || null,
    assigned_tags: assignedTags,
    created_tags: createdTags,
    processing_time_ms: processingTime,
    ai_retries: retries,
    status: status,
    error_code: errorCode,
    error_message: errorMessage,
    request_id: requestId
  };
}

/**
 * STEP 10: Create billing-ready JSON response
 */
function createSuccessResponse(requestData, assignedTags, createdTags, processingTime, retries, requestId, testMode = false) {
  const response = {
    status: 'success',
    post_id: requestData.post_id,
    wp_url: requestData.wp_url,
    assigned_tags: assignedTags,
    created_tags: createdTags,
    processing_time_ms: processingTime,
    ai_retries: retries,
    request_id: requestId
  };

  if (testMode) {
    response.test_mode = true;
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Error handling with machine-readable codes
 */
function handleError(error, requestId) {
  const errorMessage = error.message || 'Unknown error';
  
  const errorMappings = {
    'WORDPRESS_AUTH_FAILED': {
      error_code: 'WORDPRESS_AUTH_FAILED',
      message: 'Invalid WordPress credentials',
      http_status: 401
    },
    'WORDPRESS_RATE_LIMIT': {
      error_code: 'WORDPRESS_RATE_LIMIT',
      message: 'WordPress API rate limit exceeded',
      http_status: 429,
      retry_after: 60
    },
    'AI_SERVICE_UNAVAILABLE': {
      error_code: 'AI_SERVICE_UNAVAILABLE',
      message: 'AI service is temporarily unavailable',
      http_status: 503,
      retry_after: 60
    },
    'VALIDATION_ERROR': {
      error_code: 'VALIDATION_ERROR',
      message: errorMessage,
      http_status: 400
    }
  };

  for (const [pattern, response] of Object.entries(errorMappings)) {
    if (errorMessage.includes(pattern)) {
      return {
        status: 'error',
        ...response,
        request_id: requestId
      };
    }
  }

  return {
    status: 'error',
    error_code: 'INTERNAL_ERROR',
    message: 'An internal error occurred',
    http_status: 500,
    request_id: requestId
  };
}

/**
 * Circuit breaker implementation
 */
function isCircuitBreakerOpen() {
  if (!circuitBreakerState.isOpen) {
    return false;
  }

  const timeSinceLastFailure = Date.now() - circuitBreakerState.lastFailureTime;
  if (timeSinceLastFailure >= CIRCUIT_BREAKER_TIMEOUT) {
    circuitBreakerState.isOpen = false;
    return false;
  }

  return true;
}

function recordCircuitBreakerFailure() {
  circuitBreakerState.failureCount++;
  circuitBreakerState.lastFailureTime = Date.now();
}

function openCircuitBreaker() {
  circuitBreakerState.isOpen = true;
  circuitBreakerState.lastFailureTime = Date.now();
  console.log('Circuit breaker opened due to repeated failures');
}

function resetCircuitBreaker() {
  circuitBreakerState.failureCount = 0;
  circuitBreakerState.isOpen = false;
}

/**
 * Utility functions
 */
function generateRequestId() {
  return 'req_' + Math.random().toString(36).substr(2, 9);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createErrorResponse(code, message, status, details = {}) {
  return new Response(JSON.stringify({
    status: 'error',
    error_code: code,
    message: message,
    ...details
  }), {
    status: status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Environment variables accessed via env parameter:
// - CHATWITH_API_KEY: ChatWith AI service API key
// - CHATWITH_CHATBOT_ID: ChatWith AI chatbot ID
// - GOOGLE_SHEETS_API_KEY: Google Sheets API key for logging
// - GOOGLE_SHEETS_ID: Google Sheets spreadsheet ID for logging
// - GOOGLE_SHEETS_SHEET_NAME: Google Sheets sheet name for logging (optional)
// - DEFAULT_SHEET_NAME: Fallback sheet name (optional, defaults to 'Sheet1')
// - API_KEY: Primary API key for authentication
// - CLIENT_API_KEYS: Comma-separated client API keys for authentication