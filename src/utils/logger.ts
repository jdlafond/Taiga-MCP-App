const SENSITIVE_KEYS = ['auth_token', 'refresh', 'password', 'token'];

function sanitize(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized: any = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
      sanitized[key] = '<redacted>';
    } else if (typeof obj[key] === 'object') {
      sanitized[key] = sanitize(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }
  
  return sanitized;
}

export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data ? sanitize(data) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error ? sanitize(error) : '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data ? sanitize(data) : '');
  },
};
