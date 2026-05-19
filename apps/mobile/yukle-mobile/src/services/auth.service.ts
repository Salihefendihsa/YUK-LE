import axios from 'axios';

const BASE_URL = 'http://192.168.1.159:5151';

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  role: string;
  userId: number;
  fullName: string;
}

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await axios.post(
      `${BASE_URL}/api/Auth/login`,
      data,
      {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return response.data;
  },
};
