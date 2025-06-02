# n8n-nodes-wordpress-auto-tagger

![n8n.io - Workflow Automation](https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-logo.png)

This is an n8n community node that provides seamless integration with the WordPress Auto-Tagging API. It allows you to automatically generate and assign AI-powered tags to your WordPress posts directly from your n8n workflows.

## Features

- **AI-Powered Tagging**: Automatically generate intelligent tags using advanced AI
- **WordPress Integration**: Direct integration with WordPress REST API
- **Sports Context Support**: Enhanced tagging for sports content with team and league information
- **Secure Authentication**: Uses WordPress Application Passwords for secure access
- **Error Handling**: Comprehensive error handling with detailed feedback
- **Flexible Configuration**: Support for both basic and advanced use cases

## Installation

### Community Nodes (Recommended)

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install**
3. Enter `n8n-nodes-wordpress-auto-tagger`
4. Agree to the risks of using community nodes: select **I understand the risks of installing unverified code from a public source**
5. Select **Install**

After installation, the **WordPress Auto-Tagger** node will be available in your node palette.

### Manual Installation

If you have n8n installed locally, you can install this node to your global setup.

```bash
cd ~/.n8n
npm install n8n-nodes-wordpress-auto-tagger
```

Or install it to your n8n installation:

```bash
cd /path/to/your/n8n/installation
npm install n8n-nodes-wordpress-auto-tagger
```

For Docker-based installations, add the package to your package.json or install it in your Docker image.

## Prerequisites

Before using this node, you need:

1. **WordPress Site** with REST API enabled
2. **WordPress Application Password** for authentication
3. **WordPress Auto-Tagging API** access

### Setting Up WordPress Application Password

1. Log in to your WordPress admin dashboard
2. Go to **Users > Profile**
3. Scroll down to **Application Passwords** section
4. Enter a name for the application (e.g., "n8n Auto-Tagger")
5. Click **Add New Application Password**
6. Copy the generated password (you won't be able to see it again)

## Configuration

### Credentials

Create a new **WordPress Auto-Tagger API** credential with the following information:

- **WordPress Site URL**: Your WordPress site URL (e.g., `https://yoursite.com`)
- **WordPress Username**: Your WordPress username
- **WordPress Application Password**: The application password you generated
- **API Endpoint**: `https://api.processfy.ai/api/auto-tag` (default)

### Node Parameters

#### Required Parameters

- **Post ID**: The WordPress post ID you want to auto-tag

#### Optional Parameters

- **Post Title**: Provides context for better AI tagging
- **Post Content**: Content to analyze for tag generation
- **Sports Context**: Additional sports-related information
  - **League**: Sports league name (e.g., "Premier League", "NBA")
  - **Home Team**: Home team name
  - **Away Team**: Away team name

#### Advanced Options

- **Force Processing**: Process posts even if they already have tags
- **Timeout**: Request timeout in seconds (default: 30)

## Usage Examples

### Basic Auto-Tagging

```json
{
  "postId": 123,
  "title": "Amazing Football Match",
  "content": "Today's match was incredible..."
}
```

### Sports Content with Context

```json
{
  "postId": 456,
  "title": "Champions League Final",
  "content": "Real Madrid vs Liverpool...",
  "sportsContext": {
    "league": "Champions League",
    "homeTeam": "Real Madrid",
    "awayTeam": "Liverpool"
  }
}
```

### Workflow Integration

This node works great in workflows that:

1. **Monitor WordPress Posts**: Use with WordPress triggers to auto-tag new posts
2. **Bulk Processing**: Process multiple posts from WordPress API responses
3. **Content Pipelines**: Integrate with content creation and publishing workflows
4. **Analytics**: Combine with Google Sheets or databases for tracking

## Output

The node returns the following data:

```json
{
  "success": true,
  "postId": 123,
  "assignedTags": ["football", "champions league", "real madrid"],
  "tagIds": [45, 67, 89],
  "createdTags": ["real madrid"],
  "processingTimeMs": 1500,
  "requestId": "req_abc123",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Output Fields

- **success**: Whether the operation was successful
- **postId**: The WordPress post ID that was processed
- **assignedTags**: Array of tag names assigned to the post
- **tagIds**: WordPress tag IDs corresponding to assigned tags
- **createdTags**: Array of new tags that were created
- **processingTimeMs**: Processing time in milliseconds
- **requestId**: Unique request identifier for debugging
- **timestamp**: When the operation completed

## Error Handling

The node provides comprehensive error handling:

### Common Errors

- **Invalid Post ID**: Post ID must be a positive number
- **Authentication Failed**: Check WordPress credentials
- **API Timeout**: Increase timeout in advanced options
- **Post Already Tagged**: Use "Force Processing" option

### Error Output

When an error occurs, the node returns:

```json
{
  "success": false,
  "error": "Error message",
  "postId": 123,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Troubleshooting

### WordPress Authentication Issues

1. Verify your WordPress username and application password
2. Ensure the user has `edit_posts` and `manage_categories` permissions
3. Check that WordPress REST API is enabled

### API Connection Issues

1. Verify the API endpoint URL
2. Check your internet connection
3. Increase timeout in advanced options

### Post Processing Issues

1. Ensure the post ID exists and is published
2. Check if the post already has tags (use Force Processing if needed)
3. Verify post content is accessible

## API Rate Limits

The WordPress Auto-Tagging API has the following limits:

- **1000 requests per minute per IP**
- **100 requests per minute per WordPress site**
- **50 requests per 10 seconds (burst limit)**

The node automatically handles rate limiting with appropriate error messages.

## Support

For support and documentation:

- **API Documentation**: [WordPress Auto-Tagging API Reference](https://github.com/your-org/wp-auto-tagging-api/blob/main/docs/API_REFERENCE.md)
- **Setup Guide**: [WordPress Auto-Tagging Setup Guide](https://github.com/your-org/wp-auto-tagging-api/blob/main/docs/SETUP_GUIDE.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/n8n-nodes-wordpress-auto-tagger/issues)

## License

[MIT](https://github.com/your-org/n8n-nodes-wordpress-auto-tagger/blob/main/LICENSE.md)

## Version History

### 1.0.0
- Initial release
- Auto-tagging functionality
- WordPress integration
- Sports context support
- Comprehensive error handling