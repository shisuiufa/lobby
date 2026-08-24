import { Outlet } from "react-router";
import bgImage from "@shared/resources/images/auth-bg.jpeg";

export function AuthLayout() {
  return (
    <div
      className={`w-svw h-svh px-32 py-5 bg-cover bg-no-repeat flex justify-center items-center`}
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <Outlet />
    </div>
  );
}
