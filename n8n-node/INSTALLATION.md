# WordPress Auto-Tagger n8n Node - Installation Guide

This guide will walk you through installing and setting up the WordPress Auto-Tagger custom node for n8n.

## Prerequisites

Before installing this node, ensure you have:

1. **n8n installed** (version 0.190.0 or higher)
2. **WordPress site** with REST API enabled
3. **WordPress user** with Editor or Administrator role
4. **WordPress Application Password** generated

## Installation Methods

### Method 1: Community Nodes (Recommended)

This is the easiest way to install the node if you're using n8n cloud or a recent self-hosted version.

1. **Access n8n Settings**
   - Open your n8n instance
   - Go to **Settings** → **Community Nodes**

2. **Install the Node**
   - Click **Install**
   - Enter: `n8n-nodes-wordpress-auto-tagger`
   - Click **I understand the risks of installing unverified code from a public source**
   - Click **Install**

3. **Verify Installation**
   - The node should appear in your node palette under "WordPress Auto-Tagger"
   - You should see it in the **Transform** category

### Method 2: Manual Installation (Self-Hosted)

For self-hosted n8n installations:

```bash
# Navigate to your n8n installation directory
cd ~/.n8n

# Install the package
npm install n8n-nodes-wordpress-auto-tagger

# Restart n8n
n8n start
```

### Method 3: Docker Installation

For Docker-based n8n installations:

1. **Create a custom Dockerfile**:
```dockerfile
FROM n8nio/n8n:latest

USER root
RUN npm install -g n8n-nodes-wordpress-auto-tagger
USER node
```

2. **Build and run**:
```bash
docker build -t n8n-with-wp-tagger .
docker run -it --rm --name n8n -p 5678:5678 n8n-with-wp-tagger
```

## WordPress Setup

### Step 1: Create Application Password

1. **Log in to WordPress Admin**
   - Go to your WordPress admin dashboard
   - Navigate to **Users** → **Profile**

2. **Generate Application Password**
   - Scroll down to **Application Passwords** section
   - Enter application name: `n8n Auto-Tagger`
   - Click **Add New Application Password**
   - **Copy the generated password** (you won't see it again)

### Step 2: Verify User Permissions

Ensure your WordPress user has these capabilities:
- `edit_posts` - To update posts
- `manage_categories` - To create new tags

**Recommended roles**: Editor or Administrator

### Step 3: Test WordPress API Access

Test your credentials with this curl command:

```bash
curl -u "username:application_password" \
  "https://yoursite.com/wp-json/wp/v2/users/me"
```

Replace:
- `username` with your WordPress username
- `application_password` with the generated password
- `yoursite.com` with your WordPress site URL

## n8n Configuration

### Step 1: Create Credentials

1. **Open n8n**
2. **Go to Credentials**
   - Click on your profile icon
   - Select **Credentials**

3. **Add New Credential**
   - Click **Add Credential**
   - Search for "WordPress Auto-Tagger API"
   - Click on it

4. **Fill in the Details**:
   - **WordPress Site URL**: `https://yoursite.com`
   - **WordPress Username**: Your WordPress username
   - **WordPress Application Password**: The password you generated
   - **API Endpoint**: `https://api.processfy.ai/api/auto-tag` (default)

5. **Test the Connection**
   - Click **Test** to verify your credentials
   - You should see a success message

6. **Save the Credential**
   - Give it a name like "My WordPress Auto-Tagger"
   - Click **Save**

### Step 2: Create Your First Workflow

1. **Create New Workflow**
   - Click **New Workflow**

2. **Add WordPress Auto-Tagger Node**
   - Search for "WordPress Auto-Tagger" in the node palette
   - Drag it to your workflow canvas

3. **Configure the Node**
   - Select your credential
   - Set **Post ID**: Enter a test post ID
   - Add **Post Title** and **Content** for better results

4. **Test the Node**
   - Click **Test step** to run the node
   - Check the output for success

## Example Workflows

### Basic Auto-Tagging

Import the example workflow from `examples/basic-workflow.json`:

1. **Import Workflow**
   - Go to **Workflows**
   - Click **Import from File**
   - Select `basic-workflow.json`

2. **Configure Credentials**
   - Update all credential references
   - Set your WordPress site URL

3. **Activate Workflow**
   - Test the workflow manually first
   - Then activate it for automatic execution

### Advanced Sports Content

For sports websites, use additional context:

```json
{
  "postId": 123,
  "title": "Champions League Final",
  "content": "Real Madrid vs Liverpool...",
  "sportsContext": {
    "league": "Champions League",
    "homeTeam": "Real Madrid",
    "awayTeam": "Liverpool"
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Node Not Appearing
- **Solution**: Restart n8n after installation
- **Check**: Verify the package was installed correctly

#### 2. Credential Test Fails
- **Check**: WordPress Application Password is correct
- **Check**: User has required permissions
- **Check**: WordPress REST API is enabled

#### 3. API Timeout Errors
- **Solution**: Increase timeout in Advanced Options
- **Check**: API endpoint is accessible

#### 4. Post Not Found
- **Check**: Post ID exists and is published
- **Check**: User has access to the post

### Debug Mode

Enable debug mode for detailed error information:

1. **Add Debug Headers** in HTTP Request nodes:
   ```json
   {
     "X-Debug-Mode": "true",
     "X-Request-ID": "debug-{{$runIndex}}"
   }
   ```

2. **Check n8n Logs**:
   ```bash
   # For self-hosted installations
   tail -f ~/.n8n/logs/n8n.log
   ```

### Getting Help

If you encounter issues:

1. **Check the logs** for detailed error messages
2. **Verify your credentials** are correct
3. **Test the API** manually with curl
4. **Check WordPress permissions** for your user
5. **Contact support** with your request ID

## Next Steps

After successful installation:

1. **Create automated workflows** for bulk tagging
2. **Set up monitoring** with Google Sheets integration
3. **Configure error alerts** via email or Slack
4. **Optimize performance** with proper scheduling

For more examples and advanced usage, see the [README.md](README.md) file.