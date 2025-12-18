/**
 * Security configuration and utilities
 */

// Content Security Policy configuration
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"], // Note: unsafe-inline should be removed in production
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'https:'],
  'connect-src': ["'self'", 'ws:', 'wss:'],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': []
};

// Security headers configuration
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
};

// File upload security configuration
export const FILE_UPLOAD_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain'
  ],
  blockedExtensions: [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js',
    '.jar', '.php', '.asp', '.aspx', '.jsp', '.sh', '.ps1', '.py'
  ]
};

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000 // 30 minutes
  },
  api: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 5 * 60 * 1000 // 5 minutes
  },
  upload: {
    maxAttempts: 10,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 10 * 60 * 1000 // 10 minutes
  }
};

// Password policy configuration
export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
  blockedPasswords: [
    'password', '12345678', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', '123456789', 'password1',
    '12341234' // Remove default admin password
  ]
};

// Session security configuration
export const SESSION_CONFIG = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'strict' as const
};

/**
 * Generate Content Security Policy header value
 */
export function generateCSPHeader(): string {
  const directives = Object.entries(CSP_CONFIG)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive.replace('-', '-');
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
  
  return directives;
}

/**
 * Validate file against security policy
 */
export function validateFileUpload(file: File): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check file size
  if (file.size > FILE_UPLOAD_CONFIG.maxSize) {
    errors.push(`File size exceeds ${FILE_UPLOAD_CONFIG.maxSize / 1024 / 1024}MB limit`);
  }
  
  // Check file type
  if (!FILE_UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
    errors.push('File type not allowed');
  }
  
  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasBlockedExtension = FILE_UPLOAD_CONFIG.blockedExtensions.some(ext => 
    fileName.endsWith(ext)
  );
  
  if (hasBlockedExtension) {
    errors.push('File extension not allowed for security reasons');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate password against security policy
 */
export function validatePasswordPolicy(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters long`);
  }
  
  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(`Password must be less than ${PASSWORD_POLICY.maxLength} characters long`);
  }
  
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (PASSWORD_POLICY.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (PASSWORD_POLICY.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  if (PASSWORD_POLICY.blockedPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a stronger password');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate secure random string
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let sanitized = filename.replace(/[\/\\:*?"<>|]/g, '_');
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1f\x80-\x9f]/g, '');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    const name = sanitized.substring(0, 255 - ext.length);
    sanitized = name + ext;
  }
  
  // Ensure it doesn't start with a dot (hidden file)
  if (sanitized.startsWith('.')) {
    sanitized = '_' + sanitized;
  }
  
  return sanitized || 'unnamed_file';
}

/**
 * Check if URL is safe for redirection
 */
export function isSafeRedirectUrl(url: string): boolean {
  try {
    const urlObj = new URL(url, window.location.origin);
    
    // Only allow same origin redirects
    return urlObj.origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Security event logger
 */
export class SecurityLogger {
  private static instance: SecurityLogger;
  private events: Array<{
    timestamp: Date;
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metadata?: any;
  }> = [];
  
  static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }
  
  log(type: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium', metadata?: any) {
    const event = {
      timestamp: new Date(),
      type,
      message,
      severity,
      metadata
    };
    
    this.events.push(event);
    
    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[SECURITY] ${severity.toUpperCase()}: ${type} - ${message}`, metadata);
    }
    
    // In production, you would send this to your logging service
    if (process.env.NODE_ENV === 'production' && severity === 'critical') {
      // Send to logging service
      this.sendToLoggingService(event);
    }
  }
  
  private sendToLoggingService(event: any) {
    // Implementation would depend on your logging service
    // For example, send to Sentry, LogRocket, or your own API
    console.error('[CRITICAL SECURITY EVENT]', event);
  }
  
  getEvents(severity?: string): typeof this.events {
    if (severity) {
      return this.events.filter(event => event.severity === severity);
    }
    return [...this.events];
  }
  
  clearEvents() {
    this.events = [];
  }
}

// Export singleton instance
export const securityLogger = SecurityLogger.getInstance();