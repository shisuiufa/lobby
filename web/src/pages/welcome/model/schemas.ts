import { z } from "zod";

export const instantMeetingSchema = z.object({
  displayName: z
    .string()
    .min(5, "Имя пользователя должно содержать минимум 5 символов"),
});

export const loginSchema = z.object({
  email: z.email("Введите корректный адрес электронной почты"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});

export const registerSchema = z.object({
  email: z.email("Введите корректный адрес электронной почты"),
  username: z
    .string()
    .min(5, "Имя пользователя должно содержать минимум 5 символов"),
  displayName: z
    .string()
    .min(5, "Отображаемое имя должно содержать минимум 5 символов"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});
