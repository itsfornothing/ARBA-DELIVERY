#!/bin/bash

# TypeScript Cache Optimization Script
# Optimizes cache for better performance

CACHE_DIR=".typescript-cache"

echo "🚀 Starting cache optimization..."

# Defragment cache files
echo "Defragmenting cache files..."
find "$CACHE_DIR" -name "*.cache" -exec gzip -d {} \; -exec gzip {} \; 2>/dev/null

# Rebuild cache index
echo "Rebuilding cache index..."
node "$CACHE_DIR/cache-monitor.js"

# Run intelligent invalidation
echo "Running intelligent cache invalidation..."
node "$CACHE_DIR/intelligent-invalidation.js"

echo "✅ Cache optimization completed"
