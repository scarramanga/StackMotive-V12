import { QueryClient } from '@tanstack/react-query';
import { getAccessToken, clearAccessToken, setAccessToken } from './auth';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Track if we're currently refreshing the token
let isRefreshing = false;
let refreshPromise: Promise<string | undefined> | null = null;

// Function to refresh the token
async function refreshToken(): Promise<string | undefined> {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/refresh-token`, {
      method: 'POST',
      credentials: 'include', // Important for sending the refresh token cookie
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const data = await response.json();
    setAccessToken(data.access_token);
    return data.access_token;
  } catch (error) {
    clearAccessToken();
    return undefined;
  }
}

// Function overloads to support both calling formats
export async function apiRequest(
  url: string,
  options: RequestInit & { method: string; body?: any }
): Promise<any>;
export async function apiRequest(
  method: string,
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<any>;
export async function apiRequest(
  urlOrMethod: string,
  endpointOrOptions?: string | (RequestInit & { method: string; body?: any }),
  data?: any,
  options: RequestInit = {}
): Promise<any> {
  // Detect which calling format is being used and normalize parameters
  let method: string;
  let endpoint: string;
  let requestData: any;
  let requestOptions: RequestInit;

  if (typeof endpointOrOptions === 'object' && endpointOrOptions !== null && 'method' in endpointOrOptions) {
    // Format 1: apiRequest(url, { method, body, ...options })
    method = endpointOrOptions.method;
    endpoint = urlOrMethod;
    requestData = endpointOrOptions.body;
    requestOptions = { ...endpointOrOptions };
    delete (requestOptions as any).method;
    delete (requestOptions as any).body;
  } else if (typeof endpointOrOptions === 'string') {
    // Format 2: apiRequest(method, url, data, options)
    method = urlOrMethod;
    endpoint = endpointOrOptions;
    requestData = data;
    requestOptions = options;
  } else {
    throw new Error('Invalid apiRequest usage: endpoint must be a string or options object with method');
  }

  // Validate that we have valid parameters
  if (!method || typeof method !== 'string') {
    throw new Error('Invalid apiRequest usage: method is required');
  }
  if (!endpoint || typeof endpoint !== 'string') {
    throw new Error('Invalid apiRequest usage: endpoint URL is required');
  }

  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const url = `${baseURL}${endpoint}`;
  
  // Function to make the actual API call
  const makeRequest = async (token?: string) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...requestOptions.headers,
    };
    
    // Normalize body data - always stringify objects
    let bodyString: string | undefined;
    if (requestData !== undefined && requestData !== null) {
      if (typeof requestData === 'object') {
        bodyString = JSON.stringify(requestData);
      } else if (typeof requestData === 'string') {
        bodyString = requestData;
      } else {
        bodyString = String(requestData);
      }
    }
    
    const config: RequestInit = {
      method,
      headers,
      credentials: 'include',
      ...requestOptions,
      ...(bodyString ? { body: bodyString } : {}),
    };

    const response = await fetch(url, config);
    
    if (response.ok) {
      return response.json();
    }
    
    // Handle error responses with robust parsing
    const errorText = await response.text();
    let errorMessage: string;
    
    try {
      const errorData = JSON.parse(errorText);
      
      // Extract error message from various possible formats
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData && typeof errorData === 'object') {
        // Handle different error response formats
        if (Array.isArray(errorData.detail)) {
          // Pydantic validation errors - extract meaningful messages
          const validationErrors = errorData.detail.map((err: any) => {
            if (err && typeof err === 'object' && err.msg) {
              return `${err.loc ? err.loc.join('.') + ': ' : ''}${err.msg}`;
            }
            return String(err);
          });
          errorMessage = validationErrors.join('; ');
        } else if (typeof errorData.detail === 'string') {
          // Standard FastAPI error with string detail
          errorMessage = errorData.detail;
        } else if (typeof errorData.message === 'string') {
          // Alternative message field
          errorMessage = errorData.message;
        } else if (typeof errorData.error === 'string') {
          // Another common error field
          errorMessage = errorData.error;
        } else if (Array.isArray(errorData)) {
          // Direct array of errors
          errorMessage = errorData.map(err => String(err)).join('; ');
        } else {
          // Fallback: stringify the object
          errorMessage = JSON.stringify(errorData);
        }
      } else {
        errorMessage = String(errorData);
      }
    } catch {
      // If JSON parsing fails, use the raw text
      errorMessage = errorText || 'Unknown error';
    }
    
    // Ensure we always have a clean string message
    if (!errorMessage || errorMessage.trim() === '') {
      errorMessage = `HTTP ${response.status}: ${response.statusText ?? 'Request failed'}`;
    }
    
    // Create error with clean message
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  };

  try {
    // First attempt with current token
    return await makeRequest(getAccessToken() || undefined);
  } catch (error: any) {
    // If not a 401 error, rethrow
    if (error?.status !== 401) {
      throw error;
    }

    // Handle 401 error - attempt token refresh
    try {
      let newToken: string | undefined;
      
      // If already refreshing, wait for that to complete
      if (isRefreshing && refreshPromise) {
        newToken = await refreshPromise;
      } else {
        isRefreshing = true;
        refreshPromise = refreshToken();
        newToken = await refreshPromise;
        isRefreshing = false;
        refreshPromise = null;
      }

      // If refresh successful, retry the original request
      if (newToken) {
        return await makeRequest(newToken);
      }
      
      // If refresh failed, clear token and throw error
      clearAccessToken();
      throw error;
    } catch (refreshError) {
      // Clear token and throw original error
      clearAccessToken();
      throw error;
    }
  }
}

// Query function factory for React Query
export const getQueryFn = (url: string) => async () => {
  return apiRequest('GET', url);
};
