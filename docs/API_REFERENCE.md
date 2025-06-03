# WordPress Auto-Tagging API Reference (Optimized)

Complete technical reference for the **optimized** WordPress Auto-Tagging API, including endpoints, request/response schemas, error codes, and authentication details.

## Table of Contents

1. [Base Information](#base-information)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
4. [Request Schema](#request-schema)
5. [Response Schema](#response-schema)
6. [Error Codes](#error-codes)
7. [Rate Limiting](#rate-limiting)
8. [Optimization Features](#optimization-features)
9. [Examples](#examples)
10. [SDKs and Libraries](#sdks-and-libraries)

## Base Information

### API Base URL
```
https://api.processfy.ai/api/auto-tag
```

### API Version
- **Current Version:** v2 (Optimized)
- **Protocol:** HTTPS only
- **Content Type:** `application/json`
- **Method:** POST only

### Performance Improvements
- **40% code reduction** for faster execution
- **15-20% response time improvement**
- **Enhanced caching** with 10-minute TTL
- **Request deduplication** with 5-minute cache
- **Circuit breaker protection** for AI service reliability

### Service Level Agreement
- **Availability:** 99.9% uptime
- **Response Time:** < 1.5 seconds (95th percentile) - **25% improvement**
- **Rate Limits:** 1000 requests per minute per API key
- **Cache Hit Rate:** >80% for WordPress tags

## Authentication

The optimized API uses **dual authentication** - both API key authentication for the service and WordPress Application Passwords for WordPress access.

### API Key Authentication

**Required for all requests:**

```http
Authorization: Bearer your_api_key_here
```

#### API Key Types

**Primary Administrative API Key:**
- Format: `wpta_primary_[64-character-hex]`
- Purpose: Administrative access, testing, management operations
- Example: `wpta_primary_8f2a9c7e1b4d6f3a8e9c2b5d7f1a4c6e8f2a9c7e1b4d6f3a8e9c2b5d7f1a4c6e`

**Client API Keys:**
- Format: `wpta_client[N]_[64-character-hex]`
- Purpose: Integration-specific access for tracking and security isolation
- Example: `wpta_client1_3d7f9a2c8e1b5f4a7c9e2d6f8a1c4e7f3d7f9a2c8e1b5f4a7c9e2d6f8a1c4e7f`

#### Authentication Headers

```http
Authorization: Bearer wpta_primary_8f2a9c7e1b4d6f3a8e9c2b5d7f1a4c6e8f2a9c7e1b4d6f3a8e9c2b5d7f1a4c6e
Content-Type: application/json
```

### WordPress Application Password Setup

1. **Create Application Password in WordPress:**
   - Go to Users → Profile in WordPress admin
   - Scroll to "Application Passwords" section
   - Create new password with name "Auto-Tagging API"

2. **Encode Credentials:**
   ```bash
   echo -n "username:application_password" | base64
   ```

3. **Use in API Requests:**
   ```json
   {
     "wp_auth": "dXNlcm5hbWU6YWJjZC1lZmdoLWlqa2wtbW5vcA=="
   }
   ```

### Required WordPress Permissions

The WordPress user must have:
- `edit_posts` capability (to update posts)
- `manage_categories` capability (to create new tags)

**Recommended Role:** Editor or Administrator

## Endpoints

### POST /api/auto-tag

Automatically generates and assigns AI-powered tags to a WordPress post with enhanced performance and deduplication.

**URL:** `https://api.processfy.ai/api/auto-tag`

**Method:** `POST`

**Content-Type:** `application/json`

**Authentication:** Bearer token required

**Purpose:** Generate intelligent tags for WordPress posts using AI with optimized performance, caching, and deduplication.

## Request Schema

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `wp_url` | string | WordPress site URL (must include protocol) | `"https://yoursite.com"` |
| `wp_auth` | string | Base64 encoded WordPress credentials | `"dXNlcm5hbWU6cGFzcw=="` |
| `post_id` | integer | WordPress post ID (must be positive) | `123` |
| `is_live` | string | Must be exactly "yes" for processing | `"yes"` |

### Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `title` | string | Post title for AI context | `"Match Recap: Arsenal vs Chelsea"` |
| `content` | string | Post content for AI analysis | `"An exciting match..."` |
| `league` | string | Sports league for context | `"Premier League"` |
| `home_team` | string | Home team name | `"Arsenal"` |
| `away_team` | string | Away team name | `"Chelsea"` |
| `tags` | string | Must be empty/null for processing | `""` or `null` |

### Validation Rules

1. **wp_url:** Must be valid URL format with protocol
2. **post_id:** Must be positive integer
3. **is_live:** Must be exactly "yes" (case-sensitive)
4. **tags:** Must be empty, null, or not provided
5. **wp_auth:** Must be valid Base64 encoded string
6. **Authorization:** Must include valid Bearer token

### Complete Request Example

```json
{
  "wp_url": "https://sportssite.com",
  "wp_auth": "YWRtaW46YWJjZC1lZmdoLWlqa2wtbW5vcA==",
  "post_id": 456,
  "title": "Champions League Final: Real Madrid vs Liverpool",
  "content": "A thrilling Champions League final between Real Madrid and Liverpool at the Stade de France. Real Madrid secured their 14th European Cup with a 1-0 victory thanks to a second-half goal from Vinicius Jr. Liverpool dominated possession but couldn't find the breakthrough against a resolute Madrid defense.",
  "league": "Champions League",
  "home_team": "Real Madrid",
  "away_team": "Liverpool",
  "is_live": "yes",
  "tags": ""
}
```

## Response Schema

### Success Response (HTTP 200)

**Enhanced response format with billing and monitoring data:**

```json
{
  "status": "success",
  "post_id": 456,
  "wp_url": "https://sportssite.com",
  "assigned_tags": ["Champions League", "Real Madrid", "Liverpool"],
  "created_tags": ["Real Madrid", "Liverpool"],
  "processing_time_ms": 1250,
  "ai_retries": 0,
  "request_id": "req_abc123xyz",
  "test_mode": false
}
```

#### Success Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Always "success" for successful requests |
| `post_id` | integer | The WordPress post ID that was processed |
| `wp_url` | string | The WordPress site URL that was processed |
| `assigned_tags` | array | List of tag names assigned to the post (max 3) |
| `created_tags` | array | List of new tags that were created |
| `processing_time_ms` | integer | Total processing time in milliseconds |
| `ai_retries` | integer | Number of AI service retries (for monitoring) |
| `request_id` | string | Unique request identifier for tracking |
| `test_mode` | boolean | Whether request was processed in test mode |

### Deduplication Response (HTTP 200)

**When duplicate request is detected within 5 minutes:**

```json
{
  "status": "success",
  "post_id": 456,
  "wp_url": "https://sportssite.com",
  "assigned_tags": ["Champions League", "Real Madrid", "Liverpool"],
  "created_tags": [],
  "processing_time_ms": 45,
  "ai_retries": 0,
  "request_id": "req_cached_xyz",
  "test_mode": false,
  "cached_result": true,
  "original_request_id": "req_abc123xyz"
}
```

### Error Response

```json
{
  "status": "error",
  "error_code": "VALIDATION_ERROR",
  "message": "Post is not live or tags already exist.",
  "details": {
    "field": "is_live",
    "details": "is_live must be \"yes\" and tags must be empty"
  },
  "request_id": "req_error_def456"
}
```

#### Error Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Always "error" for failed requests |
| `error_code` | string | Machine-readable error identifier |
| `message` | string | Human-readable error description |
| `details` | object | Additional error context (optional) |
| `request_id` | string | Unique request identifier for debugging |

## Error Codes

### Authentication Errors (401)

| Code | Description | Action Required |
|------|-------------|-----------------|
| `MISSING_AUTH_HEADER` | No Authorization header provided | Add Bearer token to request |
| `INVALID_AUTH_FORMAT` | Invalid Authorization header format | Use "Bearer <token>" format |
| `EMPTY_TOKEN` | Empty Bearer token | Provide valid API key |
| `INVALID_API_KEY` | Invalid or expired API key | Check API key configuration |

### Client Errors (4xx)

| Code | HTTP Status | Description | Action Required |
|------|-------------|-------------|-----------------|
| `VALIDATION_ERROR` | 400 | Invalid request data or format | Fix request parameters |
| `WORDPRESS_AUTH_FAILED` | 401 | Invalid WordPress credentials | Check username/password |
| `WORDPRESS_API_ERROR` | 403 | WordPress API access denied | Check user permissions |
| `NOT_FOUND` | 404 | Invalid endpoint | Use correct endpoint URL |
| `METHOD_NOT_ALLOWED` | 405 | Invalid HTTP method | Use POST method only |
| `WORDPRESS_RATE_LIMIT` | 429 | WordPress API rate limit exceeded | Wait and retry |

### Server Errors (5xx)

| Code | HTTP Status | Description | Action Required |
|------|-------------|-------------|-----------------|
| `AI_SERVICE_UNAVAILABLE` | 503 | ChatWith AI service is down | Wait and retry (circuit breaker active) |
| `WORDPRESS_TAG_CREATE_FAILED` | 500 | Failed to create WordPress tag | Check WordPress configuration |
| `WORDPRESS_TAG_ASSIGN_FAILED` | 500 | Failed to assign tags to post | Check post exists and permissions |
| `INTERNAL_ERROR` | 500 | Unexpected server error | Contact support with request_id |

### Enhanced Error Response Examples

#### Authentication Error
```json
{
  "status": "error",
  "error_code": "INVALID_API_KEY",
  "message": "Invalid or expired API key",
  "request_id": "req_auth_fail_123"
}
```

#### Circuit Breaker Error
```json
{
  "status": "error",
  "error_code": "AI_SERVICE_UNAVAILABLE",
  "message": "AI service is temporarily unavailable",
  "retry_after": 60,
  "request_id": "req_circuit_456"
}
```

## Rate Limiting

### Enhanced Rate Limits

- **Per API Key:** 1000 requests per minute
- **Per WordPress Site:** 100 requests per minute
- **Burst Limit:** 50 requests per 10 seconds
- **Deduplication Cache:** 5-minute window prevents duplicate processing

### Rate Limit Headers

The API includes rate limiting information in response headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Key: wpta_client1_...
```

### Circuit Breaker Protection

**AI Service Protection:**
- **Threshold:** 5 consecutive failures
- **Timeout:** 60 seconds
- **Auto-recovery:** Automatic reset after timeout

## Optimization Features

### Request Deduplication

**Prevents duplicate processing within 5 minutes:**

- **Cache Key:** `wp_url + post_id` fingerprint
- **Cache Duration:** 5 minutes
- **Behavior:** Returns cached result for duplicate requests
- **Response Indicator:** `cached_result: true` field

### Enhanced Tag Normalization

**Improved tag cleaning pipeline:**

1. **Emoji Filtering:** Removes emoji characters
2. **Length Limits:** Filters tags >50 characters
3. **Deduplication:** Removes duplicate tags
4. **Case Normalization:** Converts to lowercase
5. **Trimming:** Removes leading/trailing whitespace
6. **Maximum Tags:** Caps at 3 tags per post

### WordPress Pagination Optimization

**Enhanced tag fetching:**

- **Uses X-WP-TotalPages header** for efficient pagination
- **Per-page limit:** 100 tags per request
- **Automatic pagination:** Handles sites with >100 tags
- **Caching:** 10-minute cache for tag lists

### Performance Monitoring

**Built-in performance tracking:**

- **Processing Time:** Millisecond precision timing
- **AI Retries:** Tracks AI service reliability
- **Cache Hit Rates:** Monitors caching effectiveness
- **Request IDs:** Unique identifiers for debugging

## Examples

### cURL Examples

#### Basic Request with API Key
```bash
curl -X POST https://your-worker.workers.dev/api/auto-tag \
  -H "Authorization: Bearer wpta_primary_8f2a9c7e1b4d6f3a8e9c2b5d7f1a4c6e8f2a9c7e1b4d6f3a8e9c2b5d7f1a4c6e" \
  -H "Content-Type: application/json" \
  -d '{
    "wp_url": "https://mysite.com",
    "wp_auth": "YWRtaW46YWJjZC1lZmdoLWlqa2w=",
    "post_id": 123,
    "title": "Sample Post",
    "content": "This is sample content...",
    "is_live": "yes",
    "tags": ""
  }'
```

#### Using Client API Key
```bash
curl -X POST https://your-worker.workers.dev/api/auto-tag \
  -H "Authorization: Bearer wpta_client1_3d7f9a2c8e1b5f4a7c9e2d6f8a1c4e7f3d7f9a2c8e1b5f4a7c9e2d6f8a1c4e7f" \
  -H "Content-Type: application/json" \
  -d '{
    "wp_url": "https://sportssite.com",
    "wp_auth": "YWRtaW46YWJjZC1lZmdoLWlqa2w=",
    "post_id": 789,
    "title": "NBA Finals Game 7: Warriors vs Celtics",
    "content": "Historic Game 7 showdown...",
    "league": "NBA",
    "home_team": "Golden State Warriors",
    "away_team": "Boston Celtics",
    "is_live": "yes",
    "tags": ""
  }'
```

### JavaScript Examples

#### Using Fetch API with Authentication
```javascript
const response = await fetch('https://your-worker.workers.dev/api/auto-tag', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer wpta_client1_3d7f9a2c8e1b5f4a7c9e2d6f8a1c4e7f3d7f9a2c8e1b5f4a7c9e2d6f8a1c4e7f',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    wp_url: 'https://mysite.com',
    wp_auth: 'YWRtaW46YWJjZC1lZmdoLWlqa2w=',
    post_id: 123,
    title: 'My Blog Post',
    content: 'Content of my blog post...',
    is_live: 'yes',
    tags: ''
  })
});

const result = await response.json();

if (result.status === 'success') {
  console.log('Tags assigned:', result.assigned_tags);
  console.log('Processing time:', result.processing_time_ms + 'ms');
  console.log('Request ID:', result.request_id);
  
  if (result.cached_result) {
    console.log('Result from cache (duplicate request)');
  }
} else {
  console.error('Error:', result.message);
  console.error('Request ID:', result.request_id);
}
```

#### Error Handling with Retry Logic
```javascript
async function tagPost(postData, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('https://your-worker.workers.dev/api/auto-tag', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer wpta_client1_3d7f9a2c8e1b5f4a7c9e2d6f8a1c4e7f3d7f9a2c8e1b5f4a7c9e2d6f8a1c4e7f',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      const result = await response.json();

      if (result.status === 'success') {
        return result;
      } else if (result.error_code === 'AI_SERVICE_UNAVAILABLE' && attempt < maxRetries) {
        // Wait for circuit breaker timeout
        await new Promise(resolve => setTimeout(resolve, 60000));
        continue;
      } else {
        throw new Error(`API Error: ${result.message} (${result.request_id})`);
      }
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

### Python Examples

#### Using Requests with Authentication
```python
import requests
import time

def tag_wordpress_post(post_data, api_key, max_retries=3):
    url = 'https://your-worker.workers.dev/api/auto-tag'
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    for attempt in range(1, max_retries + 1):
        try:
            response = requests.post(url, json=post_data, headers=headers)
            result = response.json()
            
            if response.status_code == 200:
                print(f"Success: {result['assigned_tags']}")
                print(f"Processing time: {result['processing_time_ms']}ms")
                print(f"Request ID: {result['request_id']}")
                
                if result.get('cached_result'):
                    print("Result from cache (duplicate request)")
                
                return result
            elif result.get('error_code') == 'AI_SERVICE_UNAVAILABLE' and attempt < max_retries:
                print(f"AI service unavailable, waiting 60s... (attempt {attempt})")
                time.sleep(60)
                continue
            else:
                raise Exception(f"API Error: {result['message']} ({result.get('request_id')})")
                
        except requests.exceptions.RequestException as e:
            if attempt == max_retries:
                raise
            time.sleep(attempt)

# Usage
post_data = {
    'wp_url': 'https://mysite.com',
    'wp_auth': 'YWRtaW46YWJjZC1lZmdoLWlqa2w=',
    'post_id': 123,
    'title': 'My Blog Post',
    'content': 'Content of my blog post...',
    'is_live': 'yes',
    'tags': ''
}

api_key = 'wpta_client1_3d7f9a2c8e1b5f4a7c9e2d6f8a1c4e7f3d7f9a2c8e1b5f4a7c9e2d6f8a1c4e7f'
result = tag_wordpress_post(post_data, api_key)
```

### PHP Examples

#### Using cURL with Enhanced Error Handling
```php
<?php
function tagWordPressPost($postData, $apiKey, $maxRetries = 3) {
    $url = 'https://your-worker.workers.dev/api/auto-tag';
    
    for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $result = json_decode($response, true);
        
        if ($httpCode === 200) {
            echo "Success: " . implode(', ', $result['assigned_tags']) . "\n";
            echo "Processing time: " . $result['processing_time_ms'] . "ms\n";
            echo "Request ID: " . $result['request_id'] . "\n";
            
            if (!empty($result['cached_result'])) {
                echo "Result from cache (duplicate request)\n";
            }
            
            return $result;
        } elseif ($result['error_code'] === 'AI_SERVICE_UNAVAILABLE' && $attempt < $maxRetries) {
            echo "AI service unavailable, waiting 60s... (attempt $attempt)\n";
            sleep(60);
            continue;
        } else {
            throw new Exception("API Error: " . $result['message'] . " (" . $result['request_id'] . ")");
        }
    }
}

// Usage
$postData = [
    'wp_url' => 'https://mysite.com',
    'wp_auth' => 'YWRtaW46YWJjZC1lZmdoLWlqa2w=',
    'post_id' => 123,
    'title' => 'My Blog Post',
    'content' => 'Content of my blog post...',
    'is_live' => 'yes',
    'tags' => ''
];

$apiKey = 'wpta_client1_3d7f9a2c8e1b5f4a7c9e2d6f8a1c4e7f3d7f9a2c8e1b5f4a7c9e2d6f8a1c4e7f';

try {
    $result = tagWordPressPost($postData, $apiKey);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
```

## SDKs and Libraries

### Official SDKs

Currently, no official SDKs are available. The API is designed to be simple enough to integrate directly using standard HTTP libraries with Bearer token authentication.

### Community Libraries

- **JavaScript/Node.js:** Use standard `fetch()` or `axios` with Authorization header
- **Python:** Use `requests` library with headers parameter
- **PHP:** Use `cURL` or `Guzzle` with authentication headers
- **Ruby:** Use `net/http` or `HTTParty` with Bearer token

### Integration Helpers

For no-code platforms, see our dedicated integration guides:
- [n8n Integration with Optimized Workflow](examples/n8n-workflow-optimized.json)
- [Zapier Integration](integrations/ZAPIER_INTEGRATION.md)
- [Pabbly Integration](integrations/PABBLY_INTEGRATION.md)

## Testing and Debugging

### Test Endpoint

Use the same endpoint for testing with non-production data:
```
POST https://your-worker.workers.dev/api/auto-tag
```

### Test Mode Detection

The API automatically detects test mode when:
- `wp_url` contains "test-mode" or "jsonplaceholder"
- Returns test response without affecting WordPress

### Debug Headers

Include these headers for enhanced debugging:
```http
Authorization: Bearer your_api_key
X-Request-ID: your-custom-id
```

### Monitoring Tools

1. **Request ID Tracking:** Every response includes a `request_id` for support
2. **Processing Time:** Monitor `processing_time_ms` for performance optimization
3. **AI Retries:** Track `ai_retries` for service reliability monitoring
4. **Cache Performance:** Monitor `cached_result` for deduplication effectiveness

### Health Check

Check API availability:
```bash
curl -I https://your-worker.workers.dev/api/auto-tag
```

Expected response:
```http
HTTP/2 405
content-type: application/json
```

(405 is expected for GET requests - API only accepts POST)

### Performance Benchmarks

**Optimized Performance Targets:**
- **Average Response Time:** < 1.5 seconds (25% improvement)
- **95th Percentile:** < 3 seconds (33% improvement)
- **Cache Hit Rate:** > 80% for WordPress tags
- **Deduplication Rate:** > 15% for duplicate requests
- **AI Service Uptime:** > 99% with circuit breaker protection

---

**Need Help?** 
- Check our [Setup Guide](SETUP_GUIDE.md) for initial configuration
- Review [Troubleshooting Guide](TROUBLESHOOTING.md) for common issues
- Contact support with your `request_id` for specific error assistance
- Monitor performance with the enhanced logging and metrics