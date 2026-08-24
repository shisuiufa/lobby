import type { ButtonHTMLAttributes } from "react";
import { type ButtonColor, BUTTON_COLOR } from "../model/types";

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ButtonColor;
  isLoading?: boolean;
}

export function Button({
  children,
  isLoading,
  className = "",
  color = BUTTON_COLOR.PRIMARY,
  disabled,
  ...props
}: AuthButtonProps) {
  const btnColor = color === BUTTON_COLOR.PRIMARY ? "bg-primary" : "bg-ink";

  return (
    <button
      disabled={disabled || isLoading}
      className={`rounded-full  text-white px-6 py-5 font-semibold leading-none cursor-pointer w-full
                 disabled:opacity-50 transition-opacity ${className} ${btnColor}`}
      {...props}
    >
      {isLoading ? "Загрузка..." : children}
    </button>
  );
}
