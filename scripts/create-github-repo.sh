#!/bin/bash

# WordPress Auto-Tagging API - GitHub Repository Setup Script
# This script helps you create a new private GitHub repository and push your code

echo "🚀 WordPress Auto-Tagging API - GitHub Setup"
echo "=============================================="
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository. Please run 'git init' first."
    exit 1
fi

# Check if there are any commits
if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
    echo "❌ Error: No commits found. Please make an initial commit first."
    exit 1
fi

echo "📋 Repository Details:"
echo "   Name: wordpress-auto-tagging-api"
echo "   Description: WordPress Auto-Tagging API - AI-powered tag assignment with Cloudflare Workers"
echo "   Visibility: Private"
echo ""

echo "🔧 Next Steps:"
echo ""
echo "1. Go to GitHub.com and create a new private repository:"
echo "   - Repository name: wordpress-auto-tagging-api"
echo "   - Description: WordPress Auto-Tagging API - AI-powered tag assignment with Cloudflare Workers, supporting 250+ tags and no-code automation integrations"
echo "   - Visibility: Private"
echo "   - DO NOT initialize with README, .gitignore, or license"
echo ""

echo "2. After creating the repository, run these commands:"
echo ""
echo "   # Add the remote repository"
echo "   git remote add origin https://github.com/alexanderbarrios/wordpress-auto-tagging-api.git"
echo ""
echo "   # Set main branch and push"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""

echo "3. Or if you prefer SSH (and have SSH keys set up):"
echo ""
echo "   # Add the remote repository (SSH)"
echo "   git remote add origin git@github.com:alexanderbarrios/wordpress-auto-tagging-api.git"
echo ""
echo "   # Set main branch and push"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""

echo "📦 What's included in this repository:"
echo "   ✅ Complete Cloudflare Worker implementation"
echo "   ✅ Support for 250+ WordPress tags with pagination"
echo "   ✅ AI-powered tag generation with ChatWith API"
echo "   ✅ Google Sheets integration for logging"
echo "   ✅ Comprehensive documentation and setup guides"
echo "   ✅ Integration guides for Zapier, Pabbly, n8n"
echo "   ✅ n8n custom node package"
echo "   ✅ Deployment and testing scripts"
echo "   ✅ Ready-to-use workflow examples"
echo ""

echo "🎯 Repository URL will be:"
echo "   https://github.com/alexanderbarrios/wordpress-auto-tagging-api"
echo ""

# Check if remote already exists
if git remote get-url origin >/dev/null 2>&1; then
    echo "⚠️  Warning: Remote 'origin' already exists:"
    git remote get-url origin
    echo ""
    echo "If you want to change it, run:"
    echo "   git remote remove origin"
    echo "   git remote add origin https://github.com/alexanderbarrios/wordpress-auto-tagging-api.git"
    echo ""
fi

echo "🔗 After pushing, your repository will be available at:"
echo "   https://github.com/alexanderbarrios/wordpress-auto-tagging-api"
echo ""
echo "✨ Ready to create your GitHub repository!"