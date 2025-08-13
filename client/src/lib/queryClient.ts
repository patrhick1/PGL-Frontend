// client/src/lib/queryClient.ts
import { QueryClient, QueryFunction } from "@tanstack/react-query";

// VITE_API_BASE_URL should be "http://localhost:8000" from .env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorPayload: any = { message: res.statusText };
    try {
      errorPayload = await res.json();
    } catch (e) {
      // If response is not JSON, use statusText
    }
    // Use detail from FastAPI if available
    const message = errorPayload.detail || errorPayload.message || res.statusText;
    // Construct a new Error object to include status
    const error = new Error(`${res.status}: ${message}`) as any;
    error.status = res.status;
    error.payload = errorPayload;
    throw error;
  }
}

export async function apiRequest(
  method: string,
  urlPath: string, // Expecting path like "/campaigns" or "/people/1" (these are full paths from root)
  data?: unknown | undefined,
): Promise<Response> {
  // urlPath should be the full path from the server root, e.g., "/token", "/campaigns/"
  const fullUrl = `${API_BASE_URL}${urlPath.startsWith('/') ? urlPath : '/' + urlPath}`;
  
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include", // Important for sending cookies
    });

    // Log failed requests for debugging (only in development)
    if (!res.ok && import.meta.env.DEV) {
      console.warn(`API Request failed: ${method} ${fullUrl}`, {
        status: res.status,
        statusText: res.statusText,
        url: fullUrl
      });
    }

    return res; // Return the raw response
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`API Request error: ${method} ${fullUrl}`, error);
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn = <T>(options?: { on401?: UnauthorizedBehavior }): QueryFunction<T> =>
  async ({ queryKey }) => {
    const urlPath = queryKey[0] as string; 
    const paramsObject = queryKey.length > 1 && typeof queryKey[1] === 'object' && queryKey[1] !== null 
                         ? queryKey[1] as Record<string, any> 
                         : undefined;

    let fullUrl = `${API_BASE_URL}${urlPath.startsWith('/') ? urlPath : '/' + urlPath}`;

    if (paramsObject) {
      const queryParams = new URLSearchParams();
      for (const key in paramsObject) {
        if (Object.prototype.hasOwnProperty.call(paramsObject, key) && paramsObject[key] !== undefined) {
          queryParams.append(key, String(paramsObject[key]));
        }
      }
      const queryString = queryParams.toString();
      if (queryString) {
        fullUrl += `?${queryString}`;
      }
    }
    
    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (!res.ok) {
      if (res.status === 401 && options?.on401 === "returnNull") {
        return null as T; 
      }
      let errorPayload: any = { message: res.statusText };
      try {
        errorPayload = await res.json();
      } catch (e) { /* ignore */ }
      const message = errorPayload.detail || errorPayload.message || res.statusText;
      const error = new Error(`${res.status}: ${message}`) as any;
      error.status = res.status;
      error.payload = errorPayload;
      throw error;
    }
    if (res.status === 204) { 
        return null as T;
    }
    return await res.json();
  };


export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn(), 
      refetchInterval: false,
      refetchOnWindowFocus: false, // Consider setting to true for better UX
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Do not retry on 401 or 404 errors
        if (error.status === 401 || error.status === 404) {
          return false;
        }
        return failureCount < 2; // Retry twice for other errors
      },
    },
    mutations: {
      retry: false,
    },
  },
});