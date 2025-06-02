/**
 * WordPress Auto-Tagging API - Cloudflare Worker
 * 
 * This worker implements a comprehensive auto-tagging system for WordPress posts
 * using AI-powered tag generation with robust error handling and retry logic.
 */

// Circuit breaker state management
const circuitBreakerState = {
  isOpen: false,
  failureCount: 0,
  lastFailureTime: null,
  halfOpenAttempts: 0
};

// Constants
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 60 seconds
const MAX_RETRY_DELAY = 30000; // 30 seconds
const INITIAL_RETRY_DELAY = 1000; // 1 second
const CACHE_TTL = 600; // 10 minutes

/**
 * Main request handler
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Handle incoming requests
 */
async function handleRequest(request) {
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

  try {
    // Parse request body
    const requestData = await request.json();
    
    // Layer 1: Input Validation
    const validationResult = validateInput(requestData);
    if (!validationResult.isValid) {
      return createErrorResponse('VALIDATION_ERROR', validationResult.message, 400, {
        field: validationResult.field,
        details: validationResult.details
      });
    }

    // Layer 2: WordPress Integration - Fetch existing tags
    const existingTags = await fetchWordPressTags(requestData.wp_url, requestData.wp_auth);
    
    // Layer 3: AI Processing - Generate tags
    const aiTags = await generateTagsWithAI(requestData);
    
    // Layer 4: Tag Management - Process and assign tags
    const tagResult = await processAndAssignTags(
      requestData.wp_url,
      requestData.wp_auth,
      requestData.post_id,
      aiTags,
      existingTags
    );

    const processingTime = Date.now() - startTime;

    // Layer 6: Google Sheets Integration - Log successful operation
    await logToGoogleSheets({
      timestamp: new Date().toISOString(),
      post_id: requestData.post_id,
      wp_url: requestData.wp_url,
      assigned_tags: tagResult.assignedTags.map(tag => tag.name),
      processing_time_ms: processingTime,
      ai_retries: tagResult.aiRetries || 0,
      status: 'success',
      request_id: requestId
    });

    // Return success response
    return new Response(JSON.stringify({
      status: 'success',
      post_id: requestData.post_id,
      assigned_tags: tagResult.assignedTags.map(tag => tag.name),
      tag_ids: tagResult.assignedTags.map(tag => tag.id),
      created_tags: tagResult.createdTags,
      processing_time_ms: processingTime
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Request processing failed:', error);
    
    // Layer 5: Error Handling
    const errorResponse = handleError(error, requestId);
    
    // Log error to Google Sheets
    try {
      await logToGoogleSheets({
        timestamp: new Date().toISOString(),
        post_id: requestData?.post_id || 'unknown',
        wp_url: requestData?.wp_url || 'unknown',
        assigned_tags: [],
        processing_time_ms: Date.now() - startTime,
        ai_retries: 0,
        status: 'error',
        error_code: errorResponse.error_code,
        error_message: errorResponse.message,
        request_id: requestId
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(JSON.stringify(errorResponse), {
      status: errorResponse.status || 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Layer 1: Input Validation
 */
function validateInput(data) {
  // Check required fields
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
 * Layer 2: WordPress Integration - Fetch all tags with pagination
 */
async function fetchWordPressTags(wpUrl, wpAuth) {
  const cacheKey = `wp_tags_${btoa(wpUrl)}`;
  
  // Check cache first
  const cached = await getFromCache(cacheKey);
  if (cached) {
    return cached;
  }

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
    
    hasMore = tags.length === 100;
    page++;
  }

  // Cache the results
  await setCache(cacheKey, allTags, CACHE_TTL);
  
  return allTags;
}

/**
 * Layer 3: AI Processing - Generate tags with persistent retry
 */
async function generateTagsWithAI(requestData) {
  if (isCircuitBreakerOpen()) {
    throw new Error('AI_SERVICE_UNAVAILABLE');
  }

  const prompt = formatAIPrompt(requestData);
  let retryCount = 0;
  let delay = INITIAL_RETRY_DELAY;

  while (true) {
    try {
      const response = await fetch(`https://api.chatwith.tools/v1/chatbot/${CHATWITH_CHATBOT_ID}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CHATWITH_API_KEY}`,
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
      const tags = parseAIResponse(result.response);
      
      if (tags.length === 0) {
        throw new Error('AI_INVALID_RESPONSE');
      }

      // Reset circuit breaker on success
      resetCircuitBreaker();
      
      return { tags, retryCount };

    } catch (error) {
      retryCount++;
      recordCircuitBreakerFailure();
      
      console.log(`AI API attempt ${retryCount} failed:`, error.message);
      
      // Check if circuit breaker should open
      if (circuitBreakerState.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
        openCircuitBreaker();
        throw new Error('AI_SERVICE_UNAVAILABLE');
      }

      // Wait before retry with exponential backoff and jitter
      const jitter = Math.random() * 0.1 * delay;
      await sleep(delay + jitter);
      delay = Math.min(delay * 2, MAX_RETRY_DELAY);
    }
  }
}

/**
 * Format AI prompt based on request data
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
  if (!response || typeof response !== 'string') {
    return [];
  }

  // Extract tags from response (comma-separated)
  const tags = response
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0 && tag.length <= 50)
    .slice(0, 3); // Ensure maximum 3 tags

  return tags;
}

/**
 * Layer 4: Tag Management - Process and assign tags
 */
async function processAndAssignTags(wpUrl, wpAuth, postId, aiResult, existingTags) {
  const { tags: aiTags, retryCount } = aiResult;
  const tagIds = [];
  const createdTags = [];
  const assignedTags = [];

  for (const aiTag of aiTags) {
    // Find matching existing tag (case-insensitive)
    const existingTag = findMatchingTag(aiTag, existingTags);
    
    if (existingTag) {
      tagIds.push(existingTag.id);
      assignedTags.push(existingTag);
    } else {
      // Create new tag
      const newTag = await createWordPressTag(wpUrl, wpAuth, aiTag);
      tagIds.push(newTag.id);
      assignedTags.push(newTag);
      createdTags.push(newTag.name);
    }
  }

  // Assign all tags to the post
  await assignTagsToPost(wpUrl, wpAuth, postId, tagIds);

  return {
    assignedTags,
    createdTags,
    aiRetries: retryCount
  };
}

/**
 * Find matching tag (case-insensitive comparison)
 */
function findMatchingTag(aiTag, existingTags) {
  const normalizedAiTag = aiTag.toLowerCase().trim();
  
  return existingTags.find(tag => 
    tag.name.toLowerCase().trim() === normalizedAiTag ||
    tag.slug.toLowerCase() === normalizedAiTag.replace(/\s+/g, '-')
  );
}

/**
 * Create new WordPress tag
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
 * Assign tags to WordPress post
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
 * Layer 5: Error Handling
 */
function handleError(error, requestId) {
  const errorMessage = error.message || 'Unknown error';
  
  // Map specific errors to response codes
  const errorMappings = {
    'WORDPRESS_AUTH_FAILED': {
      error_code: 'WORDPRESS_AUTH_FAILED',
      message: 'Invalid WordPress credentials',
      status: 401
    },
    'WORDPRESS_RATE_LIMIT': {
      error_code: 'WORDPRESS_RATE_LIMIT',
      message: 'WordPress API rate limit exceeded',
      status: 429,
      retry_after: 60
    },
    'AI_SERVICE_UNAVAILABLE': {
      error_code: 'AI_SERVICE_UNAVAILABLE',
      message: 'AI service is temporarily unavailable',
      status: 503,
      retry_after: 60
    },
    'VALIDATION_ERROR': {
      error_code: 'VALIDATION_ERROR',
      message: errorMessage,
      status: 400
    }
  };

  // Check for specific error patterns
  for (const [pattern, response] of Object.entries(errorMappings)) {
    if (errorMessage.includes(pattern)) {
      return {
        status: 'error',
        ...response,
        request_id: requestId
      };
    }
  }

  // Default error response
  return {
    status: 'error',
    error_code: 'INTERNAL_ERROR',
    message: 'An internal error occurred',
    status: 500,
    request_id: requestId
  };
}

/**
 * Layer 6: Google Sheets Integration
 */
async function logToGoogleSheets(logData) {
  if (!GOOGLE_SHEETS_API_KEY || !GOOGLE_SHEETS_ID) {
    console.warn('Google Sheets credentials not configured, skipping logging');
    return;
  }

  try {
    const values = [[
      logData.timestamp,
      logData.post_id,
      logData.wp_url,
      logData.assigned_tags.join(', '),
      logData.processing_time_ms,
      logData.ai_retries,
      logData.status,
      logData.error_code || '',
      logData.error_message || '',
      logData.request_id
    ]];

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_ID}/values/Logs:append?valueInputOption=RAW&key=${GOOGLE_SHEETS_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: values
        })
      }
    );

    if (!response.ok) {
      console.error('Failed to log to Google Sheets:', response.status);
    }
  } catch (error) {
    console.error('Google Sheets logging error:', error);
  }
}

/**
 * Circuit Breaker Implementation
 */
function isCircuitBreakerOpen() {
  if (!circuitBreakerState.isOpen) {
    return false;
  }

  // Check if we should transition to half-open
  const timeSinceLastFailure = Date.now() - circuitBreakerState.lastFailureTime;
  if (timeSinceLastFailure >= CIRCUIT_BREAKER_TIMEOUT) {
    circuitBreakerState.isOpen = false;
    circuitBreakerState.halfOpenAttempts = 0;
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
  circuitBreakerState.halfOpenAttempts = 0;
}

/**
 * Utility Functions
 */
function generateRequestId() {
  return 'req_' + Math.random().toString(36).substr(2, 9);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getFromCache(key) {
  // Simple in-memory cache for Cloudflare Workers
  // In production, you might want to use Cloudflare KV or Cache API
  return null; // Placeholder - implement based on your caching strategy
}

async function setCache(key, value, ttl) {
  // Simple in-memory cache for Cloudflare Workers
  // In production, you might want to use Cloudflare KV or Cache API
  // Placeholder - implement based on your caching strategy
}

function createErrorResponse(code, message, status, details = {}) {
  return new Response(JSON.stringify({
    status: 'error',
    error_code: code,
    message: message,
    details: details
  }), {
    status: status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Environment variables (these will be set in wrangler.toml or via Cloudflare dashboard)
const CHATWITH_API_KEY = typeof CHATWITH_API_KEY !== 'undefined' ? CHATWITH_API_KEY : null;
const CHATWITH_CHATBOT_ID = typeof CHATWITH_CHATBOT_ID !== 'undefined' ? CHATWITH_CHATBOT_ID : null;
const GOOGLE_SHEETS_API_KEY = typeof GOOGLE_SHEETS_API_KEY !== 'undefined' ? GOOGLE_SHEETS_API_KEY : null;
const GOOGLE_SHEETS_ID = typeof GOOGLE_SHEETS_ID !== 'undefined' ? GOOGLE_SHEETS_ID : null;