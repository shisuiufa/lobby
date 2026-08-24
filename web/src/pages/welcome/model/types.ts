import { instantMeetingSchema, loginSchema, registerSchema } from "./schemas";
import { z } from "zod";

export const AUTH_MODE = {
  LOGIN: "Login",
  REGISTER: "Register",
} as const;

export type AuthMode = (typeof AUTH_MODE)[keyof typeof AUTH_MODE];

export interface Tab {
  id: AuthMode;
  name: string;
}

export const BUTTON_COLOR = {
  PRIMARY: "primary",
  DARK: "dark",
} as const;

export type ButtonColor = (typeof BUTTON_COLOR)[keyof typeof BUTTON_COLOR];

export type InstantMeetingFormValues = z.infer<typeof instantMeetingSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
