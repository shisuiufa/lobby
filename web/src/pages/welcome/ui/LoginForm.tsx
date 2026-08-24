import { Link } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";
import { Input } from "./Input";
import { Button } from "./Button";
import { loginSchema } from "../model/schemas";
import type { LoginFormValues } from "../model/types";
import { useMutation } from "@tanstack/react-query";
import { login } from "../api/login";

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {mutate, isPending} = useMutation({
    mutationFn: login,
  });

  const onSubmit: SubmitHandler<LoginFormValues> = (data) => {
    mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Input
        type="email"
        label="Адрес электронной почты"
        placeholder="Введите email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        type="password"
        label="Пароль"
        placeholder="Введите пароль"
        error={errors.password?.message}
        {...register("password")}
      />
      <Link to="" className="text-right text-primary-500 font-semibold text-xs">
        Забыли пароль?
      </Link>
      <Button type="submit" isLoading={isPending}>
        Вход
      </Button>
    </form>
  );
}
