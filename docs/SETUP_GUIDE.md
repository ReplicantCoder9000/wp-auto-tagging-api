# WordPress Auto-Tagging API Setup Guide

This comprehensive guide will walk you through setting up the WordPress Auto-Tagging API from scratch. No coding experience required!

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [WordPress Application Password Setup](#wordpress-application-password-setup)
3. [ChatWith AI Account Setup](#chatwith-ai-account-setup)
4. [Cloudflare Workers Deployment](#cloudflare-workers-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Testing Your Setup](#testing-your-setup)
7. [Google Sheets Integration (Optional)](#google-sheets-integration-optional)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, make sure you have:

- A WordPress website with admin access
- A Cloudflare account (free tier is sufficient)
- A ChatWith AI account and API access
- Basic computer skills (copy/paste, following instructions)

**Time Required:** 30-45 minutes for complete setup

## WordPress Application Password Setup

WordPress Application Passwords provide secure API access without exposing your main login credentials.

### Step 1: Enable Application Passwords

1. **Log into your WordPress admin dashboard**
2. **Navigate to Users → Your Profile** (or Users → All Users → [Your Username])
3. **Scroll down to the "Application Passwords" section**

   *Screenshot would show: WordPress admin profile page with Application Passwords section highlighted*

4. **If you don't see this section**, your WordPress version might be older than 5.6. Update WordPress or ask your hosting provider for assistance.

### Step 2: Create Application Password

1. **In the "Application Passwords" section:**
   - Enter a descriptive name: `Auto-Tagging API`
   - Click **"Add New Application Password"**

   *Screenshot would show: Application password creation form with name field filled*

2. **Copy the generated password immediately** - it will only be shown once!
   - The password looks like: `abcd efgh ijkl mnop`
   - Store it securely (you'll need it later)

   *Screenshot would show: Generated application password display*

### Step 3: Create Base64 Encoded Credentials

You need to encode your WordPress username and application password for API authentication.

**Method 1: Online Tool (Easiest)**
1. Go to [base64encode.org](https://www.base64encode.org/)
2. Enter: `your_username:abcd-efgh-ijkl-mnop` (replace with your actual username and password)
3. Click "Encode"
4. Copy the result (it will look like: `YWRtaW46YWJjZC1lZmdoLWlqa2wtbW5vcA==`)

**Method 2: Command Line (Mac/Linux)**
```bash
echo -n "your_username:abcd-efgh-ijkl-mnop" | base64
```

**Method 3: Windows PowerShell**
```powershell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("your_username:abcd-efgh-ijkl-mnop"))
```

**⚠️ Important Security Notes:**
- Replace spaces in the application password with hyphens
- Never share your encoded credentials
- Store them securely (password manager recommended)

### Step 4: Verify WordPress Permissions

Ensure your user account has the required permissions:

1. **Go to Users → All Users**
2. **Click on your username**
3. **Check the "Role" field** - it should be:
   - Administrator (recommended)
   - Editor (minimum required)

If you're not an Administrator or Editor, contact your site administrator.

## ChatWith AI Account Setup

ChatWith AI provides the intelligent tag generation for your WordPress posts.

### Step 1: Create ChatWith Account

1. **Visit [ChatWith.tools](https://chatwith.tools)**
2. **Sign up for an account** or log in if you already have one
3. **Complete the onboarding process**

### Step 2: Get API Credentials

1. **Navigate to your ChatWith dashboard**
2. **Go to Settings → API Keys** (or similar section)

   *Screenshot would show: ChatWith dashboard with API section highlighted*

3. **Generate a new API key:**
   - Click "Create New API Key"
   - Give it a name: `WordPress Auto-Tagging`
   - Copy the API key immediately

4. **Find your Chatbot ID:**
   - Go to your chatbot settings
   - Look for "Chatbot ID" or "Bot ID"
   - Copy this identifier

**Keep these credentials secure** - you'll need them for the Cloudflare Workers setup.

## Cloudflare Workers Deployment

Cloudflare Workers will host your auto-tagging API with global performance and reliability.

### Step 1: Create Cloudflare Account

1. **Visit [cloudflare.com](https://cloudflare.com)**
2. **Sign up for a free account** or log in
3. **Complete email verification**

### Step 2: Enable Workers

1. **In your Cloudflare dashboard, click "Workers & Pages"**
2. **Click "Create Application"**
3. **Choose "Create Worker"**

   *Screenshot would show: Cloudflare Workers creation interface*

### Step 3: Deploy the Auto-Tagging Worker

**Option A: Using Wrangler CLI (Recommended)**

1. **Install Node.js** (if not already installed):
   - Visit [nodejs.org](https://nodejs.org)
   - Download and install the LTS version

2. **Install Wrangler CLI:**
   ```bash
   npm install -g wrangler
   ```

3. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```
   This will open a browser window for authentication.

4. **Clone or download the API code:**
   ```bash
   git clone [repository-url]
   cd wp-auto-tagging-api
   ```

5. **Deploy the worker:**
   ```bash
   npm install
   npm run deploy
   ```

**Option B: Manual Deployment**

1. **In Cloudflare Workers dashboard, click "Create a Worker"**
2. **Copy the entire contents of `src/index.js`** from the repository
3. **Paste it into the Cloudflare Workers editor**
4. **Click "Save and Deploy"**

### Step 4: Configure Worker Settings

1. **In your worker dashboard, go to "Settings" → "Variables"**
2. **Add the following environment variables:**

   **Regular Variables:**
   - `ENVIRONMENT`: `production`
   - `MAX_RETRIES`: `10`
   - `CACHE_TTL`: `600`

   **Encrypted Variables (Secrets):**
   - `CHATWITH_API_KEY`: [Your ChatWith API key]
   - `CHATWITH_CHATBOT_ID`: [Your ChatWith Chatbot ID]

3. **To add secrets via CLI:**
   ```bash
   wrangler secret put CHATWITH_API_KEY
   wrangler secret put CHATWITH_CHATBOT_ID
   ```

### Step 5: Set Up Custom Domain (Optional)

1. **In Workers dashboard, go to "Triggers"**
2. **Click "Add Custom Domain"**
3. **Enter your desired subdomain:** `api.yourdomain.com`
4. **Follow the DNS setup instructions**

Your API will be available at: `https://api.yourdomain.com/api/auto-tag`

## Environment Configuration

### Configuration File Setup

1. **Create a `.env` file** in your project directory (if using local development):
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your actual values:
   ```env
   # ChatWith AI Configuration
   CHATWITH_API_KEY=your_actual_api_key_here
   CHATWITH_CHATBOT_ID=your_actual_chatbot_id_here
   
   # Google Sheets Integration (Optional)
   GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key
   GOOGLE_SHEETS_ID=your_google_sheet_id
   
   # Worker Configuration
   MAX_RETRIES=10
   CACHE_TTL=600
   CIRCUIT_BREAKER_THRESHOLD=5
   CIRCUIT_BREAKER_TIMEOUT=60000
   
   # Development Settings
   ENVIRONMENT=production
   ```

### Cloudflare Worker Configuration

Your `wrangler.toml` file should look like this:

```toml
name = "wp-auto-tagging-api"
main = "src/index.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

# Environment variables (non-sensitive)
[vars]
ENVIRONMENT = "production"
MAX_RETRIES = "10"
CACHE_TTL = "600"
CIRCUIT_BREAKER_THRESHOLD = "5"
CIRCUIT_BREAKER_TIMEOUT = "60000"

# Route configuration (update with your domain)
[[routes]]
pattern = "api.yourdomain.com/api/auto-tag"
zone_name = "yourdomain.com"
```

## Testing Your Setup

### Step 1: Basic API Test

Test your API endpoint to ensure it's working:

```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/api/auto-tag \
  -H "Content-Type: application/json" \
  -d '{
    "wp_url": "https://yoursite.com",
    "wp_auth": "your_base64_encoded_credentials",
    "post_id": 123,
    "title": "Test Post Title",
    "content": "This is a test post content for tag generation.",
    "is_live": "yes",
    "tags": ""
  }'
```

### Step 2: Expected Success Response

```json
{
  "status": "success",
  "post_id": 123,
  "assigned_tags": ["Test", "Content", "WordPress"],
  "tag_ids": [45, 67, 89],
  "created_tags": ["Test", "Content"],
  "processing_time_ms": 1250
}
```

### Step 3: WordPress Integration Test

1. **Create a test post in WordPress**
2. **Ensure the post is published** (`is_live` = "yes")
3. **Ensure the post has no tags** (`tags` = empty)
4. **Use the test script:**
   ```bash
   ./scripts/test-api.sh
   ```

### Step 4: Verify Tag Assignment

1. **Go to your WordPress admin**
2. **Navigate to Posts → All Posts**
3. **Check that your test post now has tags assigned**
4. **Verify new tags were created in Posts → Tags**

## Google Sheets Integration (Optional)

Google Sheets integration provides logging for billing, auditing, and monitoring purposes.

### Step 1: Create Google Cloud Project

1. **Go to [Google Cloud Console](https://console.cloud.google.com)**
2. **Create a new project** or select existing one
3. **Enable the Google Sheets API:**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### Step 2: Create Service Account

1. **Go to "APIs & Services" → "Credentials"**
2. **Click "Create Credentials" → "Service Account"**
3. **Fill in the details:**
   - Name: `WordPress Auto-Tagging Logger`
   - Description: `Service account for logging auto-tagging operations`
4. **Click "Create and Continue"**
5. **Skip role assignment** (click "Continue")
6. **Click "Done"**

### Step 3: Generate API Key

1. **In the Credentials page, click "Create Credentials" → "API Key"**
2. **Copy the generated API key**
3. **Click "Restrict Key" for security:**
   - Under "API restrictions", select "Restrict key"
   - Choose "Google Sheets API"
   - Click "Save"

### Step 4: Create Google Sheet

1. **Create a new Google Sheet**
2. **Name it:** `WordPress Auto-Tagging Logs`
3. **Set up the header row (Row 1):**
   ```
   A1: Timestamp
   B1: Post ID
   C1: WordPress URL
   D1: Assigned Tags
   E1: Processing Time (ms)
   F1: AI Retries
   G1: Status
   H1: Error Code
   I1: Error Message
   J1: Request ID
   ```

4. **Make the sheet publicly readable:**
   - Click "Share" button
   - Change access to "Anyone with the link can view"
   - Copy the sheet ID from the URL

### Step 5: Configure Sheet Integration

1. **Add the Google Sheets credentials to your worker:**
   ```bash
   wrangler secret put GOOGLE_SHEETS_API_KEY
   wrangler secret put GOOGLE_SHEETS_ID
   ```

2. **The sheet ID is found in the URL:**
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```

## Troubleshooting

### Common Issues and Solutions

#### 1. "401 Unauthorized" Error

**Symptoms:** API returns authentication error
**Causes:**
- Incorrect WordPress Application Password
- Wrong Base64 encoding
- Insufficient user permissions

**Solutions:**
1. **Regenerate Application Password:**
   - Go to WordPress → Users → Profile
   - Delete old application password
   - Create new one with same name

2. **Verify Base64 encoding:**
   ```bash
   echo -n "username:password" | base64
   ```

3. **Check user permissions:**
   - User must be Administrator or Editor
   - Test with: `curl -H "Authorization: Basic [your_base64]" https://yoursite.com/wp-json/wp/v2/users/me`

#### 2. "503 Service Unavailable" Error

**Symptoms:** AI service unavailable message
**Causes:**
- ChatWith API is down
- Circuit breaker is open
- Invalid API credentials

**Solutions:**
1. **Check ChatWith API status**
2. **Verify API credentials in Cloudflare Workers**
3. **Wait 60 seconds for circuit breaker to reset**

#### 3. "Validation Error" Messages

**Symptoms:** Request validation fails
**Common Issues:**
- `is_live` is not exactly "yes"
- `tags` field is not empty
- Missing required fields

**Solutions:**
1. **Ensure exact values:**
   ```json
   {
     "is_live": "yes",
     "tags": ""
   }
   ```

2. **Check all required fields are present:**
   - `wp_url`, `wp_auth`, `post_id`, `is_live`

#### 4. WordPress REST API Not Accessible

**Symptoms:** Cannot connect to WordPress API
**Causes:**
- REST API disabled
- Security plugins blocking access
- Server configuration issues

**Solutions:**
1. **Test REST API directly:**
   ```bash
   curl https://yoursite.com/wp-json/wp/v2/
   ```

2. **Check security plugins:**
   - Temporarily disable security plugins
   - Whitelist the Cloudflare Worker IP ranges

3. **Contact hosting provider** if issues persist

### Getting Help

If you're still experiencing issues:

1. **Check Cloudflare Worker logs:**
   ```bash
   wrangler tail
   ```

2. **Review the API documentation** in [`API_REFERENCE.md`](API_REFERENCE.md)

3. **Test with the provided scripts:**
   ```bash
   ./scripts/test-api.sh
   ./scripts/validate.js
   ```

4. **Check the troubleshooting guide** in [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)

## Next Steps

Once your setup is complete:

1. **Configure your automation tools** (Zapier, Pabbly, n8n)
2. **Set up monitoring** with Google Sheets logging
3. **Review security settings** and access controls
4. **Test with real WordPress posts**

**Congratulations!** Your WordPress Auto-Tagging API is now ready to automatically generate and assign intelligent tags to your WordPress posts.

---

**Need Help?** Check our integration guides:
- [Zapier Integration](integrations/ZAPIER_INTEGRATION.md)
- [Pabbly Integration](integrations/PABBLY_INTEGRATION.md)
- [n8n Integration](integrations/N8N_INTEGRATION.md)