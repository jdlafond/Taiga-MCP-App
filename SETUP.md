# MCP-Client-Server Setup Instructions

## Prerequisites
- Node.js 18+ installed
- Expo CLI installed globally: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator configured

## Installation Steps

### 1. Install Dependencies

```bash
# Install Expo-compatible packages
npx expo install expo-secure-store @react-native-async-storage/async-storage
npx expo install react-native-screens react-native-safe-area-context

# Install navigation packages
npm install @react-navigation/native @react-navigation/native-stack

# Install all other dependencies
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.endpoints .env
```

Edit `.env` with your values:
```
EXPO_PUBLIC_TAIGA_BASE_URL=https://api.taiga.io
EXPO_PUBLIC_AGENT_BASE_URL=http://localhost:8000
```

### 3. Start the Development Server

```bash
npx expo start
```

### 4. Run on Device/Simulator

- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on physical device

## Project Structure

```
src/
├── models/           # TypeScript interfaces and types
│   ├── AuthModels.ts
│   └── AgentModels.ts
├── views/            # React Native screens
│   ├── LoginScreen.tsx
│   ├── HomeScreen.tsx
│   └── AgentScreen.tsx
├── controllers/      # Business logic
│   ├── AuthController.ts
│   └── AgentController.ts
├── services/         # API clients
│   ├── HttpClient.ts
│   ├── TaigaApi.ts
│   └── AgentApi.ts
├── storage/          # Local and secure storage
│   ├── SecureStore.ts
│   └── LocalStore.ts
├── navigation/       # React Navigation setup
│   └── AppNavigator.tsx
├── config/           # Configuration
│   └── env.ts
└── utils/            # Utilities
    ├── logger.ts
    └── errors.ts
```

## Usage Flow

1. **Login**: Enter Taiga credentials (username/password)
2. **Home**: View user info, navigate to agent
3. **Agent**: Submit project_ref, sprint_ref, and prompt to backend
4. **Results**: View summary and created artifacts

## API Contract

### Backend Endpoint: `POST /agent/run`

Request body:
```json
{
  "project_ref": "my-project",
  "sprint_ref": "Sprint 6",
  "prompt": "Create user stories...",
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

## Security Notes

- Tokens stored in `expo-secure-store` (encrypted)
- User context in `@react-native-async-storage/async-storage`
- All sensitive data sanitized in logs
- Token refresh on 401 responses

## Troubleshooting

### Metro bundler issues
```bash
npx expo start --clear
```

### iOS build issues
```bash
cd ios && pod install && cd ..
```

### Android issues
```bash
cd android && ./gradlew clean && cd ..
```

## Development Notes

- TypeScript strict mode enabled
- MVC architecture enforced
- No tokens logged to console
- 30-second request timeout
- Automatic token refresh on 401
