export interface PendingRegistration {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  passwordHash: string;
}

export interface AuthUser {
  id: string;
}

export interface AccessTokenPayload {
  sub: string;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  type: "refresh";
  jti: string;
}
