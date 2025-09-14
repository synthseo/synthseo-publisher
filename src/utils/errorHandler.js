/**
 * Error handling utilities
 */

export class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class ValidationError extends Error {
  constructor(message, fields = {}) {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields;
    this.timestamp = new Date().toISOString();
  }
}

export class NetworkError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'NetworkError';
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Error handler utility
 */
export const handleError = (error, context = '') => {
  const errorInfo = {
    message: error.message || 'An unknown error occurred',
    type: error.name || 'Error',
    context,
    timestamp: new Date().toISOString(),
    stack: error.stack,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}] Error:`, errorInfo);
  }

  // Determine user-friendly message
  let userMessage = 'An error occurred. Please try again.';

  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        userMessage = 'Invalid request. Please check your input.';
        break;
      case 401:
        userMessage = 'Authentication failed. Please check your API key.';
        break;
      case 403:
        userMessage = 'Access denied. You do not have permission.';
        break;
      case 404:
        userMessage = 'The requested resource was not found.';
        break;
      case 429:
        userMessage = 'Too many requests. Please wait and try again.';
        break;
      case 500:
        userMessage = 'Server error. Please try again later.';
        break;
      default:
        userMessage = error.message;
    }
  } else if (error instanceof ValidationError) {
    userMessage = 'Please correct the validation errors and try again.';
  } else if (error instanceof NetworkError) {
    userMessage = 'Network error. Please check your connection.';
  } else if (error.message.includes('timeout')) {
    userMessage = 'Request timed out. Please try again.';
  }

  return {
    ...errorInfo,
    userMessage,
  };
};

/**
 * Retry helper for failed operations
 */
export const retryOperation = async (
  operation,
  maxAttempts = 3,
  delay = 1000,
  backoff = true
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      if (attempt < maxAttempts) {
        const waitTime = backoff ? delay * attempt : delay;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
};

/**
 * Error boundary wrapper for async operations
 */
export const safeAsync = async (operation, fallback = null) => {
  try {
    return await operation();
  } catch (error) {
    const errorInfo = handleError(error, 'safeAsync');
    
    if (fallback !== null) {
      return fallback;
    }
    
    throw errorInfo;
  }
};

/**
 * Validate required fields
 */
export const validateRequired = (data, requiredFields) => {
  const errors = {};

  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      errors[field] = `${field} is required`;
    }
  });

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  return true;
};

/**
 * Format error for display
 */
export const formatError = (error) => {
  if (typeof error === 'string') {
    return error;
  }

  if (error.userMessage) {
    return error.userMessage;
  }

  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
};