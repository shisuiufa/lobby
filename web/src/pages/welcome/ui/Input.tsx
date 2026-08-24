import { type InputHTMLAttributes, useId } from "react";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, ...props }: AuthInputProps) {
  const id = useId();

  return (
    <div>
      <label
        className="block text-slate-800 font-semibold text-sm"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        className={`
          w-full
          text-base 
          px-5 py-4 
          bg-white 
          mt-2 
          rounded-3xl 
          leading-none 
          border
          outline-none
          transition
          focus:ring-1
          ${
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-slate-600 focus:border-primary focus:ring-primary"
          }
        `}
        id={id}
        {...props}
      />
      <div
        className={`
          grid transition-[grid-template-rows] duration-300
          ${error ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}
        `}
      >
        <div className="overflow-hidden">
          <span className="block text-red-500 text-xs mt-2">{error}</span>
        </div>
      </div>
    </div>
  );
}
