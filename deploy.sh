#!/bin/bash

# AREX Platform Deployment Script
# Deploys Firebase Functions with environment check

echo "🚀 Starting AREX Platform deployment..."
echo "======================================"

cd ~/arex-platform

# Check if .env file exists
if [ ! -f "functions/.env" ]; then
    echo "❌ ERROR: functions/.env file not found!"
    echo "Create it from the template:"
    echo "cp functions/.env.example functions/.env"
    echo "Then edit with your credentials"
    exit 1
fi

# Check if credentials are set
if grep -q "your_production_consumer_key_here" functions/.env; then
    echo "⚠️  WARNING: Using example credentials from .env.example"
    echo "This will use SANDBOX mode."
    read -p "Continue with sandbox? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled. Update functions/.env first."
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd functions
npm install
cd ..

# Deploy functions
echo "🚀 Deploying Firebase Functions..."
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "📋 Your endpoints:"
    echo "-----------------"
    echo "Status:    https://us-central1-arex-ltd-42154393-a701b-fce9f.cloudfunctions.net/mpesaSimpleStatus"
    echo "STK Push:  https://us-central1-arex-ltd-42154393-a701b-fce9f.cloudfunctions.net/mpesaSimpleStk"
    echo "Test:      https://us-central1-arex-ltd-42154393-a701b-fce9f.cloudfunctions.net/mpesaSimpleTest"
    echo "Callback:  https://us-central1-arex-ltd-42154393-a701b-fce9f.cloudfunctions.net/mpesaCallback"
    echo ""
    echo "🔧 Test command:"
    echo 'curl -X POST \'
    echo '  "https://us-central1-arex-ltd-42154393-a701b-fce9f.cloudfunctions.net/mpesaSimpleStk" \'
    echo '  -H "Content-Type: application/json" \'
    echo '  -d '\''{"phone": "254719250792", "amount": "10", "reference": "TEST"}'\'
else
    echo "❌ Deployment failed!"
    exit 1
fi
