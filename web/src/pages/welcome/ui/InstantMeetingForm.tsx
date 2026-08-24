import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "./Input";
import { Button } from "./Button";
import { BUTTON_COLOR } from "../model/types";
import { instantMeetingSchema } from "../model/schemas";
import type { InstantMeetingFormValues } from "../model/types";
import { useMutation } from "@tanstack/react-query";
// import { meeting } from "../api/meeting";

export function InstantMeetingForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InstantMeetingFormValues>({
    resolver: zodResolver(instantMeetingSchema),
  });

  // const { mutate, isPending, error } = useMutation({
  //   mutationFn: meeting,
  // });

  const onSubmit: SubmitHandler<InstantMeetingFormValues> = (data) => {
    // mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Input
        type="text"
        label="Ваше имя"
        placeholder="Введите отображаемое имя"
        error={errors.displayName?.message || error?.message}
        {...register("displayName")}
      />
      <Button
        type="submit"
        color={BUTTON_COLOR.DARK}
        isLoading={isPending}
        className="w-full bg-ink text-white"
      >
        Создать комнату
      </Button>
    </form>
  );
}
