#!/bin/bash

# Production Build Script for NASA Exoplanet App
echo "🚀 Starting NASA Exoplanet Production Build"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm ci --production=false

# Build frontend
echo "🏗️  Building Next.js frontend..."
npm run build:frontend

# Verify build
if [ -d ".next" ]; then
    echo "✅ Frontend build completed successfully"
    echo "📊 Build size:"
    du -sh .next
else
    echo "❌ Frontend build failed"
    exit 1
fi

# Check ML service files
echo "🤖 Verifying ML service files..."
if [ -d "ml-service" ]; then
    echo "✅ ML service directory found"
    if [ -f "ml-service/requirements.txt" ]; then
        echo "✅ Python requirements file found"
    fi
    if [ -f "ml-service/app.py" ]; then
        echo "✅ Flask app found"
    fi
else
    echo "⚠️  ML service directory not found"
fi

# Final verification
echo "🔍 Final build verification..."
npm run verify:build

echo ""
echo "🎉 Production build completed successfully!"
echo "📋 Next steps for deployment:"
echo "   1. Deploy frontend to Vercel"
echo "   2. Deploy ML service to your Python hosting (Railway, Render, etc.)"
echo "   3. Set up Redis instance"
echo "   4. Configure environment variables"
echo ""
echo "🔗 Ready for Vercel deployment!"
