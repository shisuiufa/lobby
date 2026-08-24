import type { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
}

export function Card({ children }: AuthCardProps) {
  return (
    <div className="animate-card-pop max-w-6xl w-full h-auto bg-white/90 rounded-4xl backdrop-blur-[3px] overflow-hidden">
      {children}
    </div>
  );
}
