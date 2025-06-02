# WordPress Auto-Tagging API Troubleshooting Guide

Comprehensive troubleshooting guide for common issues, error resolution, and performance optimization of the WordPress Auto-Tagging API.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Authentication Issues](#authentication-issues)
3. [WordPress API Problems](#wordpress-api-problems)
4. [AI Service Issues](#ai-service-issues)
5. [Validation Errors](#validation-errors)
6. [Performance Issues](#performance-issues)
7. [Integration Problems](#integration-problems)
8. [Debugging Procedures](#debugging-procedures)
9. [Error Code Reference](#error-code-reference)
10. [Getting Support](#getting-support)

## Quick Diagnostics

### Step 1: Basic Health Check

Test if the API is responding:

```bash
curl -I https://api.processfy.ai/api/auto-tag
```

**Expected Response:**
```http
HTTP/2 405 Method Not Allowed
Content-Type: application/json
```

✅ **Good:** API is responding (405 is expected for GET requests)
❌ **Bad:** No response, timeout, or 5xx errors

### Step 2: WordPress REST API Check

Verify your WordPress REST API is accessible:

```bash
curl https://yoursite.com/wp-json/wp/v2/
```

**Expected Response:** JSON object with API information

### Step 3: Authentication Test

Test your WordPress credentials:

```bash
curl -H "Authorization: Basic YOUR_BASE64_CREDENTIALS" \
     https://yoursite.com/wp-json/wp/v2/users/me
```

**Expected Response:** Your user information in JSON format

### Step 4: Full API Test

Use the test script for comprehensive testing:

```bash
./scripts/test-api.sh
```

## Authentication Issues

### Error: "401 Unauthorized" or "WORDPRESS_AUTH_FAILED"

#### Symptoms
- API returns 401 status code
- Error message: "Invalid WordPress credentials"
- WordPress authentication fails

#### Common Causes
1. **Incorrect Application Password**
2. **Wrong Base64 encoding**
3. **Insufficient user permissions**
4. **Expired or deleted Application Password**

#### Solutions

**1. Regenerate Application Password**

```bash
# In WordPress Admin:
# 1. Go to Users → Your Profile
# 2. Scroll to "Application Passwords"
# 3. Delete existing password
# 4. Create new one: "Auto-Tagging API v2"
# 5. Copy the new password immediately
```

**2. Verify Base64 Encoding**

```bash
# Correct format (note the colon separator):
echo -n "username:abcd-efgh-ijkl-mnop" | base64

# Common mistakes:
# ❌ Using spaces instead of hyphens in password
# ❌ Including newlines in encoding
# ❌ Wrong username
```

**3. Test Encoding Manually**

```bash
# Test your encoded credentials:
curl -H "Authorization: Basic YOUR_BASE64_HERE" \
     https://yoursite.com/wp-json/wp/v2/users/me

# Should return your user info, not an error
```

**4. Check User Permissions**

Required capabilities:
- `edit_posts` (to modify posts)
- `manage_categories` (to create tags)

**Minimum Role:** Editor or Administrator

```bash
# Test permissions by trying to access posts:
curl -H "Authorization: Basic YOUR_BASE64_HERE" \
     https://yoursite.com/wp-json/wp/v2/posts?per_page=1
```

**5. WordPress Configuration Issues**

Check if Application Passwords are enabled:
- WordPress version must be 5.6+
- Some security plugins disable Application Passwords
- Hosting providers may have restrictions

### Error: "403 Forbidden"

#### Symptoms
- API returns 403 status code
- WordPress API access denied

#### Solutions

**1. Check Security Plugins**
- Temporarily disable security plugins (Wordfence, Sucuri, etc.)
- Add Cloudflare Worker IPs to whitelist
- Check if REST API is disabled

**2. Server Configuration**
- Contact hosting provider about REST API restrictions
- Check if `.htaccess` is blocking API requests
- Verify mod_rewrite is enabled

**3. WordPress Settings**
```php
// Add to wp-config.php if needed:
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

## WordPress API Problems

### Error: "WORDPRESS_RATE_LIMIT" (429)

#### Symptoms
- API returns 429 status code
- Message: "WordPress API rate limit exceeded"

#### Solutions

**1. Implement Retry Logic**
```javascript
async function callAPIWithRetry(data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('https://api.processfy.ai/api/auto-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 60;
        await sleep(retryAfter * 1000);
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
}
```

**2. Reduce Request Frequency**
- Process posts in smaller batches
- Add delays between requests
- Use off-peak hours for bulk processing

**3. Optimize WordPress**
- Increase WordPress API rate limits
- Use caching plugins
- Optimize server resources

### Error: "WORDPRESS_API_ERROR"

#### Symptoms
- Various WordPress-related errors
- Connection timeouts
- Malformed responses

#### Solutions

**1. Check WordPress Health**
```bash
# Test WordPress site accessibility:
curl -I https://yoursite.com

# Test REST API specifically:
curl https://yoursite.com/wp-json/wp/v2/posts?per_page=1
```

**2. Server Issues**
- Check server logs for errors
- Verify PHP memory limits
- Check database connectivity
- Monitor server resources

**3. Plugin Conflicts**
- Deactivate all plugins temporarily
- Test API functionality
- Reactivate plugins one by one to identify conflicts

## AI Service Issues

### Error: "AI_SERVICE_UNAVAILABLE" (503)

#### Symptoms
- API returns 503 status code
- Message: "AI service is temporarily unavailable"
- Circuit breaker may be open

#### Solutions

**1. Check ChatWith API Status**
- Visit ChatWith.tools status page
- Test API directly with their tools
- Check for service announcements

**2. Verify API Credentials**
```bash
# Test ChatWith API directly:
curl -X POST https://api.chatwith.tools/v1/chatbot/YOUR_CHATBOT_ID/chat \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "stream": false}'
```

**3. Wait for Circuit Breaker Reset**
- Circuit breaker opens after 5 consecutive failures
- Automatically resets after 60 seconds
- Monitor Cloudflare Worker logs for reset confirmation

**4. Check API Quotas**
- Verify ChatWith API usage limits
- Check billing status
- Monitor quota consumption

### Error: "AI_INVALID_RESPONSE"

#### Symptoms
- AI returns empty or malformed tag suggestions
- Processing fails during tag parsing

#### Solutions

**1. Check AI Prompt Quality**
- Ensure post content is meaningful
- Verify title and content fields are populated
- Check for special characters or encoding issues

**2. Improve Input Data**
```json
{
  "title": "Clear, descriptive title",
  "content": "Substantial content with context...",
  "league": "Specific league name",
  "home_team": "Clear team name",
  "away_team": "Clear team name"
}
```

**3. Monitor AI Response Quality**
- Check Cloudflare Worker logs for AI responses
- Verify tag parsing logic
- Test with different content types

## Validation Errors

### Error: "Post is not live or tags already exist"

#### Symptoms
- Validation fails with specific message
- Request rejected before processing

#### Solutions

**1. Check Required Conditions**
```json
{
  "is_live": "yes",        // Must be exactly "yes"
  "tags": ""               // Must be empty string, null, or omitted
}
```

**2. Verify Post Status**
- Post must be published in WordPress
- Post must not have existing tags
- Check post status in WordPress admin

**3. Clear Existing Tags**
```bash
# If post has tags, remove them first:
# Go to WordPress admin → Posts → Edit Post → Remove all tags
```

### Error: "Missing required field"

#### Symptoms
- Validation error for specific fields
- Request rejected immediately

#### Solutions

**1. Check Required Fields**
```json
{
  "wp_url": "https://yoursite.com",    // Required
  "wp_auth": "base64_credentials",     // Required
  "post_id": 123,                      // Required (positive integer)
  "is_live": "yes"                     // Required (exactly "yes")
}
```

**2. Validate Field Types**
- `post_id` must be a positive integer
- `wp_url` must be valid URL with protocol
- `wp_auth` must be valid Base64 string

## Performance Issues

### Slow Response Times

#### Symptoms
- API responses take longer than 5 seconds
- Timeouts in automation tools
- High processing times in logs

#### Solutions

**1. Optimize WordPress**
```php
// Add to wp-config.php:
define('WP_MEMORY_LIMIT', '512M');
define('WP_MAX_MEMORY_LIMIT', '512M');
```

**2. Reduce Content Size**
```javascript
// Truncate content for AI processing:
const truncatedContent = content.substring(0, 1000);
```

**3. Monitor Performance**
- Check `processing_time_ms` in responses
- Monitor Cloudflare Worker CPU usage
- Review Google Sheets logs for patterns

**4. Implement Caching**
- WordPress tag caching is built-in (10 minutes)
- Consider caching at automation tool level
- Use CDN for WordPress site

### High Error Rates

#### Symptoms
- Frequent API failures
- Circuit breaker opening frequently
- Inconsistent results

#### Solutions

**1. Implement Robust Error Handling**
```javascript
// Example retry logic with exponential backoff:
async function processWithRetry(data, maxRetries = 3) {
  let delay = 1000; // Start with 1 second
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await callAPI(data);
      return response; // Success
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await sleep(delay);
      delay *= 2; // Exponential backoff
    }
  }
}
```

**2. Monitor System Health**
- Set up alerts for high error rates
- Monitor WordPress server resources
- Track AI API response times

**3. Optimize Request Patterns**
- Avoid burst requests
- Implement queue-based processing
- Use batch processing during off-peak hours

## Integration Problems

### Zapier Integration Issues

#### Common Problems
1. **Webhook timeouts**
2. **Data mapping errors**
3. **Authentication failures**

#### Solutions

**1. Webhook Configuration**
```json
{
  "url": "https://api.processfy.ai/api/auto-tag",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "timeout": 30000
}
```

**2. Data Mapping**
- Ensure all required fields are mapped
- Use static values for `is_live: "yes"`
- Map empty string for `tags` field

**3. Error Handling**
- Configure retry logic in Zapier
- Set up error notifications
- Use filters to prevent invalid requests

### Pabbly Connect Issues

#### Common Problems
1. **HTTP request configuration**
2. **Response parsing errors**
3. **Conditional logic failures**

#### Solutions

**1. HTTP Request Setup**
```json
{
  "url": "https://api.processfy.ai/api/auto-tag",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "wp_url": "{{wp_url}}",
    "wp_auth": "{{wp_auth}}",
    "post_id": "{{post_id}}",
    "is_live": "yes",
    "tags": ""
  }
}
```

**2. Response Handling**
- Parse JSON response properly
- Handle both success and error responses
- Set up conditional paths based on status

### n8n Integration Issues

#### Common Problems
1. **Node configuration errors**
2. **Expression syntax issues**
3. **Error workflow setup**

#### Solutions

**1. HTTP Request Node**
```json
{
  "url": "https://api.processfy.ai/api/auto-tag",
  "method": "POST",
  "body": {
    "wp_url": "={{$node['WordPress'].json['wp_url']}}",
    "wp_auth": "={{$node['WordPress'].json['wp_auth']}}",
    "post_id": "={{$node['WordPress'].json['id']}}",
    "is_live": "yes",
    "tags": ""
  }
}
```

**2. Error Handling Workflow**
- Add error handling nodes
- Configure retry logic
- Set up notification systems

## Debugging Procedures

### Enable Debug Mode

**1. Cloudflare Worker Logs**
```bash
# Monitor real-time logs:
wrangler tail

# Filter for errors:
wrangler tail --format=pretty | grep -i error
```

**2. WordPress Debug Mode**
```php
// Add to wp-config.php:
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);

// Check logs at: /wp-content/debug.log
```

### Request Tracing

**1. Use Request IDs**
Every API response includes a `request_id` for tracking:
```json
{
  "status": "error",
  "request_id": "req_abc123def"
}
```

**2. Log Analysis**
```bash
# Search logs by request ID:
grep "req_abc123def" /var/log/cloudflare-worker.log
```

### Performance Monitoring

**1. Google Sheets Logging**
Monitor these metrics in your Google Sheet:
- Processing times
- Error rates
- AI retry counts
- Success patterns

**2. Cloudflare Analytics**
- Request volume and success rates
- Response times and error rates
- Geographic distribution
- CPU usage patterns

### Testing Procedures

**1. Isolated Component Testing**
```bash
# Test WordPress API only:
curl -H "Authorization: Basic YOUR_BASE64" \
     https://yoursite.com/wp-json/wp/v2/posts/123

# Test ChatWith API only:
curl -X POST https://api.chatwith.tools/v1/chatbot/YOUR_ID/chat \
     -H "Authorization: Bearer YOUR_KEY" \
     -d '{"message": "test"}'
```

**2. End-to-End Testing**
```bash
# Use the provided test script:
./scripts/test-api.sh

# Or manual testing:
curl -X POST https://api.processfy.ai/api/auto-tag \
     -H "Content-Type: application/json" \
     -d @test-payload.json
```

## Error Code Reference

### Quick Reference Table

| Error Code | HTTP Status | Typical Cause | Quick Fix |
|------------|-------------|---------------|-----------|
| `VALIDATION_ERROR` | 400 | Invalid request data | Check required fields |
| `WORDPRESS_AUTH_FAILED` | 401 | Bad credentials | Regenerate Application Password |
| `WORDPRESS_RATE_LIMIT` | 429 | Too many requests | Wait and retry |
| `AI_SERVICE_UNAVAILABLE` | 503 | ChatWith API down | Wait for circuit breaker reset |
| `INTERNAL_ERROR` | 500 | Server error | Contact support with request_id |

### Detailed Error Analysis

**1. Validation Errors (400)**
- Check request format and required fields
- Verify data types (post_id must be integer)
- Ensure `is_live` is exactly "yes"

**2. Authentication Errors (401)**
- Regenerate WordPress Application Password
- Verify Base64 encoding
- Check user permissions

**3. Rate Limiting (429)**
- Implement exponential backoff
- Reduce request frequency
- Use batch processing

**4. Service Unavailable (503)**
- Wait for automatic recovery
- Check external service status
- Verify API credentials

## Getting Support

### Before Contacting Support

1. **Check this troubleshooting guide**
2. **Review API documentation**
3. **Test with provided scripts**
4. **Collect error information**

### Information to Provide

When contacting support, include:

**1. Request Details**
- Request ID from error response
- Timestamp of the issue
- Complete error message

**2. Configuration**
- WordPress version and URL
- Cloudflare Worker configuration
- Integration tool (Zapier, Pabbly, n8n)

**3. Reproduction Steps**
- Exact steps to reproduce the issue
- Sample request payload (remove sensitive data)
- Expected vs actual behavior

**4. Environment**
- WordPress hosting provider
- Active plugins and themes
- Server specifications

### Support Channels

**1. GitHub Issues**
- Create detailed issue report
- Include reproduction steps
- Tag with appropriate labels

**2. Documentation**
- Review setup guides
- Check integration examples
- Follow troubleshooting steps

**3. Community Forums**
- Search existing discussions
- Post detailed questions
- Help other users

### Emergency Procedures

**For Critical Production Issues:**

1. **Immediate Actions**
   - Disable automation temporarily
   - Switch to manual tagging
   - Monitor error rates

2. **Escalation**
   - Contact hosting provider if WordPress issues
   - Check Cloudflare status page
   - Review ChatWith API status

3. **Recovery**
   - Implement temporary workarounds
   - Plan systematic testing
   - Document lessons learned

---

**Remember:** Most issues are configuration-related and can be resolved by carefully following the setup procedures and checking credentials. When in doubt, start with the basic health checks and work through each component systematically.