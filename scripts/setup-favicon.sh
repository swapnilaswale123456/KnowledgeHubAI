#!/bin/bash

# Create public directory if it doesn't exist
mkdir -p public

# Remove existing favicon files
rm -f public/favicon.ico
rm -f public/apple-touch-icon.png
rm -f public/favicon-32x32.png
rm -f public/favicon-16x16.png
rm -f public/site.webmanifest
rm -f public/safari-pinned-tab.svg
rm -f public/android-chrome-192x192.png
rm -f public/android-chrome-512x512.png

echo "Removed existing favicon files"
echo "Please follow these steps to set up your new Reddit Research favicon:"
echo ""
echo "1. Create a 1000x1000 square logo image with transparent background"
echo "2. Go to favicon-generator.org"
echo "3. Upload your logo"
echo "4. Check 'Generate icons for Web, Android, Microsoft, and iOS Apps'"
echo "5. Click 'Create Favicon'"
echo "6. Download and extract the generated files"
echo "7. Copy all files to the 'public' directory"
echo ""
echo "Recommended favicon design elements:"
echo "- Use Reddit's orangered color (#FF4500) or your brand colors"
echo "- Include a magnifying glass or analytics icon"
echo "- Consider using a stylized 'R' for Reddit"
echo ""
echo "After copying the files, restart your development server" 