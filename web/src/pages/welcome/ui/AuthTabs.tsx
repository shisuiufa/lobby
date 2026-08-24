import type { AuthMode, Tab } from "../model/types";

interface AuthTabsProps {
  mode: AuthMode;
  onChange: (mode: AuthMode) => void;
}

const tabs: Tab[] = [
  {
    id: "Login",
    name: "Вход",
  },
  {
    id: "Register",
    name: "Создать аккаунт",
  },
];

export function AuthTabs({ mode, onChange }: AuthTabsProps) {
  return (
    <div className="relative">
      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gray-300/80" />

      <div className="relative grid grid-cols-2 gap-8">
        <span
          className={`
            absolute bottom-0 left-0
            h-0.75 w-[calc(50%-1rem)]
            rounded-full bg-primary
            transition-transform duration-300 ease-out
            ${
              mode === "Login"
                ? "translate-x-0"
                : "translate-x-[calc(100%+2rem)]"
            }
          `}
        />

        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`
              relative pb-4 text-left text-sm font-semibold leading-none
              transition-colors outline-none cursor-pointer
              ${mode === tab.id ? "text-primary" : "text-gray-400"}
            `}
            onClick={() => onChange(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </div>
    </div>
  );
}
