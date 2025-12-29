#!/bin/bash

# Fix common TypeScript issues
echo "Fixing common TypeScript issues..."

# Fix Button sizes
find src -name "*.tsx" -exec sed -i '' 's/size="small"/size="sm"/g' {} \;
find src -name "*.tsx" -exec sed -i '' 's/size="large"/size="lg"/g' {} \;

# Fix Card padding
find src -name "*.tsx" -exec sed -i '' 's/padding="small"/padding="sm"/g' {} \;
find src -name "*.tsx" -exec sed -i '' 's/padding="large"/padding="lg"/g' {} \;
find src -name "*.tsx" -exec sed -i '' 's/padding="medium"/padding="md"/g' {} \;

# Fix Typography colors and variants
find src -name "*.tsx" -exec sed -i '' 's/color="text"/color="primary"/g' {} \;
find src -name "*.tsx" -exec sed -i '' 's/variant="body"/variant="body1"/g' {} \;

# Remove interactive props from styled components
find src -name "*.tsx" -exec sed -i '' 's/ interactive//g' {} \;
find src -name "*.tsx" -exec sed -i '' 's/interactive //g' {} \;

# Fix broken JSX tags (add missing >)
find src -name "*.tsx" -exec sed -i '' 's/\$accentColor="[^"]*" $/\$accentColor="&">/g' {} \;

echo "Fixed common issues. Running build..."
npm run build