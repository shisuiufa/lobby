import { Card } from "@shared/ui";

export function RegisterSuccessPage() {
  return (
    <Card>
      <div className="px-16 py-13">
        <h1 className="mb-4 font-manrope text-4xl font-extrabold text-neutral-900">
          Регистрация завершена
        </h1>

        <p className="mb-6 text-md leading-6 text-neutral-600">
          Мы отправили письмо с подтверждением на вашу почту. Проверьте входящие
          и перейдите по ссылке в письме, чтобы подтвердить аккаунт.
        </p>
      </div>
    </Card>
  );
}
