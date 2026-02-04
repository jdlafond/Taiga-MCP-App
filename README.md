# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.



# Frontend (Expo) — Agent + Taiga Prototype

This app is a thin UI over an agent backend that:
- uses **Anthropic Claude (Messages API) tool use**,
- exposes **Taiga tools** through an **in-process MCP-style tool registry**,
- enforces **role-based tool availability** based on Taiga permissions.

The frontend does **not** call Taiga directly. It submits a goal to the backend and renders results (created User Stories / Tasks, plus a summary).

## Architecture

**Components**
1. Expo Client (this repo)
2. Backend Agent API (FastAPI + in-process MCP + Anthropic)
3. Taiga (external API)

**Data flow (high level)**
1. User enters prompt (e.g., meeting minutes + “create user stories/tasks in Sprint 6”).
2. App POSTs to backend `/agent/run`.
3. Backend:
   - resolves Taiga role permissions
   - filters tools available to the model
   - runs a bounded tool-call loop
   - writes artifacts to Taiga via permitted tools
4. App receives summary + created items and displays them.

## API Contract (Frontend → Backend)

### `POST /agent/run`

**Request**
```json
{
  "project_id": "123456",
  "sprint_id": "123456",
  "user_story_id": "123456", -- optional
  "prompt": "MEETING MINUTES...\n\nCreate user stories and tasks for Sprint 6.",
  "auth_token": "your_taiga_bearer_token",
  "refresh": "your_refresh_token",
  "user_context": {
    "id": 738718,
    "username": "jdlafond",
    "email": "jdlafond@asu.edu",
    "roles": ["Back", "Product Owner"]
  }
}
