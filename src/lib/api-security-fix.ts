// Security fixes for API service
// Add these validations to the API service

export const validateInput = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },
  
  username: (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_.-]{3,150}$/;
    return usernameRegex.test(username);
  },
  
  password: (password: string): boolean => {
    return password.length >= 8 && password.length <= 128;
  },
  
  sanitizeString: (str: string): string => {
    return str.trim().slice(0, 500);
  }
};

export const sanitizeApiResponse = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = value.slice(0, 10000);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeApiResponse(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};
