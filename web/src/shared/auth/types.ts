export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
}

export interface AuthAction {
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  clearTokens: () => void;
}
