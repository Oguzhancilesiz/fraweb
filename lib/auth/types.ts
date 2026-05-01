export type AuthUser = {
  userId: string;
  email: string;
  fullName: string | null;
  roles: string[];
};

export type LoginResponse = {
  accessToken: string;
  expiresAtUtc: string;
  tokenType: string;
  user: {
    userId: string;
    email: string;
    fullName: string | null;
    roles: string[];
  };
};
