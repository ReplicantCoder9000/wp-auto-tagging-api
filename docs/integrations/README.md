# Integration Guides

This directory contains integration guides and examples for connecting the WordPress Auto-Tagging API with various automation platforms.

## Available Integrations

### Zapier Integration
- **File:** [`ZAPIER_INTEGRATION.md`](ZAPIER_INTEGRATION.md)
- **Description:** Complete guide for setting up WordPress auto-tagging with Zapier
- **Features:** Webhook configuration, data mapping, error handling, conditional logic
- **Difficulty:** Beginner-friendly

### Example Workflows
- **Zapier Workflow:** [`../examples/zapier-workflow.json`](../examples/zapier-workflow.json)
- **n8n Workflow:** [`../examples/n8n-workflow.json`](../examples/n8n-workflow.json)
- **Google Sheets Template:** [`../examples/google-sheets-template.csv`](../examples/google-sheets-template.csv)

## Integration Patterns

### Common Workflow Pattern
1. **Trigger:** New WordPress post published
2. **Filter:** Only posts without existing tags (`is_live=yes`, `tags=empty`)
3. **API Call:** Send post data to Auto-Tagging API
4. **Response Handling:** Process success/error responses
5. **Logging:** Record operations for monitoring and billing

### Required Data Mapping
```json
{
  "wp_url": "https://yoursite.com",
  "wp_auth": "base64_encoded_credentials",
  "post_id": 123,
  "title": "Post Title",
  "content": "Post content (truncated to 500-1000 chars)",
  "is_live": "yes",
  "tags": ""
}
```

### Error Handling Strategy
- **401 Unauthorized:** Check WordPress Application Password
- **429 Rate Limit:** Implement exponential backoff retry
- **503 Service Unavailable:** Wait for circuit breaker reset
- **Validation Errors:** Verify request format and required fields

## Platform-Specific Notes

### Zapier
- Use "Webhooks by Zapier" for API calls
- Store credentials in Zapier Storage
- Implement Paths for response handling
- Use Delay for retry logic

### Pabbly Connect
- Use "HTTP Request" action
- Configure JSON body mapping
- Set up Router for response handling
- Implement conditional retry logic

### n8n
- Use "HTTP Request" node
- Configure JSON expression mapping
- Use "IF" nodes for conditional logic
- Set up error handling workflows

### Make (Integromat)
- Use "HTTP" module
- Configure JSON body structure
- Use "Router" for response handling
- Set up error handling scenarios

## Security Best Practices

### WordPress Authentication
- Use Application Passwords (not regular passwords)
- Store credentials securely in platform vaults
- Regenerate passwords regularly
- Use minimum required user permissions

### API Security
- Always use HTTPS endpoints
- Implement request timeouts
- Monitor for unusual activity
- Log all operations for audit trails

## Monitoring and Logging

### Google Sheets Integration
- Set up automated logging for all operations
- Track success rates and processing times
- Monitor error patterns and frequencies
- Generate billing and usage reports

### Key Metrics to Track
- **Success Rate:** Percentage of successful tagging operations
- **Processing Time:** Average API response time
- **Error Frequency:** Rate of different error types
- **Usage Volume:** Number of posts processed per day/month

## Getting Started

1. **Choose your automation platform** (Zapier, Pabbly, n8n, etc.)
2. **Follow the setup guide** in [`../SETUP_GUIDE.md`](../SETUP_GUIDE.md)
3. **Configure WordPress Application Passwords**
4. **Use the appropriate integration guide** or example workflow
5. **Test with sample posts** before going live
6. **Set up monitoring and logging**

## Support and Troubleshooting

- **API Reference:** [`../API_REFERENCE.md`](../API_REFERENCE.md)
- **Troubleshooting Guide:** [`../TROUBLESHOOTING.md`](../TROUBLESHOOTING.md)
- **Google Sheets Setup:** [`../GOOGLE_SHEETS_SETUP.md`](../GOOGLE_SHEETS_SETUP.md)

For platform-specific issues, consult your automation platform's documentation and support resources.