# WordPress Auto-Tagging API

A robust Cloudflare Worker that automatically generates and assigns AI-powered tags to WordPress posts using the ChatWith API. Built for integration with no-code automation tools like Zapier, Pabbly, and n8n.

## Features

- **AI-Powered Tag Generation**: Uses ChatWith API to generate relevant tags based on post content
- **WordPress Integration**: Seamlessly integrates with WordPress REST API using Application Passwords
- **Resilient Architecture**: Implements circuit breakers, exponential backoff, and persistent retry logic
- **Comprehensive Error Handling**: Structured error responses with proper HTTP status codes
- **Google Sheets Logging**: Optional logging for billing and audit purposes
- **No-Code Tool Ready**: Optimized for integration with automation platforms

## Architecture

The API implements a six-layer architecture:

1. **Input Validation Layer**: Validates and sanitizes incoming requests
2. **WordPress Integration Layer**: Handles WordPress REST API interactions with caching
3. **AI Processing Layer**: Generates tags using ChatWith API with persistent retry
4. **Tag Management Logic**: Compares and manages existing vs new tags
5. **Error Handling & Circuit Breaker**: Provides resilient error handling
6. **Google Sheets Integration**: Logs operations for billing and audit

## Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- Cloudflare account with Workers enabled
- WordPress site with Application Passwords enabled
- ChatWith API account and API key

### 2. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd wp-auto-tagging-api

# Install dependencies
npm install

# Install Wrangler CLI globally
npm install -g wrangler
```

### 3. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your actual values
# Then set secrets in Cloudflare Workers
wrangler login
wrangler secret put CHATWITH_API_KEY
wrangler secret put CHATWITH_CHATBOT_ID
wrangler secret put GOOGLE_SHEETS_API_KEY  # Optional
wrangler secret put GOOGLE_SHEETS_ID       # Optional
```

### 4. Development

```bash
# Start local development server
npm run dev

# Test the API locally
curl -X POST http://localhost:8787/api/auto-tag \
  -H "Content-Type: application/json" \
  -d '{
    "wp_url": "https://yoursite.com",
    "wp_auth": "base64_encoded_credentials",
    "post_id": 123,
    "title": "Sample Post Title",
    "content": "Sample post content...",
    "is_live": "yes",
    "tags": ""
  }'
```

### 5. Deployment

```bash
# Deploy to production
npm run deploy

# Deploy to staging
npm run deploy:staging
```

## API Reference

### Endpoint

```
POST https://api.processfy.ai/api/auto-tag
Content-Type: application/json
```

### Request Format

```json
{
  "wp_url": "https://clientsite.com",
  "wp_auth": "Basic BASE64_ENCODED_CREDS",
  "post_id": 123,
  "title": "Match Recap: Team A vs Team B",
  "content": "An exciting match between Team A and Team B...",
  "league": "Premier League",
  "home_team": "Team A",
  "away_team": "Team B",
  "is_live": "yes",
  "tags": ""
}
```

### Success Response

```json
{
  "status": "success",
  "post_id": 123,
  "assigned_tags": ["Premier League", "Team A", "Team B"],
  "tag_ids": [45, 67, 89],
  "created_tags": ["Team A", "Team B"],
  "processing_time_ms": 1250
}
```

### Error Response

```json
{
  "status": "error",
  "error_code": "validation_error",
  "message": "Post is not live or tags already exist.",
  "details": {},
  "request_id": "req_abc123"
}
```

## WordPress Setup

### 1. Enable Application Passwords

1. Go to WordPress Admin → Users → Your Profile
2. Scroll down to "Application Passwords"
3. Enter a name (e.g., "Auto-Tagging API")
4. Click "Add New Application Password"
5. Copy the generated password

### 2. Create Base64 Credentials

```bash
# Format: username:application_password
echo -n "your_username:abcd-efgh-ijkl-mnop" | base64
```

### 3. Required WordPress Permissions

The user account needs:
- `edit_posts` capability
- `manage_categories` capability (for creating tags)

## Integration Examples

### Zapier Integration

1. Create a new Zap
2. Set trigger (e.g., "New WordPress Post")
3. Add "Webhooks by Zapier" action
4. Configure:
   - **URL**: `https://api.processfy.ai/api/auto-tag`
   - **Method**: POST
   - **Data**: Map WordPress fields to API request format

### Pabbly Connect Integration

1. Create new workflow
2. Add WordPress trigger
3. Add "HTTP Request" action
4. Configure POST request to the API endpoint

### n8n Integration

```json
{
  "nodes": [
    {
      "name": "WordPress Trigger",
      "type": "n8n-nodes-base.wordPressTrigger"
    },
    {
      "name": "Auto-Tag API",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.processfy.ai/api/auto-tag",
        "method": "POST",
        "body": {
          "wp_url": "={{$node['WordPress Trigger'].json['wp_url']}}",
          "wp_auth": "={{$node['WordPress Trigger'].json['wp_auth']}}",
          "post_id": "={{$node['WordPress Trigger'].json['id']}}",
          "title": "={{$node['WordPress Trigger'].json['title']['rendered']}}",
          "content": "={{$node['WordPress Trigger'].json['content']['rendered']}}",
          "is_live": "yes",
          "tags": ""
        }
      }
    }
  ]
}
```

## Error Codes

| Code | Description | HTTP Status | Action |
|------|-------------|-------------|---------|
| `VALIDATION_ERROR` | Invalid request data | 400 | Fix request format |
| `WORDPRESS_AUTH_FAILED` | Invalid WordPress credentials | 401 | Check credentials |
| `WORDPRESS_RATE_LIMIT` | WordPress API rate limit | 429 | Wait and retry |
| `AI_SERVICE_UNAVAILABLE` | ChatWith API unavailable | 503 | Wait and retry |
| `INTERNAL_ERROR` | Unexpected server error | 500 | Contact support |

## Monitoring

### Google Sheets Logging

If configured, the API logs all operations to Google Sheets with:
- Timestamp
- Post ID and WordPress URL
- Assigned tags and processing time
- Success/error status
- Request ID for debugging

### Cloudflare Analytics

Monitor your worker performance in the Cloudflare dashboard:
- Request volume and success rates
- Response times and error rates
- CPU usage and memory consumption

## Performance Optimization

### Caching Strategy

- WordPress tags are cached for 10 minutes per site
- Reduces API calls and improves response times
- Cache invalidation on tag creation

### Circuit Breaker

- Opens after 5 consecutive AI API failures
- Prevents cascade failures
- Auto-recovery after 60 seconds

### Retry Logic

- Exponential backoff with jitter
- Persistent retry for AI failures
- Maximum 30-second delay between retries

## Security

### Data Protection

- No sensitive data storage (stateless processing)
- HTTPS enforcement for all communications
- Input validation and sanitization
- Minimal error information disclosure

### Authentication

- WordPress Application Passwords only
- Base64 encoded credentials over HTTPS
- Optional IP whitelisting via Cloudflare

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check WordPress Application Password
   - Verify Base64 encoding
   - Ensure user has required permissions

2. **503 Service Unavailable**
   - ChatWith API may be down
   - Circuit breaker may be open
   - Check API key and chatbot ID

3. **Validation Errors**
   - Ensure `is_live` is exactly "yes"
   - Ensure `tags` field is empty or null
   - Check required fields are present

### Debug Mode

Enable debug logging by setting `ENVIRONMENT=development` in your worker configuration.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section
- Review Cloudflare Workers documentation