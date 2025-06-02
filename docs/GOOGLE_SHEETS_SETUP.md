# Google Sheets Integration Setup Guide

This guide walks you through setting up Google Sheets integration for logging, billing, and audit purposes with the WordPress Auto-Tagging API.

## Table of Contents

1. [Overview](#overview)
2. [Google Cloud Setup](#google-cloud-setup)
3. [Google Sheets Configuration](#google-sheets-configuration)
4. [API Integration](#api-integration)
5. [Sheet Structure](#sheet-structure)
6. [Billing and Audit Setup](#billing-and-audit-setup)
7. [Advanced Features](#advanced-features)
8. [Troubleshooting](#troubleshooting)

## Overview

### What You'll Achieve

- **Automatic logging** of all API operations
- **Billing tracking** with processing times and costs
- **Audit trail** for compliance and monitoring
- **Performance analytics** with charts and insights
- **Error tracking** and debugging information

### Prerequisites

- Google account with access to Google Cloud Console
- Google Sheets access
- WordPress Auto-Tagging API already deployed
- Basic understanding of Google Sheets

**Time Required:** 20-30 minutes

## Google Cloud Setup

### Step 1: Create Google Cloud Project

1. **Go to [Google Cloud Console](https://console.cloud.google.com)**
2. **Click "Select a project" dropdown** at the top
3. **Click "New Project"**

   *Screenshot would show: Google Cloud Console project selection dropdown*

4. **Fill in project details:**
   - **Project name:** `WordPress Auto-Tagging Logger`
   - **Organization:** (leave default or select your org)
   - **Location:** (leave default)

5. **Click "Create"**

### Step 2: Enable Google Sheets API

1. **In the Google Cloud Console, go to "APIs & Services" → "Library"**

   *Screenshot would show: Google Cloud Console APIs & Services navigation*

2. **Search for "Google Sheets API"**
3. **Click on "Google Sheets API" from results**
4. **Click "Enable"**

   *Screenshot would show: Google Sheets API enable button*

5. **Wait for activation** (usually takes a few seconds)

### Step 3: Create API Key

1. **Go to "APIs & Services" → "Credentials"**
2. **Click "Create Credentials" → "API Key"**

   *Screenshot would show: Credentials creation dropdown*

3. **Copy the generated API key immediately**
   - Store it securely (you'll need it later)
   - The key looks like: `AIzaSyD...`

4. **Click "Restrict Key" for security:**
   - **Application restrictions:** None (or set IP restrictions if needed)
   - **API restrictions:** Select "Restrict key"
   - **Select APIs:** Choose "Google Sheets API"
   - **Click "Save"**

   *Screenshot would show: API key restriction settings*

### Step 4: Optional - Create Service Account (Advanced)

For enhanced security, you can create a service account instead of using an API key:

1. **Go to "APIs & Services" → "Credentials"**
2. **Click "Create Credentials" → "Service Account"**
3. **Fill in details:**
   - **Service account name:** `wp-auto-tagging-logger`
   - **Description:** `Service account for WordPress auto-tagging logs`
4. **Click "Create and Continue"**
5. **Skip role assignment** (click "Continue")
6. **Click "Done"**

## Google Sheets Configuration

### Step 1: Create Logging Spreadsheet

1. **Go to [Google Sheets](https://sheets.google.com)**
2. **Click "Blank" to create new spreadsheet**
3. **Rename the spreadsheet:** `WordPress Auto-Tagging Logs`

   *Screenshot would show: Google Sheets with renamed spreadsheet*

### Step 2: Set Up Sheet Structure

**Create the main "Logs" sheet with these headers in Row 1:**

| Column | Header | Description |
|--------|--------|-------------|
| A | Timestamp | When the operation occurred |
| B | Post ID | WordPress post ID |
| C | WordPress URL | The WordPress site URL |
| D | Assigned Tags | Tags that were assigned |
| E | Processing Time (ms) | How long the operation took |
| F | AI Retries | Number of AI API retries |
| G | Status | success or error |
| H | Error Code | Error code if failed |
| I | Error Message | Error description if failed |
| J | Request ID | Unique identifier for debugging |

**Copy and paste this header row:**
```
Timestamp	Post ID	WordPress URL	Assigned Tags	Processing Time (ms)	AI Retries	Status	Error Code	Error Message	Request ID
```

### Step 3: Format the Sheet

1. **Select Row 1** (header row)
2. **Format the headers:**
   - **Bold:** Ctrl+B (Cmd+B on Mac)
   - **Background color:** Light blue or gray
   - **Text alignment:** Center

3. **Set column widths:**
   - **Column A (Timestamp):** 150px
   - **Column B (Post ID):** 80px
   - **Column C (WordPress URL):** 200px
   - **Column D (Assigned Tags):** 200px
   - **Column E (Processing Time):** 120px
   - **Column F (AI Retries):** 80px
   - **Column G (Status):** 80px
   - **Column H (Error Code):** 120px
   - **Column I (Error Message):** 200px
   - **Column J (Request ID):** 120px

4. **Freeze the header row:**
   - **Select Row 2**
   - **Go to View → Freeze → 1 row**

### Step 4: Configure Sheet Permissions

1. **Click "Share" button** in top-right corner
2. **Set sharing permissions:**
   - **General access:** "Anyone with the link"
   - **Permission level:** "Viewer" (API only needs to append data)

   *Screenshot would show: Google Sheets sharing dialog*

3. **Copy the sharing link**
4. **Extract the Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```
   The SHEET_ID is the long string between `/d/` and `/edit`

### Step 5: Test Sheet Access

Test that your API key can access the sheet:

```bash
curl "https://sheets.googleapis.com/v4/spreadsheets/YOUR_SHEET_ID/values/Logs!A1:J1?key=YOUR_API_KEY"
```

**Expected response:** JSON with your header row data

## API Integration

### Step 1: Configure Cloudflare Worker

Add your Google Sheets credentials to the Cloudflare Worker:

**Using Wrangler CLI:**
```bash
wrangler secret put GOOGLE_SHEETS_API_KEY
# Enter your API key when prompted

wrangler secret put GOOGLE_SHEETS_ID
# Enter your Sheet ID when prompted
```

**Using Cloudflare Dashboard:**
1. **Go to your Worker in Cloudflare Dashboard**
2. **Click "Settings" → "Variables"**
3. **Add encrypted variables:**
   - **Variable name:** `GOOGLE_SHEETS_API_KEY`
   - **Value:** Your Google Sheets API key
   - **Click "Encrypt" and "Save"**
   
4. **Add second variable:**
   - **Variable name:** `GOOGLE_SHEETS_ID`
   - **Value:** Your Google Sheet ID
   - **Click "Encrypt" and "Save"**

### Step 2: Verify Integration

Test the integration by making an API call:

```bash
curl -X POST https://api.processfy.ai/api/auto-tag \
  -H "Content-Type: application/json" \
  -d '{
    "wp_url": "https://yoursite.com",
    "wp_auth": "your_base64_credentials",
    "post_id": 123,
    "title": "Test Post for Logging",
    "content": "This is a test to verify Google Sheets logging.",
    "is_live": "yes",
    "tags": ""
  }'
```

**Check your Google Sheet** - you should see a new row with the operation details.

### Step 3: Configure Logging Options

You can customize what gets logged by modifying the worker configuration:

```javascript
// In your worker environment variables:
GOOGLE_SHEETS_ENABLED=true
GOOGLE_SHEETS_LOG_ERRORS_ONLY=false  // Set to true to log only errors
GOOGLE_SHEETS_LOG_SUCCESS_ONLY=false // Set to true to log only successes
```

## Sheet Structure

### Main Logs Sheet

The primary sheet contains all operation logs:

```
| Timestamp           | Post ID | WordPress URL      | Assigned Tags        | Processing Time | AI Retries | Status  | Error Code | Error Message | Request ID  |
|--------------------|---------|--------------------|---------------------|----------------|------------|---------|------------|---------------|-------------|
| 2024-01-15 10:30:15| 123     | https://site.com   | Sports, Football, NFL| 1250           | 0          | success |            |               | req_abc123  |
| 2024-01-15 10:31:22| 124     | https://site.com   |                     | 2100           | 2          | error   | AI_TIMEOUT | AI service... | req_def456  |
```

### Optional: Create Summary Sheets

**1. Daily Summary Sheet**

Create a new sheet named "Daily Summary" with:

```
| Date       | Total Requests | Successful | Failed | Avg Processing Time | Total AI Retries |
|------------|---------------|------------|--------|-------------------|------------------|
| 2024-01-15 | 150           | 145        | 5      | 1350ms            | 12               |
```

**2. Error Analysis Sheet**

Create a new sheet named "Error Analysis" with:

```
| Error Code              | Count | Last Occurrence     | Description           |
|------------------------|-------|--------------------|-----------------------|
| WORDPRESS_AUTH_FAILED  | 3     | 2024-01-15 10:45   | Invalid credentials   |
| AI_SERVICE_UNAVAILABLE| 2     | 2024-01-15 09:30   | ChatWith API down     |
```

### Advanced Formulas

Add these formulas to automate calculations:

**1. Success Rate (in a summary cell):**
```
=COUNTIF(G:G,"success")/COUNTA(G:G)-1
```

**2. Average Processing Time:**
```
=AVERAGE(E:E)
```

**3. Daily Request Count:**
```
=COUNTIFS(A:A,">="&TODAY(),A:A,"<"&TODAY()+1)
```

## Billing and Audit Setup

### Step 1: Create Billing Sheet

1. **Add a new sheet** named "Billing"
2. **Set up columns:**

```
| Date       | Requests | Processing Time (total) | Cost per Request | Total Cost | Notes |
|------------|----------|------------------------|------------------|------------|-------|
| 2024-01-15 | 150      | 202,500ms              | $0.001           | $0.15      |       |
```

### Step 2: Billing Formulas

**Daily request count:**
```
=COUNTIFS(Logs.A:A,">="&A2,Logs.A:A,"<"&A2+1)
```

**Total processing time:**
```
=SUMIFS(Logs.E:E,Logs.A:A,">="&A2,Logs.A:A,"<"&A2+1)
```

**Cost calculation (adjust rate as needed):**
```
=B2*$D$1  // Where D1 contains your cost per request
```

### Step 3: Audit Trail Setup

**1. Create "Audit" sheet with:**

```
| Timestamp | Event Type | Details | User | IP Address | Request ID |
|-----------|------------|---------|------|------------|------------|
```

**2. Track these events:**
- API configuration changes
- Authentication failures
- Unusual request patterns
- Error spikes

### Step 4: Automated Reports

**1. Set up Google Sheets notifications:**
- **Go to Tools → Notification rules**
- **Set up alerts for:**
  - Error rate above 5%
  - Processing time above 5 seconds
  - More than 10 requests per minute

**2. Create charts for visualization:**
- **Request volume over time**
- **Success vs error rates**
- **Processing time trends**
- **Most common error types**

## Advanced Features

### Conditional Formatting

**1. Status Column Formatting:**
- **Select column G (Status)**
- **Format → Conditional formatting**
- **Format cells if:** "Text is exactly" "success"
- **Background color:** Light green
- **Add another rule for "error"** with light red background

**2. Processing Time Alerts:**
- **Select column E (Processing Time)**
- **Add rule:** "Greater than" 3000
- **Background color:** Orange (indicates slow requests)

### Data Validation

**1. Status Column Validation:**
- **Select column G**
- **Data → Data validation**
- **Criteria:** "List of items"
- **Items:** success, error

### Automated Cleanup

**1. Archive Old Data:**
Create a script to move old data to archive sheets:

```javascript
function archiveOldData() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep 30 days
  
  // Move older data to archive sheet
  // Implementation depends on your needs
}
```

**2. Set up triggers:**
- **Go to Extensions → Apps Script**
- **Set up time-driven triggers** for cleanup

### Integration with Other Tools

**1. Google Data Studio:**
- Connect your sheet to Data Studio
- Create dashboards and reports
- Share with stakeholders

**2. BigQuery Export:**
- For large-scale analytics
- Set up automated exports
- Use SQL for complex queries

## Troubleshooting

### Common Issues

**1. "Permission denied" errors:**
- Check sheet sharing settings
- Verify API key restrictions
- Ensure sheet is publicly readable

**2. "Invalid range" errors:**
- Verify sheet name is exactly "Logs"
- Check column headers match expected format
- Ensure sheet ID is correct

**3. No data appearing:**
- Check Cloudflare Worker logs for errors
- Verify API credentials are set correctly
- Test API key with manual curl request

### Testing Procedures

**1. Manual API Key Test:**
```bash
curl "https://sheets.googleapis.com/v4/spreadsheets/YOUR_SHEET_ID/values/Logs!A1:J1?key=YOUR_API_KEY"
```

**2. Manual Data Append Test:**
```bash
curl -X POST \
  "https://sheets.googleapis.com/v4/spreadsheets/YOUR_SHEET_ID/values/Logs:append?valueInputOption=RAW&key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "values": [["2024-01-15T10:30:00Z", "123", "https://test.com", "test,tags", "1000", "0", "success", "", "", "req_test"]]
  }'
```

**3. Worker Log Monitoring:**
```bash
wrangler tail --format=pretty | grep -i "google\|sheets"
```

### Performance Optimization

**1. Batch Logging:**
If you have high volume, consider batching logs:

```javascript
// Collect logs in memory and flush periodically
const logBuffer = [];

function addToBuffer(logData) {
  logBuffer.push(logData);
  if (logBuffer.length >= 10) {
    flushLogs();
  }
}

function flushLogs() {
  // Send all buffered logs at once
  // Clear buffer after successful send
}
```

**2. Error Handling:**
```javascript
async function logToGoogleSheets(logData) {
  try {
    // Attempt to log
    await sendToSheets(logData);
  } catch (error) {
    // Fallback: log to Cloudflare Worker logs
    console.error('Failed to log to Google Sheets:', error);
    console.log('Log data:', JSON.stringify(logData));
  }
}
```

### Security Best Practices

**1. API Key Security:**
- Use API key restrictions
- Rotate keys regularly
- Monitor usage in Google Cloud Console

**2. Sheet Access:**
- Use minimum required permissions
- Consider service accounts for production
- Monitor access logs

**3. Data Privacy:**
- Avoid logging sensitive content
- Consider data retention policies
- Implement data anonymization if needed

---

**Congratulations!** Your Google Sheets integration is now set up for comprehensive logging, billing tracking, and audit trails. You can monitor your WordPress Auto-Tagging API usage, track costs, and maintain compliance records automatically.

**Next Steps:**
- Set up automated reports and alerts
- Create dashboards for stakeholders
- Implement data archiving procedures
- Monitor and optimize performance