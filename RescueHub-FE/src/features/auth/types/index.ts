export type InternalRole =
  | "TEAM_LEADER"
  | "ADMIN"
  | "MANAGER"
  | "TEAM_MEMBER"
  | "COORDINATOR";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface CitizenRegisterRequest {
  displayName: string;
  phone: string;
  password: string;
}

export interface AuthUser {
  id: string;
  displayName: string;
  phone: string;
  roles: InternalRole[];
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: AuthUser;
}
export interface LogoutRequest {
  success: string;
  message: string;
  data: null;
  errors: null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: null | string[];
}
