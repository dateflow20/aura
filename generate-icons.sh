# Generate PNG icons from SVG using ImageMagick or similar tool
# For now, we'll use the SVG directly and create placeholders

# If you have ImageMagick installed:
# convert -background none -resize 192x192 public/icon.svg public/icon-192.png
# convert -background none -resize 512x512 public/icon.svg public/icon-512.png

# Alternative: Use online converter or Node.js script
# Or manually convert at: https://convertio.co/svg-png/

echo "To generate PNG icons from SVG:"
echo "1. Visit https://convertio.co/svg-png/"
echo "2. Upload public/icon.svg"
echo "3. Download as icon-192.png (192x192) and icon-512.png (512x512)"
echo "4. Place them in public/ folder"
echo ""
echo "Or use ImageMagick:"
echo "  convert -background black -resize 192x192 public/icon.svg public/icon-192.png"
echo "  convert -background black -resize 512x512 public/ icon.svg public/icon-512.png"
