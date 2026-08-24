import { BrowserRouter, Route, Routes } from "react-router";
import { WelcomePage } from "@pages/welcome";
import { ConfirmEmailPage } from "@pages/confirm-email";
import { RegisterSuccessPage } from "@pages/register-success";
import { AuthLayout } from "@app/layouts/AuthLayout";

export function RouterProvider() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/confirm-email" element={<ConfirmEmailPage />} />
          <Route path="/register-success" element={<RegisterSuccessPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
