#!/bin/bash

# 🚨 SECURITY HOOKS INSTALLATION SCRIPT 🚨
# This script installs pre-commit hooks to prevent secrets from being committed

set -e

echo "🔒 Installing security hooks..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed. Please install Python 3 first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is required but not installed. Please install pip3 first."
    exit 1
fi

echo "📦 Installing pre-commit..."
pip3 install pre-commit

echo "🔧 Installing pre-commit hooks..."
pre-commit install

echo "📋 Creating secrets baseline..."
pre-commit run detect-secrets --all-files

echo "✅ Security hooks installed successfully!"
echo ""
echo "🔒 Your repository is now protected against committing secrets."
echo "📝 The following checks will run on every commit:"
echo "   - Secret detection"
echo "   - Code formatting"
echo "   - Linting"
echo "   - Security best practices"
echo ""
echo "⚠️  IMPORTANT: If you see any secrets detected, DO NOT COMMIT!"
echo "   Review the output and remove any sensitive information first."
echo ""
echo "🔄 To run checks manually: pre-commit run --all-files"
echo "🔄 To update hooks: pre-commit autoupdate"
