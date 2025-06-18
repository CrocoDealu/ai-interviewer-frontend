const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: 'Network Error', 
        message: 'Failed to connect to server' 
      }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  // Authentication endpoints
  async signup(email: string, password: string, name: string) {
    const response = await fetch(`${this.baseURL}/auth/signup`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password, name }),
    });

    const data = await this.handleResponse<{
      message: string;
      user: any;
      token: string;
    }>(response);

    this.setToken(data.token);
    return data;
  }

  async login(email: string, password: string) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    const data = await this.handleResponse<{
      message: string;
      user: any;
      token: string;
    }>(response);

    this.setToken(data.token);
    return data;
  }

  async getCurrentUser() {
    const response = await fetch(`${this.baseURL}/auth/me`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<{ user: any }>(response);
  }

  async refreshToken() {
    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse<{
      message: string;
      token: string;
    }>(response);

    this.setToken(data.token);
    return data;
  }

  // Interview endpoints
  async startInterview(setup: {
    industry: string;
    difficulty: 'easy' | 'medium' | 'hard';
    personality: 'intimidator' | 'friendly' | 'robotic' | 'curveball';
    role?: string;
    company?: string;
  }) {
    const response = await fetch(`${this.baseURL}/interviews/start`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(setup),
    });

    return this.handleResponse<{
      message: string;
      interview: any;
    }>(response);
  }

  async getInterview(id: string) {
    const response = await fetch(`${this.baseURL}/interviews/${id}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<{ interview: any }>(response);
  }

  async addMessage(interviewId: string, content: string, sender: 'user' | 'ai') {
    const response = await fetch(`${this.baseURL}/interviews/${interviewId}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ content, sender }),
    });

    return this.handleResponse<{
      message: string;
      userMessage: any;
      aiMessage?: any;
    }>(response);
  }

  async endInterview(id: string) {
    const response = await fetch(`${this.baseURL}/interviews/${id}/end`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    return this.handleResponse<{
      message: string;
      interview: any;
    }>(response);
  }

  async getUserInterviews() {
    const response = await fetch(`${this.baseURL}/interviews`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<{
      interviews: any[];
      total: number;
    }>(response);
  }

  // User endpoints
  async getUserProfile() {
    const response = await fetch(`${this.baseURL}/users/profile`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<{ user: any }>(response);
  }

  async updateUserProfile(data: { name?: string; avatar?: string }) {
    const response = await fetch(`${this.baseURL}/users/profile`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<{
      message: string;
      user: any;
    }>(response);
  }

  async getUserStats() {
    const response = await fetch(`${this.baseURL}/users/stats`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<{ stats: any }>(response);
  }

  // Health check
  async healthCheck() {
    const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
    return this.handleResponse<{
      status: string;
      timestamp: string;
      uptime: number;
    }>(response);
  }

  logout() {
    this.setToken(null);
  }
}

export const apiService = new ApiService();