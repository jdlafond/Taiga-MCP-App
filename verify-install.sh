#!/bin/bash

echo "🔍 Verifying MCP-Client-Server Installation..."
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js not found"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm not found"
    exit 1
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✅ node_modules installed"
else
    echo "⚠️  node_modules not found - run: npm install"
fi

# Check required packages
echo ""
echo "📦 Checking required packages..."

packages=(
    "expo"
    "expo-secure-store"
    "@react-native-async-storage/async-storage"
    "@react-navigation/native"
    "@react-navigation/native-stack"
    "react-native-screens"
    "react-native-safe-area-context"
)

for package in "${packages[@]}"; do
    if npm list "$package" &> /dev/null; then
        echo "✅ $package"
    else
        echo "❌ $package - run: npm install"
    fi
done

# Check src structure
echo ""
echo "📁 Checking project structure..."

dirs=(
    "src/config"
    "src/models"
    "src/views"
    "src/controllers"
    "src/services"
    "src/storage"
    "src/navigation"
    "src/utils"
)

for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir"
    else
        echo "❌ $dir missing"
    fi
done

# Check key files
echo ""
echo "📄 Checking key files..."

files=(
    "App.tsx"
    ".env.example"
    "src/config/env.ts"
    "src/models/AuthModels.ts"
    "src/models/AgentModels.ts"
    "src/views/LoginScreen.tsx"
    "src/views/HomeScreen.tsx"
    "src/views/AgentScreen.tsx"
    "src/controllers/AuthController.ts"
    "src/controllers/AgentController.ts"
    "src/services/HttpClient.ts"
    "src/services/TaigaApi.ts"
    "src/services/AgentApi.ts"
    "src/storage/SecureStore.ts"
    "src/storage/LocalStore.ts"
    "src/navigation/AppNavigator.tsx"
    "src/utils/logger.ts"
    "src/utils/errors.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file missing"
    fi
done

# Check .env
echo ""
if [ -f ".env" ]; then
    echo "✅ .env file exists"
else
    echo "⚠️  .env file not found - run: cp .env.example .env"
fi

# TypeScript check
echo ""
echo "🔧 Running TypeScript check..."
if npx tsc --noEmit 2>&1 | grep -q "error"; then
    echo "❌ TypeScript errors found"
    npx tsc --noEmit
else
    echo "✅ No TypeScript errors"
fi

echo ""
echo "✨ Verification complete!"
echo ""
echo "Next steps:"
echo "1. cp .env.example .env (if not done)"
echo "2. Edit .env with your values"
echo "3. npx expo start"
