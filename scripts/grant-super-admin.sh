#!/bin/bash

# Quick script to grant super admin access
# Usage: ./scripts/grant-super-admin.sh

echo "🚀 Granting Super Admin Access to isambk92@gmail.com"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Run the Node.js script
node scripts/grant-super-admin.js

echo ""
echo "✅ Done! You can now log in with:"
echo "   Email: isambk92@gmail.com"
echo "   Password: Lwalida2020"
echo "   Then navigate to /admin in your app"
