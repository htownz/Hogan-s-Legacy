import { QueryClient } from "@tanstack/react-query";

// Create and configure QueryClient with robust error handling
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute
      retry: 1,
      gcTime: 30 * 60 * 1000, // 30 minutes - This is the modern replacement for cacheTime
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        return res.json();
      },
    },
  },
});

// Helper function for making API requests
// Supports multiple calling conventions:
//   apiRequest('/api/url', 'POST', data)   — url-first
//   apiRequest('POST', '/api/url', data)   — method-first
//   apiRequest('/api/url', { method, data }) — options object
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export async function apiRequest<T = any>(
  first: string,
  second?: string | { method?: string; data?: any; body?: string },
  data?: any
): Promise<T> {
  let url: string;
  let method: string = "GET";
  if (typeof second === 'object' && second !== null) {
    url = first;
    method = second.method || "GET";
    data = second.data;
    if (second.body) {
      data = JSON.parse(second.body);
    }
  } else if (typeof second === 'string' && (HTTP_METHODS as readonly string[]).includes(first.toUpperCase()) && second.startsWith('/')) {
    // Reversed args: apiRequest('POST', '/api/...')
    method = first.toUpperCase();
    url = second;
  } else {
    url = first;
    if (second) method = second;
  }
  try {
    const options: RequestInit = {
      method: method, // Ensure method is passed as a string
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Send cookies for authentication
    };

    if (data) {
      try {
        options.body = JSON.stringify(data);
      } catch (error) {
        console.error("Error stringifying request data:", error);
        throw new Error("Invalid request data");
      }
    }

    const response = await fetch(url, options).catch(error => {
      console.error(`Network error when fetching ${url}:`, error);
      throw new Error("Network error, please check your connection");
    });

    if (!response.ok) {
      let errorMessage: string;
      try {
        const error = await response.json();
        errorMessage = error.message || `API request failed with status ${response.status}`;
      } catch (e) {
        errorMessage = `API request failed with status ${response.status}`;
      }
      console.error(`API error for ${url}:`, errorMessage);
      throw new Error(errorMessage);
    }

    // For DELETE requests that return 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    // Handle JSON parsing errors
    try {
      return await response.json();
    } catch (error) {
      console.error(`Error parsing JSON response from ${url}:`, error);
      throw new Error("Invalid response format from server");
    }
  } catch (error) {
    // Capture any uncaught errors
    if (!(error instanceof Error)) {
      error = new Error(String(error));
    }
    throw error;
  }
}