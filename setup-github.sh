#!/bin/bash

echo "🚀 Arba Delivery - GitHub Setup Script"
echo "======================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
else
    echo "✅ Git repository already initialized"
fi

# Check if there are any commits
if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
    echo "📝 Adding files to Git..."
    git add .
    
    echo "💾 Creating initial commit..."
    git commit -m "Initial commit - Arba Delivery Platform

Features:
- Django REST API backend with JWT authentication
- Next.js frontend with TypeScript
- Role-based access control (Customer, Courier, Admin)
- Real-time order tracking with WebSocket
- Property-based testing with Hypothesis
- Production-ready deployment configuration
- Comprehensive documentation"
else
    echo "✅ Repository already has commits"
fi

echo ""
echo "🔗 Next steps:"
echo "1. Create a new repository on GitHub"
echo "2. Copy the repository URL"
echo "3. Run: git remote add origin <your-repo-url>"
echo "4. Run: git push -u origin main"
echo ""
echo "📚 Then follow the RENDER_DEPLOYMENT_GUIDE.md for deployment instructions"
echo ""
echo "✨ Your project is ready for GitHub!"