import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Input } from "./Input";
import { Button } from "./Button";
import { registerSchema } from "../model/schemas";
import type { RegisterFormValues } from "../model/types";
// import { register as registerApi } from "../api/register";
import { useNavigate } from "react-router";

export function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const navigate = useNavigate();

  // const { mutate, isPending } = useMutation({
  //   mutationFn: registerApi,
  //   onSuccess: () => {
  //     navigate("/register-success");
  //   },
  // });

  const onSubmit: SubmitHandler<RegisterFormValues> = (data) => {
    // mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Input
        type="email"
        label="E-mail"
        placeholder="Введите email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        type="text"
        label="Отображаемое имя"
        placeholder="Введите отображаемое имя"
        error={errors.displayName?.message}
        {...register("displayName")}
      />
      <Input
        type="text"
        label="Имя пользователя"
        placeholder="Введите имя"
        error={errors.username?.message}
        {...register("username")}
      />
      <Input
        type="password"
        label="Пароль"
        placeholder="Введите пароль"
        error={errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" isLoading={isPending}>
        Создать учётную запись
      </Button>
    </form>
  );
}
