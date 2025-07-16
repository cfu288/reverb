import { AuthService } from "@/services/authService";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}


export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchWithAuth<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth = false, headers = {}, ...restOptions } = options;
  
  // Get token from AuthService (handles auto-refresh)
  const authToken = skipAuth ? null : await AuthService.getAccessToken();
  
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };
  
  if (authToken) {
    finalHeaders["Authorization"] = `Bearer ${authToken}`;
  }
  
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: finalHeaders,
      credentials: "include", // Include cookies for fingerprint
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new ApiError(
        response.status,
        data.error || data.message || "An error occurred",
        data
      );
    }
    
    // Handle the API response format
    if ("success" in data && !data.success) {
      throw new ApiError(
        response.status,
        data.error || data.message || "Request failed",
        data
      );
    }
    
    return data.data || data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new ApiError(0, "Network error: Unable to connect to server");
    }
    
    throw new ApiError(0, error instanceof Error ? error.message : "Unknown error");
  }
}

// Auth-specific API functions
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    return fetchWithAuth<{
      token_type: string;
      access_token: string;
      expires_in: number;
      refresh_token: string;
      id_token: string;
    }>("/user/login", {
      method: "POST",
      body: JSON.stringify(credentials),
      skipAuth: true,
    });
  },
  
  register: async (data: { 
    username: string;
    email: string; 
    password: string; 
    first_name: string;
    last_name: string;
  }) => {
    return fetchWithAuth<{
      id: string;
      username: string;
      email: string;
      first_name: string;
      last_name: string;
    }>("/user", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    });
  },
  
  refresh: async (refreshToken: string) => {
    return fetchWithAuth<{
      token_type: string;
      access_token: string;
      expires_in: number;
      refresh_token: string;
      id_token: string;
    }>("/user/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
      skipAuth: true,
    });
  },
};

