import { AuthService } from "@/services/authService";
import { TenantsArraySchema } from "@/schemas/auth";
import { ZodError } from "zod";

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

// Helper function to handle Zod validation with better error messages
function validateWithSchema<T>(schema: { parse: (data: unknown) => T }, data: unknown, context: string): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(`Validation error in ${context}:`, error.errors);
      throw new ApiError(500, `Invalid response format from server in ${context}`, error.errors);
    }
    throw error;
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

  getTenants: async () => {
    const response = await fetchWithAuth("/api/v1/org", {
      method: "GET",
    });
    return validateWithSchema(TenantsArraySchema, response, 'getTenants');
  },

};

// Main API service with tenant context
export class ApiService {
  private static currentTenant: string | null = null;

  static setCurrentTenant(tenantUrlSafeName: string | null) {
    this.currentTenant = tenantUrlSafeName;
  }

  private static getTenant(): string | null {
    // Use the set tenant or fall back to localStorage
    return this.currentTenant || localStorage.getItem('current_tenant_url_safe_name');
  }

  private static async request<T = any>(
    method: string,
    path: string,
    options?: Omit<FetchOptions, 'method'>
  ): Promise<T> {
    const tenant = this.getTenant();
    if (!tenant && !path.startsWith('/user') && !path.startsWith('/api/v1/org')) {
      throw new ApiError(0, "No tenant selected");
    }
    
    // Add tenant context to path if needed
    const fullPath = path.startsWith('/api/v1/org/') 
      ? path 
      : tenant && !path.startsWith('/user') && !path.startsWith('/api/v1/org')
        ? `/api/v1/org/${tenant}${path}`
        : path;
    
    return fetchWithAuth<T>(fullPath, {
      ...options,
      method,
    });
  }

  static async getPatientLists() {
    return this.request('GET', '/patient-list');
  }

  static async getPatientList(urlSafeName: string) {
    return this.request('GET', `/patient-list/${urlSafeName}`);
  }

  static async createPatientList(data: { display_name: string; url_safe_name: string }) {
    return this.request('POST', '/patient-list', {
      body: JSON.stringify(data),
    });
  }

  static async deletePatientList(urlSafeName: string) {
    return this.request('DELETE', `/patient-list/${urlSafeName}`);
  }

  static async getPatient(id: string) {
    return this.request('GET', `/patient/${id}`);
  }

  static async createPatient(listUrlSafeName: string, data: any) {
    return this.request('POST', `/patient-list/${listUrlSafeName}/patient`, {
      body: JSON.stringify(data),
    });
  }

  static async updatePatient(id: string, data: any) {
    return this.request('PUT', `/patient/${id}`, {
      body: JSON.stringify(data),
    });
  }

  static async deletePatient(id: string) {
    return this.request('DELETE', `/patient/${id}`);
  }
}

export const api = ApiService;

