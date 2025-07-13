// Token storage keys
const ACCESS_TOKEN_KEY = 'stackmotive_access_token';
let memoryToken: string | null = null;  // In-memory token storage

// Get stored token
export const getAccessToken = () => {
  // First check memory
  if (memoryToken) {
    return memoryToken;
  }
  // Fallback to localStorage
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    memoryToken = token;  // Cache in memory
  }
  return token;
};

// Store new token
export const setAccessToken = (token: string) => {
  try {
    // Set in memory first
    memoryToken = token;
    // Then persist to localStorage
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error('Failed to store access token:', error);
    return false;
  }
};

// Clear stored token
export const clearAccessToken = () => {
  try {
    // Clear memory first
    memoryToken = null;
    // Then clear localStorage
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear access token:', error);
    return false;
  }
};

// Add auth header if token exists
export const addAuthHeader = (headers: HeadersInit = {}): HeadersInit => {
  const token = getAccessToken();
  if (token) {
    return {
      ...headers,
      'Authorization': `Bearer ${token}`
    };
  }
  return headers;
}; 