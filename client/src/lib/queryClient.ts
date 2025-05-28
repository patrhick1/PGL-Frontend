// client/src/lib/queryClient.ts
import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Use VITE_API_BASE_URL from .env, default to Python backend's typical local dev URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

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
    throw new Error(`${res.status}: ${message}`);
  }
}

export async function apiRequest(
  method: string,
  urlPath: string, // Expecting path like "/campaigns" or "/people/1"
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = `${API_BASE_URL}${urlPath.startsWith('/') ? urlPath : '/' + urlPath}`;
  
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Important for sending cookies
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

// Updated getQueryFn to handle 401 for useAuth correctly
export const getQueryFn = <T>(options?: { on401?: UnauthorizedBehavior }): QueryFunction<T> =>
  async ({ queryKey }) => {
    const urlPath = queryKey[0] as string;
    const fullUrl = `${API_BASE_URL}${urlPath.startsWith('/') ? urlPath : '/' + urlPath}`;
    
    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (!res.ok) {
      if (res.status === 401 && options?.on401 === "returnNull") {
        return null as T; // Return null if 401 and on401 is 'returnNull'
      }
      // For other errors, or if on401 is 'throw' (default)
      let errorPayload: any = { message: res.statusText };
      try {
        errorPayload = await res.json();
      } catch (e) { /* ignore */ }
      const message = errorPayload.detail || errorPayload.message || res.statusText;
      throw new Error(`${res.status}: ${message}`);
    }
    if (res.status === 204) { // Handle No Content responses
        return null as T;
    }
    return await res.json();
  };


export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn(), // Default queryFn
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});