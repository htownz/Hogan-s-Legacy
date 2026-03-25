/**
 * Generic API request function
 */
export async function apiRequest<T = any>(
  url: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  body?: any,
  headers: HeadersInit = {}
): Promise<T> {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include", // Include cookies for auth
  };

  // Add body for non-GET requests
  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  // Handle non-2xx responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: "Unknown error",
    }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  // Parse JSON response
  return response.json();
}

/**
 * Helper for GET requests
 */
export async function fetchData<T = any>(url: string, headers: HeadersInit = {}): Promise<T> {
  return apiRequest<T>(url, "GET", undefined, headers);
}

/**
 * Helper for POST requests
 */
export async function postData<T = any>(url: string, data: any, headers: HeadersInit = {}): Promise<T> {
  return apiRequest<T>(url, "POST", data, headers);
}

/**
 * Helper for PUT requests
 */
export async function putData<T = any>(url: string, data: any, headers: HeadersInit = {}): Promise<T> {
  return apiRequest<T>(url, "PUT", data, headers);
}

/**
 * Helper for PATCH requests
 */
export async function patchData<T = any>(url: string, data: any, headers: HeadersInit = {}): Promise<T> {
  return apiRequest<T>(url, "PATCH", data, headers);
}

/**
 * Helper for DELETE requests
 */
export async function deleteData<T = any>(url: string, headers: HeadersInit = {}): Promise<T> {
  return apiRequest<T>(url, "DELETE", undefined, headers);
}