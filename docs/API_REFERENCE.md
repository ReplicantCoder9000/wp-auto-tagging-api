# WordPress Auto-Tagging API Reference

Complete technical reference for the WordPress Auto-Tagging API, including endpoints, request/response schemas, error codes, and authentication details.

## Table of Contents

1. [Base Information](#base-information)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
4. [Request Schema](#request-schema)
5. [Response Schema](#response-schema)
6. [Error Codes](#error-codes)
7. [Rate Limiting](#rate-limiting)
8. [Examples](#examples)
9. [SDKs and Libraries](#sdks-and-libraries)

## Base Information

### API Base URL
```
https://api.processfy.ai/api/auto-tag
```

### API Version
- **Current Version:** v1
- **Protocol:** HTTPS only
- **Content Type:** `application/json`
- **Method:** POST only

### Service Level Agreement
- **Availability:** 99.9% uptime
- **Response Time:** < 2 seconds (95th percentile)
- **Rate Limits:** 1000 requests per minute per IP

## Authentication

The API uses WordPress Application Passwords for authentication. No API keys are required for the auto-tagging endpoint itself.

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

Automatically generates and assigns AI-powered tags to a WordPress post.

**URL:** `https://api.processfy.ai/api/auto-tag`

**Method:** `POST`

**Content-Type:** `application/json`

**Purpose:** Generate intelligent tags for WordPress posts using AI and assign them automatically.

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

```json
{
  "status": "success",
  "post_id": 456,
  "assigned_tags": ["Champions League", "Real Madrid", "Liverpool"],
  "tag_ids": [12, 34, 56],
  "created_tags": ["Real Madrid", "Liverpool"],
  "processing_time_ms": 1847
}
```

#### Success Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Always "success" for successful requests |
| `post_id` | integer | The WordPress post ID that was processed |
| `assigned_tags` | array | List of tag names assigned to the post |
| `tag_ids` | array | WordPress tag IDs corresponding to assigned tags |
| `created_tags` | array | List of new tags that were created |
| `processing_time_ms` | integer | Total processing time in milliseconds |

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
  "request_id": "req_abc123def"
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
| `AI_SERVICE_UNAVAILABLE` | 503 | ChatWith AI service is down | Wait and retry (auto-retry enabled) |
| `WORDPRESS_TAG_CREATE_FAILED` | 500 | Failed to create WordPress tag | Check WordPress configuration |
| `WORDPRESS_TAG_ASSIGN_FAILED` | 500 | Failed to assign tags to post | Check post exists and permissions |
| `INTERNAL_ERROR` | 500 | Unexpected server error | Contact support with request_id |

### Error Response Examples

#### Validation Error
```json
{
  "status": "error",
  "error_code": "VALIDATION_ERROR",
  "message": "Missing required field: wp_url",
  "details": {
    "field": "wp_url"
  },
  "request_id": "req_xyz789"
}
```

#### Authentication Error
```json
{
  "status": "error",
  "error_code": "WORDPRESS_AUTH_FAILED",
  "message": "Invalid WordPress credentials",
  "request_id": "req_def456"
}
```

#### Rate Limit Error
```json
{
  "status": "error",
  "error_code": "WORDPRESS_RATE_LIMIT",
  "message": "WordPress API rate limit exceeded",
  "retry_after": 60,
  "request_id": "req_ghi789"
}
```

## Rate Limiting

### API Rate Limits

- **Per IP:** 1000 requests per minute
- **Per WordPress Site:** 100 requests per minute
- **Burst Limit:** 50 requests per 10 seconds

### Rate Limit Headers

The API includes rate limiting information in response headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded Response

```json
{
  "status": "error",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "message": "API rate limit exceeded",
  "retry_after": 60,
  "request_id": "req_rate123"
}
```

### Best Practices

1. **Implement exponential backoff** for retries
2. **Monitor rate limit headers** in responses
3. **Cache WordPress tag data** when possible
4. **Batch process posts** during off-peak hours

## Examples

### cURL Examples

#### Basic Request
```bash
curl -X POST https://api.processfy.ai/api/auto-tag \
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

#### With Full Sports Context
```bash
curl -X POST https://api.processfy.ai/api/auto-tag \
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

#### Using Fetch API
```javascript
const response = await fetch('https://api.processfy.ai/api/auto-tag', {
  method: 'POST',
  headers: {
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
} else {
  console.error('Error:', result.message);
}
```

#### Using Axios
```javascript
const axios = require('axios');

try {
  const response = await axios.post('https://api.processfy.ai/api/auto-tag', {
    wp_url: 'https://mysite.com',
    wp_auth: 'YWRtaW46YWJjZC1lZmdoLWlqa2w=',
    post_id: 123,
    title: 'My Blog Post',
    content: 'Content of my blog post...',
    is_live: 'yes',
    tags: ''
  });

  console.log('Success:', response.data);
} catch (error) {
  if (error.response) {
    console.error('API Error:', error.response.data);
  } else {
    console.error('Network Error:', error.message);
  }
}
```

### Python Examples

#### Using Requests
```python
import requests
import json

url = 'https://api.processfy.ai/api/auto-tag'
data = {
    'wp_url': 'https://mysite.com',
    'wp_auth': 'YWRtaW46YWJjZC1lZmdoLWlqa2w=',
    'post_id': 123,
    'title': 'My Blog Post',
    'content': 'Content of my blog post...',
    'is_live': 'yes',
    'tags': ''
}

response = requests.post(url, json=data)

if response.status_code == 200:
    result = response.json()
    print(f"Tags assigned: {result['assigned_tags']}")
else:
    error = response.json()
    print(f"Error: {error['message']}")
```

### PHP Examples

#### Using cURL
```php
<?php
$url = 'https://api.processfy.ai/api/auto-tag';
$data = [
    'wp_url' => 'https://mysite.com',
    'wp_auth' => 'YWRtaW46YWJjZC1lZmdoLWlqa2w=',
    'post_id' => 123,
    'title' => 'My Blog Post',
    'content' => 'Content of my blog post...',
    'is_live' => 'yes',
    'tags' => ''
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$result = json_decode($response, true);

if ($httpCode === 200) {
    echo "Tags assigned: " . implode(', ', $result['assigned_tags']);
} else {
    echo "Error: " . $result['message'];
}
?>
```

## SDKs and Libraries

### Official SDKs

Currently, no official SDKs are available. The API is designed to be simple enough to integrate directly using standard HTTP libraries.

### Community Libraries

- **JavaScript/Node.js:** Use standard `fetch()` or `axios`
- **Python:** Use `requests` library
- **PHP:** Use `cURL` or `Guzzle`
- **Ruby:** Use `net/http` or `HTTParty`

### Integration Helpers

For no-code platforms, see our dedicated integration guides:
- [Zapier Integration](integrations/ZAPIER_INTEGRATION.md)
- [Pabbly Integration](integrations/PABBLY_INTEGRATION.md)
- [n8n Integration](integrations/N8N_INTEGRATION.md)

## Testing and Debugging

### Test Endpoint

Use the same endpoint for testing with non-production data:
```
POST https://api.processfy.ai/api/auto-tag
```

### Debug Headers

Include these headers for enhanced debugging:
```http
X-Debug-Mode: true
X-Request-ID: your-custom-id
```

### Monitoring Tools

1. **Request ID Tracking:** Every response includes a `request_id` for support
2. **Processing Time:** Monitor `processing_time_ms` for performance
3. **Error Logging:** All errors are logged with context

### Health Check

Check API availability:
```bash
curl -I https://api.processfy.ai/api/auto-tag
```

Expected response:
```http
HTTP/2 405
content-type: application/json
```

(405 is expected for GET requests - API only accepts POST)

---

**Need Help?** 
- Check our [Setup Guide](SETUP_GUIDE.md) for initial configuration
- Review [Troubleshooting Guide](TROUBLESHOOTING.md) for common issues
- Contact support with your `request_id` for specific error assistance