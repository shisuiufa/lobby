import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type AuthState, type AuthAction } from "./types";

export const useAuthStore = create<AuthState & AuthAction>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      setTokens: (tokens) => set(tokens),
      clearTokens: () => set({ accessToken: null, refreshToken: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ refreshToken: state.refreshToken }),
    },
  ),
);

export const getAccessToken = () => useAuthStore.getState().accessToken;
export const getRefreshToken = () => useAuthStore.getState().refreshToken;
