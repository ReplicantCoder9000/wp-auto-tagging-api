#!/bin/bash

# WordPress Auto-Tagging API Test Script
# This script helps test the deployed API with sample data

set -e

echo "🧪 WordPress Auto-Tagging API Test Script"
echo "=========================================="

# Default values
API_URL="https://wp-auto-tagging-api.your-subdomain.workers.dev/api/auto-tag"
WP_URL=""
WP_AUTH=""
POST_ID=""

# Function to prompt for required values
prompt_for_value() {
    local var_name=$1
    local prompt_text=$2
    local is_secret=${3:-false}
    
    if [ -z "${!var_name}" ]; then
        if [ "$is_secret" = true ]; then
            read -s -p "$prompt_text: " $var_name
            echo ""
        else
            read -p "$prompt_text: " $var_name
        fi
    fi
}

# Get required parameters
echo "📝 Please provide the following test parameters:"
echo ""

prompt_for_value "API_URL" "API URL (default: $API_URL)"
if [ -z "$API_URL" ]; then
    API_URL="https://wp-auto-tagging-api.your-subdomain.workers.dev/api/auto-tag"
fi

prompt_for_value "WP_URL" "WordPress Site URL (e.g., https://yoursite.com)"
prompt_for_value "WP_AUTH" "WordPress Base64 Auth (username:password encoded)" true
prompt_for_value "POST_ID" "WordPress Post ID to test with"

echo ""
echo "🚀 Testing API with the following parameters:"
echo "API URL: $API_URL"
echo "WordPress URL: $WP_URL"
echo "Post ID: $POST_ID"
echo ""

# Create test payload
TEST_PAYLOAD=$(cat <<EOF
{
  "wp_url": "$WP_URL",
  "wp_auth": "$WP_AUTH",
  "post_id": $POST_ID,
  "title": "Test Match: Arsenal vs Chelsea",
  "content": "An exciting Premier League match between Arsenal and Chelsea at Emirates Stadium. Arsenal dominated the first half with excellent possession play, while Chelsea came back strong in the second half. The match ended 2-1 to Arsenal with goals from their star striker and midfielder.",
  "league": "Premier League",
  "home_team": "Arsenal",
  "away_team": "Chelsea",
  "is_live": "yes",
  "tags": ""
}
EOF
)

echo "📤 Sending test request..."
echo "Payload:"
echo "$TEST_PAYLOAD" | jq '.'
echo ""

# Make the API request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD")

# Extract response body and status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)

echo "📥 Response received:"
echo "HTTP Status: $HTTP_CODE"
echo "Response Body:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

# Analyze the response
case $HTTP_CODE in
    200)
        echo "✅ SUCCESS: API request completed successfully!"
        echo ""
        echo "📊 Results:"
        ASSIGNED_TAGS=$(echo "$RESPONSE_BODY" | jq -r '.assigned_tags[]?' 2>/dev/null || echo "Unable to parse tags")
        CREATED_TAGS=$(echo "$RESPONSE_BODY" | jq -r '.created_tags[]?' 2>/dev/null || echo "Unable to parse created tags")
        PROCESSING_TIME=$(echo "$RESPONSE_BODY" | jq -r '.processing_time_ms?' 2>/dev/null || echo "Unknown")
        
        echo "- Assigned Tags: $ASSIGNED_TAGS"
        echo "- Created Tags: $CREATED_TAGS"
        echo "- Processing Time: ${PROCESSING_TIME}ms"
        ;;
    400)
        echo "❌ VALIDATION ERROR: Check your request parameters"
        ERROR_MESSAGE=$(echo "$RESPONSE_BODY" | jq -r '.message?' 2>/dev/null || echo "Unknown error")
        echo "Error: $ERROR_MESSAGE"
        ;;
    401)
        echo "❌ AUTHENTICATION ERROR: Check your WordPress credentials"
        echo "Make sure:"
        echo "- WordPress Application Password is correct"
        echo "- Base64 encoding is proper (username:password)"
        echo "- User has required permissions"
        ;;
    429)
        echo "⚠️  RATE LIMIT: WordPress API rate limit exceeded"
        echo "Wait a moment and try again"
        ;;
    503)
        echo "⚠️  SERVICE UNAVAILABLE: AI service may be down"
        echo "The API will retry automatically, or try again later"
        ;;
    *)
        echo "❌ UNEXPECTED ERROR: HTTP $HTTP_CODE"
        echo "Check the API logs for more details"
        ;;
esac

echo ""
echo "🔍 Troubleshooting tips:"
echo "- Check Cloudflare Worker logs: wrangler tail"
echo "- Verify WordPress REST API is accessible: $WP_URL/wp-json/wp/v2/"
echo "- Test WordPress auth: curl -H \"Authorization: Basic $WP_AUTH\" $WP_URL/wp-json/wp/v2/users/me"
echo "- Review API documentation in README.md"