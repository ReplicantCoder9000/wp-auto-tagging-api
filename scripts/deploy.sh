#!/bin/bash

# WordPress Auto-Tagging API Deployment Script
# This script helps deploy the Cloudflare Worker with proper configuration

set -e

echo "🚀 WordPress Auto-Tagging API Deployment Script"
echo "================================================"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if user is logged in to Cloudflare
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "Please login to Cloudflare:"
    wrangler login
fi

# Function to set secret if not empty
set_secret_if_provided() {
    local secret_name=$1
    local secret_value=$2
    
    if [ ! -z "$secret_value" ] && [ "$secret_value" != "your_${secret_name,,}_here" ]; then
        echo "Setting $secret_name..."
        echo "$secret_value" | wrangler secret put "$secret_name"
    else
        echo "⚠️  $secret_name not provided or using placeholder value"
    fi
}

# Load environment variables if .env exists
if [ -f .env ]; then
    echo "📄 Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  No .env file found. You'll need to set secrets manually."
fi

# Set secrets
echo "🔑 Setting up Cloudflare Worker secrets..."

# Required secrets
if [ -z "$CHATWITH_API_KEY" ]; then
    echo "Enter your ChatWith API Key:"
    read -s CHATWITH_API_KEY
fi
set_secret_if_provided "CHATWITH_API_KEY" "$CHATWITH_API_KEY"

if [ -z "$CHATWITH_CHATBOT_ID" ]; then
    echo "Enter your ChatWith Chatbot ID:"
    read CHATWITH_CHATBOT_ID
fi
set_secret_if_provided "CHATWITH_CHATBOT_ID" "$CHATWITH_CHATBOT_ID"

# Optional secrets
set_secret_if_provided "GOOGLE_SHEETS_API_KEY" "$GOOGLE_SHEETS_API_KEY"
set_secret_if_provided "GOOGLE_SHEETS_ID" "$GOOGLE_SHEETS_ID"

# Choose deployment environment
echo ""
echo "🎯 Choose deployment environment:"
echo "1) Development"
echo "2) Staging" 
echo "3) Production"
read -p "Enter choice (1-3): " env_choice

case $env_choice in
    1)
        echo "🔧 Deploying to development..."
        wrangler deploy --env development
        ;;
    2)
        echo "🧪 Deploying to staging..."
        wrangler deploy --env staging
        ;;
    3)
        echo "🚀 Deploying to production..."
        wrangler deploy
        ;;
    *)
        echo "❌ Invalid choice. Deploying to development by default..."
        wrangler deploy --env development
        ;;
esac

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Test your API endpoint"
echo "2. Configure your no-code automation tools"
echo "3. Set up WordPress Application Passwords"
echo "4. Monitor logs with: wrangler tail"
echo ""
echo "📖 For detailed setup instructions, see README.md"