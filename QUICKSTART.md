# Quick Start Guide

## Installation (Run these commands in order)

```bash
# 1. Install all dependencies
npm install

# 2. Install Expo native packages
npx expo install expo-secure-store @react-native-async-storage/async-storage react-native-screens react-native-safe-area-context

# 3. Install navigation
npm install @react-navigation/native @react-navigation/native-stack

# 4. Create environment file
cp .env.endpoints .env

# 5. Edit .env with your values
# EXPO_PUBLIC_TAIGA_BASE_URL=https://api.taiga.io
# EXPO_PUBLIC_AGENT_BASE_URL=http://localhost:8000

# 6. Start the app
npx expo start
```

## Running the App

After `npx expo start`:
- Press **i** for iOS Simulator
- Press **a** for Android Emulator
- Scan QR code with Expo Go app

## Usage Flow

1. **Login Screen**: Enter Taiga username and password
2. **Home Screen**: View user info, tap "Run Agent"
3. **Agent Screen**: 
   - Enter project_ref (e.g., "my-project")
   - Enter sprint_ref (e.g., "Sprint 6")
   - Enter prompt (meeting minutes or instructions)
   - Tap "Submit"
4. **View Results**: Summary and created artifacts displayed

## Project Structure

```
src/
├── config/env.ts              # Environment variables
├── models/
│   ├── AuthModels.ts          # Auth types
│   └── AgentModels.ts         # Agent types
├── views/
│   ├── LoginScreen.tsx        # Login UI
│   ├── HomeScreen.tsx         # Home UI
│   └── AgentScreen.tsx        # Agent UI
├── controllers/
│   ├── AuthController.ts      # Auth logic
│   └── AgentController.ts     # Agent logic
├── services/
│   ├── HttpClient.ts          # HTTP wrapper
│   ├── TaigaApi.ts            # Taiga API
│   └── AgentApi.ts            # Agent API
├── storage/
│   ├── SecureStore.ts         # Token storage
│   └── LocalStore.ts          # Context storage
├── navigation/
│   └── AppNavigator.tsx       # Navigation
└── utils/
    ├── logger.ts              # Logging
    └── errors.ts              # Errors
```

## Key Features

✅ Secure token storage (expo-secure-store)
✅ Automatic token refresh on 401
✅ MVC architecture
✅ TypeScript strict mode
✅ 30s request timeout
✅ Token sanitization in logs

## Troubleshooting

**Clear cache:**
```bash
npx expo start --clear
```

**Reinstall dependencies:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## Backend API Expected

Your backend should accept `POST /agent/run` with:

```json
{
  "project_ref": "string",
  "sprint_ref": "string",
  "prompt": "string",
  "auth_token": "string",
  "refresh": "string",
  "user_context": {
    "id": 123,
    "username": "string",
    "email": "string",
    "roles": ["string"],
    "uuid": "string",
    "timezone": "string",
    "lang": "string",
    "is_active": true
  }
}
```

And return:

```json
{
  "summary": "string",
  "created_artifacts": [
    {
      "type": "string",
      "id": 123,
      "ref": 456,
      "subject": "string"
    }
  ],
  "warnings": ["string"],
  "errors": ["string"]
}
```
