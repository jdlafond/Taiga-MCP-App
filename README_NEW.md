# MCP-Client-Server — Taiga Agent Frontend

React Native (Expo) frontend for the Taiga MCP Agent prototype. This app provides authentication with Taiga and submits agent requests to a FastAPI backend.

## Architecture

**MVC Structure:**
- **Models**: TypeScript interfaces for Auth and Agent data
- **Views**: React Native screens (Login, Home, Agent)
- **Controllers**: Business logic for Auth and Agent operations
- **Services**: HTTP clients for Taiga and Agent APIs
- **Storage**: Secure token storage + local user context storage

**Flow:**
1. User logs in with Taiga credentials
2. Tokens stored securely (expo-secure-store)
3. User context stored locally (async-storage)
4. Agent requests include tokens + context in JSON body
5. Backend receives full auth payload and runs agent

## Quick Start

### 1. Install Dependencies

```bash
# Install all npm packages
npm install

# Install Expo-compatible native packages
npx expo install expo-secure-store @react-native-async-storage/async-storage
npx expo install react-native-screens react-native-safe-area-context

# Install navigation
npm install @react-navigation/native @react-navigation/native-stack
```

### 2. Configure Environment

Create `.env` file:

```bash
cp .env.endpoints .env
```

Edit with your values:
```
EXPO_PUBLIC_TAIGA_BASE_URL=https://api.taiga.io/api/v1
EXPO_PUBLIC_AGENT_BASE_URL=http://localhost:8000 EC2
```

### 3. Start Development Server

```bash
npx expo start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator  
- Scan QR with Expo Go app on physical device

## Project Structure

```
src/
├── models/
│   ├── AuthModels.ts       # Login response, tokens, user context types
│   └── AgentModels.ts      # Agent request/response types
├── views/
│   ├── LoginScreen.tsx     # Taiga login form
│   ├── HomeScreen.tsx      # User info + navigation
│   └── AgentScreen.tsx     # Agent prompt submission + results
├── controllers/
│   ├── AuthController.ts   # Login, logout, token refresh
│   └── AgentController.ts  # Submit agent run with auto-refresh
├── services/
│   ├── HttpClient.ts       # Fetch wrapper with timeout
│   ├── TaigaApi.ts         # Taiga auth endpoints
│   └── AgentApi.ts         # Backend agent endpoint
├── storage/
│   ├── SecureStore.ts      # Encrypted token storage
│   └── LocalStore.ts       # User context storage
├── navigation/
│   └── AppNavigator.tsx    # React Navigation stack
├── config/
│   └── env.ts              # Environment variables
└── utils/
    ├── logger.ts           # Sanitized logging (no tokens)
    └── errors.ts           # Custom error classes
```

## API Contract

### Backend: `POST /agent/run`

**Request:**
```json
{
  "project_ref": "my-project-slug",
  "sprint_ref": "Sprint 6",
  "prompt": "MEETING MINUTES...\n\nCreate user stories and tasks.",
  "auth_token": "<bearer>",
  "refresh": "<refresh>",
  "user_context": {
    "id": 738718,
    "username": "jdlafond",
    "email": "jdlafond@asu.edu",
    "roles": ["Back", "Product Owner"],
    "uuid": "...",
    "timezone": "",
    "lang": "",
    "is_active": true
  }
}
```

**Response:**
```json
{
  "summary": "Created 3 user stories and 5 tasks in Sprint 6.",
  "created_artifacts": [
    {
      "type": "UserStory",
      "id": 12345,
      "ref": 101,
      "subject": "Implement login flow"
    }
  ],
  "warnings": [],
  "errors": []
}
```

## Features

✅ Taiga authentication with secure token storage  
✅ Automatic token refresh on 401 responses  
✅ MVC architecture with TypeScript strict mode  
✅ Request timeout (30s) and error handling  
✅ Token sanitization in logs (never logged)  
✅ Minimal, utilitarian UI  
✅ Full agent request/response display  

## Security Notes

- **Tokens**: Stored in `expo-secure-store` (encrypted at OS level)
- **User Context**: Stored in `async-storage` (unencrypted but non-sensitive)
- **Logging**: All sensitive keys automatically redacted
- **Refresh Flow**: On 401, attempts refresh once before failing

⚠️ **Prototype Warning**: Sending tokens from client to backend is acceptable for prototypes but not production. In production, client should authenticate to your backend, and backend should store Taiga credentials server-side.

## Troubleshooting

**Metro bundler cache issues:**
```bash
npx expo start --clear
```

**iOS build issues:**
```bash
cd ios && pod install && cd ..
```

**Android build issues:**
```bash
cd android && ./gradlew clean && cd ..
```

**TypeScript errors:**
```bash
npm run lint
```

## Development

**Tech Stack:**
- React Native 0.81
- Expo SDK 54
- TypeScript 5.9 (strict mode)
- React Navigation 7
- expo-secure-store
- @react-native-async-storage/async-storage

**Code Style:**
- MVC separation enforced
- Controllers handle business logic
- Services handle HTTP
- Views are pure presentation
- Models define all types

## Next Steps

1. Test with your backend agent API
2. Configure Taiga base URL for your instance
3. Add error boundary for production
4. Implement proper session management
5. Add unit tests for controllers

## License

See LICENSE file.
