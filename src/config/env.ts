export const ENV = {
  TAIGA_BASE_URL: process.env.EXPO_PUBLIC_TAIGA_BASE_URL || 'https://api.taiga.io',
  AGENT_BASE_URL: process.env.EXPO_PUBLIC_AGENT_BASE_URL || 'http://localhost:8000',
  REQUEST_TIMEOUT: 30000,
};
