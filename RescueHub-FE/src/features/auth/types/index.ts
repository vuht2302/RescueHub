export interface Login {
  username: string;
  phone: string;
  password: string;
}
export interface AuthData {
  accessToken: string;
  username: string;
  role: string;
}
export interface LoginResponse {
  success: boolean;
  message: string;
  data: AuthData;
  error: null | string[];
}
export interface AuthState {
  user: AuthData | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: null | string[];
}
export interface MyData {
  userId: string;
  username: string;
  role: string;
}
