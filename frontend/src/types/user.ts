export interface User {
  id: number;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterRequest extends UserCredentials {
  confirmPassword?: string;
}
