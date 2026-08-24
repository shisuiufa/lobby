import { AuthTabs } from "./AuthTabs";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { AUTH_MODE, type AuthMode } from "../model/types";
import { useState } from "react";

export function AuthSection() {
  const [mode, setMode] = useState<AuthMode>(AUTH_MODE.LOGIN);

  const isLoginMode = mode === AUTH_MODE.LOGIN;

  return (
    <div className="flex-1 px-16 py-13">
      <AuthTabs mode={mode} onChange={setMode} />

      <h1 className="text-4xl mt-5 font-manrope font-extrabold text-slate-900 leading-normal">
        {isLoginMode ? "Рады вас видеть!" : "Добро пожаловать!"}
      </h1>

      <p className="mt-2 text-slate-500 text-sm mb-8">
        {isLoginMode
          ? "Войдите, чтобы продолжить общение."
          : "Создайте аккаунт, чтобы общаться и создавать свои сообщества."}
      </p>

      {isLoginMode ? <LoginForm /> : <RegisterForm />}
    </div>
  );
}
