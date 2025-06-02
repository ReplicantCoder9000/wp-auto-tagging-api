# Zapier Integration Guide

Complete guide for integrating the WordPress Auto-Tagging API with Zapier to automate tag generation for your WordPress posts.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Basic Zapier Setup](#basic-zapier-setup)
4. [Webhook Configuration](#webhook-configuration)
5. [Data Mapping](#data-mapping)
6. [Conditional Logic](#conditional-logic)
7. [Error Handling](#error-handling)
8. [Example Workflows](#example-workflows)
9. [Advanced Features](#advanced-features)
10. [Troubleshooting](#troubleshooting)

## Overview

### What You'll Build

A Zapier automation that:
- **Triggers** when new WordPress posts are published
- **Checks** if posts need tagging (is_live=yes, tags=empty)
- **Calls** the Auto-Tagging API to generate intelligent tags
- **Handles** responses and errors gracefully
- **Logs** results for monitoring

### Integration Benefits

- **Zero-code automation** - no programming required
- **Real-time processing** - tags applied immediately when posts are published
- **Robust error handling** - built-in retry logic and notifications
- **Easy monitoring** - Zapier provides detailed logs and analytics
- **Scalable** - handles high-volume WordPress sites

### Prerequisites

- Zapier account (free tier sufficient for testing)
- WordPress Auto-Tagging API deployed and configured
- WordPress site with Application Passwords enabled
- Basic understanding of Zapier workflows

**Time Required:** 15-30 minutes

## Basic Zapier Setup

### Step 1: Create New Zap

1. **Log into your Zapier account**
2. **Click "Create Zap"** in the top navigation
3. **Choose a descriptive name:** "WordPress Auto-Tagging"

   *Screenshot would show: Zapier Zap creation interface*

### Step 2: Set Up Trigger

**Choose WordPress as Trigger App:**

1. **Search for "WordPress"** in the trigger app selection
2. **Select "WordPress"** from the results
3. **Choose trigger event:** "New Post"

   *Screenshot would show: WordPress trigger selection*

4. **Connect your WordPress account:**
   - **WordPress Site URL:** `https://yoursite.com`
   - **Username:** Your WordPress username
   - **Password:** Your WordPress Application Password (not regular password)

   *Screenshot would show: WordPress connection form*

5. **Configure trigger settings:**
   - **Post Status:** "Published" (to ensure posts are live)
   - **Post Type:** "Posts" (or specific post types you want to tag)

6. **Test the trigger** to ensure it can fetch your WordPress posts

### Step 3: Add Filter (Important!)

Before calling the API, add a filter to ensure we only process posts that need tagging:

1. **Click "+" to add a step**
2. **Choose "Filter by Zapier"**
3. **Set up filter conditions:**

   **Condition 1:** Post Status
   - **Field:** `status`
   - **Condition:** `(Text) Exactly matches`
   - **Value:** `publish`

   **Condition 2:** Tags are Empty
   - **Field:** `tags` (or tag count)
   - **Condition:** `(Number) Less than`
   - **Value:** `1`

   *Screenshot would show: Zapier filter configuration*

4. **Set logic to "AND"** (both conditions must be true)

## Webhook Configuration

### Step 1: Add Webhooks Action

1. **Click "+" to add an action step**
2. **Search for "Webhooks"**
3. **Select "Webhooks by Zapier"**
4. **Choose action:** "POST"

   *Screenshot would show: Webhooks by Zapier selection*

### Step 2: Configure Webhook Settings

**Basic Configuration:**

1. **URL:** `https://api.processfy.ai/api/auto-tag`
2. **Payload Type:** `json`
3. **Method:** `POST`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

### Step 3: Set Up Authentication

You'll need to create Base64 encoded credentials for WordPress authentication:

**Create Base64 Credentials:**
1. **Format:** `username:application_password`
2. **Encode using online tool** or command line:
   ```bash
   echo -n "your_username:abcd-efgh-ijkl-mnop" | base64
   ```
3. **Result looks like:** `dXNlcm5hbWU6YWJjZC1lZmdoLWlqa2w=`

**Store in Zapier:**
1. **Go to your Zapier account settings**
2. **Navigate to "Storage"** (for storing reusable values)
3. **Add new storage item:**
   - **Key:** `wp_auth_credentials`
   - **Value:** Your Base64 encoded credentials

## Data Mapping

### Step 1: Configure Request Body

In the Webhooks action, set up the data payload:

**Required Fields:**
```json
{
  "wp_url": "{{1.meta__links__self__0__href | replace: '/wp-json/wp/v2/posts/' + 1.id, ''}}",
  "wp_auth": "{{storage.wp_auth_credentials}}",
  "post_id": "{{1.id}}",
  "is_live": "yes",
  "tags": ""
}
```

**Optional Fields (Recommended for Better AI Results):**
```json
{
  "wp_url": "{{1.meta__links__self__0__href | replace: '/wp-json/wp/v2/posts/' + 1.id, ''}}",
  "wp_auth": "{{storage.wp_auth_credentials}}",
  "post_id": "{{1.id}}",
  "title": "{{1.title__rendered}}",
  "content": "{{1.content__rendered | truncate: 1000}}",
  "is_live": "yes",
  "tags": ""
}
```

### Step 2: Handle Dynamic WordPress URL

If you manage multiple WordPress sites, you can extract the URL dynamically:

**Method 1: From Post Meta Links**
```json
{
  "wp_url": "{{1.meta__links__self__0__href | replace: '/wp-json/wp/v2/posts/' + 1.id, ''}}"
}
```

**Method 2: Static Configuration**
```json
{
  "wp_url": "https://yoursite.com"
}
```

### Step 3: Content Optimization

For better AI tag generation, optimize the content field:

**Truncate Long Content:**
```json
{
  "content": "{{1.content__rendered | truncate: 500 | strip_html}}"
}
```

**Extract Excerpt if Available:**
```json
{
  "content": "{{1.excerpt__rendered | default: 1.content__rendered | truncate: 500 | strip_html}}"
}
```

## Conditional Logic

### Step 1: Add Response Handling

After the webhook action, add conditional logic to handle different responses:

1. **Add "Paths by Zapier"** action
2. **Set up paths based on webhook response:**

**Path A: Success Response**
- **Condition:** `status` (Text) Exactly matches `success`
- **Actions:** Log success, send notification, update tracking sheet

**Path B: Error Response**
- **Condition:** `status` (Text) Exactly matches `error`
- **Actions:** Log error, send alert, retry logic

### Step 2: Success Path Actions

**Log Successful Tagging:**
1. **Add Google Sheets action** (optional)
2. **Add row with:**
   - Timestamp
   - Post ID
   - Assigned tags
   - Processing time

**Send Success Notification:**
1. **Add Email or Slack action**
2. **Message:** "Successfully tagged post {{1.id}} with tags: {{2.assigned_tags}}"

### Step 3: Error Path Actions

**Log Errors:**
1. **Add Google Sheets action** to error log
2. **Include:**
   - Error code
   - Error message
   - Post details
   - Timestamp

**Send Error Alerts:**
1. **Add Email/Slack notification**
2. **Message:** "Failed to tag post {{1.id}}: {{2.message}}"

**Retry Logic:**
1. **Add delay** (5-10 minutes)
2. **Add webhook retry** with same payload
3. **Limit retries** to prevent infinite loops

## Error Handling

### Step 1: Configure Webhook Error Handling

In the Webhooks action settings:

1. **Unflatten:** Yes (to properly parse nested JSON responses)
2. **Wrap Request In Array:** No
3. **Basic Auth:** Leave empty (we're using custom headers)

### Step 2: Handle Common Error Scenarios

**Authentication Errors (401):**
```javascript
// In a Code by Zapier action:
if (inputData.status_code === 401) {
  // Send alert to admin
  // Check and regenerate WordPress Application Password
  return {
    action: 'regenerate_credentials',
    message: 'WordPress authentication failed'
  };
}
```

**Rate Limiting (429):**
```javascript
if (inputData.status_code === 429) {
  // Implement exponential backoff
  const delay = Math.min(60, Math.pow(2, inputData.retry_count || 0));
  return {
    action: 'retry_after',
    delay_seconds: delay
  };
}
```

**AI Service Unavailable (503):**
```javascript
if (inputData.error_code === 'AI_SERVICE_UNAVAILABLE') {
  return {
    action: 'retry_later',
    delay_minutes: 5,
    max_retries: 3
  };
}
```

### Step 3: Implement Retry Logic

**Using Zapier Delay:**
1. **Add "Delay by Zapier" action**
2. **Set delay based on error type:**
   - Authentication errors: 0 seconds (immediate alert)
   - Rate limiting: 60 seconds
   - Service unavailable: 300 seconds (5 minutes)

**Retry Counter:**
1. **Use Zapier Storage** to track retry attempts
2. **Increment counter** on each retry
3. **Stop retrying** after maximum attempts

## Example Workflows

### Example 1: Basic Auto-Tagging

**Trigger:** New WordPress Post (Published)
**Filter:** Post has no tags
**Action:** Call Auto-Tagging API
**Response:** Log results

```yaml
Workflow Steps:
1. WordPress - New Post (Published)
2. Filter - Only posts without tags
3. Webhooks - POST to Auto-Tagging API
4. Paths - Handle success/error responses
   A. Success: Log to Google Sheets
   B. Error: Send email alert
```

### Example 2: Advanced Workflow with Retry

**Enhanced workflow with comprehensive error handling:**

```yaml
Workflow Steps:
1. WordPress - New Post (Published)
2. Filter - Post status = published AND tag count = 0
3. Storage - Get WordPress credentials
4. Webhooks - POST to Auto-Tagging API
5. Paths - Response handling
   A. Success Path:
      - Google Sheets - Log success
      - Slack - Success notification
   B. Error Path:
      - Code - Determine retry strategy
      - Delay - Wait based on error type
      - Webhooks - Retry API call (max 3 times)
      - Email - Alert if all retries fail
```

### Example 3: Multi-Site Management

**For managing multiple WordPress sites:**

```yaml
Workflow Steps:
1. WordPress - New Post (any site)
2. Filter - Post needs tagging
3. Code - Determine site-specific credentials
4. Storage - Get credentials for specific site
5. Webhooks - POST with site-specific auth
6. Google Sheets - Log with site identifier
```

### Example 4: Content-Specific Tagging

**Different tagging strategies based on content type:**

```yaml
Workflow Steps:
1. WordPress - New Post
2. Paths - Content type detection
   A. Sports Content:
      - Extract team names and league
      - Call API with sports context
   B. News Content:
      - Extract key topics
      - Call API with news context
   C. General Content:
      - Use standard tagging
3. Consolidate results
4. Log and notify
```

## Advanced Features

### Custom Field Integration

**Extract Custom Fields for Better Context:**

```json
{
  "wp_url": "https://yoursite.com",
  "wp_auth": "{{storage.wp_auth_credentials}}",
  "post_id": "{{1.id}}",
  "title": "{{1.title__rendered}}",
  "content": "{{1.content__rendered | truncate: 500}}",
  "league": "{{1.meta__league}}",
  "home_team": "{{1.meta__home_team}}",
  "away_team": "{{1.meta__away_team}}",
  "is_live": "yes",
  "tags": ""
}
```

### Batch Processing

**Process Multiple Posts at Once:**

1. **Use "Schedule by Zapier"** as trigger
2. **WordPress action:** Get recent posts
3. **Loop through posts** using "Looping by Zapier"
4. **Filter each post** for tagging criteria
5. **Call API** for each qualifying post

### Analytics and Reporting

**Track Performance Metrics:**

```json
// Google Sheets logging with analytics
{
  "timestamp": "{{zap_meta_utc_iso}}",
  "post_id": "{{1.id}}",
  "post_title": "{{1.title__rendered}}",
  "assigned_tags": "{{2.assigned_tags | join: ', '}}",
  "processing_time": "{{2.processing_time_ms}}",
  "ai_retries": "{{2.ai_retries | default: 0}}",
  "success": "{{2.status}}",
  "site_url": "{{1.meta__links__self__0__href | replace: '/wp-json/wp/v2/posts/' + 1.id, ''}}"
}
```

### Conditional Tagging Rules

**Apply Different Rules Based on Content:**

```javascript
// Code by Zapier - Custom tagging logic
const postContent = inputData.content.toLowerCase();
const postTitle = inputData.title.toLowerCase();

// Determine if this is sports content
const isSports = postContent.includes('game') || 
                 postContent.includes('match') || 
                 postTitle.includes('vs');

// Determine if this is news content
const isNews = postContent.includes('breaking') || 
               postContent.includes('update') || 
               postTitle.includes('news');

// Set different API parameters based on content type
let apiPayload = {
  wp_url: inputData.wp_url,
  wp_auth: inputData.wp_auth,
  post_id: inputData.post_id,
  title: inputData.title,
  content: inputData.content,
  is_live: "yes",
  tags: ""
};

if (isSports) {
  apiPayload.league = inputData.league || "General Sports";
  apiPayload.home_team = inputData.home_team;
  apiPayload.away_team = inputData.away_team;
}

return apiPayload;
```

## Troubleshooting

### Common Issues

**1. Webhook Timeouts**

*Symptoms:* Zap fails with timeout error
*Solutions:*
- Increase webhook timeout in Zapier settings
- Check API response times
- Implement async processing if needed

**2. Authentication Failures**

*Symptoms:* 401 errors from WordPress
*Solutions:*
- Regenerate WordPress Application Password
- Verify Base64 encoding is correct
- Check user permissions in WordPress

**3. Filter Not Working**

*Symptoms:* API called for posts that already have tags
*Solutions:*
- Check filter conditions are correct
- Verify tag field mapping
- Test filter with sample data

**4. Data Mapping Errors**

*Symptoms:* API receives incorrect data format
*Solutions:*
- Test webhook with sample data
- Check field mappings in Zapier
- Verify JSON structure

### Debugging Procedures

**1. Enable Detailed Logging**

In your Zap settings:
- Enable "Detailed Logging"
- Check execution history for each step
- Review webhook request/response data

**2. Test Individual Steps**

- Test each Zap step independently
- Use Zapier's "Test" feature
- Verify data flow between steps

**3. Monitor API Responses**

```javascript
// Add logging step after webhook
console.log('API Response:', inputData);
console.log('Status Code:', inputData.status_code);
console.log('Response Body:', inputData.body);
```

**4. Check WordPress Logs**

- Enable WordPress debug logging
- Check for REST API errors
- Monitor server resources

### Performance Optimization

**1. Reduce API Calls**

- Use filters to prevent unnecessary calls
- Batch process during off-peak hours
- Cache results when possible

**2. Optimize Content Size**

```json
{
  "content": "{{1.content__rendered | strip_html | truncate: 500}}"
}
```

**3. Implement Smart Retries**

```javascript
// Exponential backoff for retries
const retryCount = inputData.retry_count || 0;
const delay = Math.min(300, Math.pow(2, retryCount) * 10);

return {
  delay_seconds: delay,
  max_retries: 3
};
```

### Testing Procedures

**1. End-to-End Testing**

1. Create test WordPress post
2. Ensure post has no tags
3. Publish post
4. Monitor Zap execution
5. Verify tags are assigned
6. Check logs and notifications

**2. Error Scenario Testing**

1. Test with invalid credentials
2. Test with posts that already have tags
3. Test with malformed content
4. Verify error handling works correctly

**3. Load Testing**

1. Publish multiple posts quickly
2. Monitor Zap performance
3. Check for rate limiting issues
4. Verify all posts are processed

---

**Congratulations!** Your Zapier integration is now set up to automatically generate and assign intelligent tags to your WordPress posts. The workflow will handle errors gracefully and provide comprehensive logging for monitoring and debugging.

**Next Steps:**
- Set up monitoring and alerts
- Configure additional workflows for different content types
- Optimize performance based on usage patterns
- Review and analyze tagging effectiveness