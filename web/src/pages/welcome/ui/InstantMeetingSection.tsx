import { InstantMeetingForm } from "./InstantMeetingForm";
import meetingImage from "../resources/images/meeting.jpeg";
import { Link } from "react-router";

export function InstantMeetingSection() {
  return (
    <div className="flex-1 px-16 py-13 bg-[#F8FAFC]">
      <div className="bg-[#6B38D4]/10 rounded-full w-fit px-4 py-2 flex justify-center items-center gap-2">
        <div className="rounded-full w-2 h-2 bg-primary animate-pulse"></div>
        <p className="leading-none font-inter font-semibold text-sm text-primary">
          Без регистрации
        </p>
      </div>

      <h1 className="text-4xl mt-2 font-manrope font-extrabold text-slate-900 leading-normal">
        Мгновенная встреча
      </h1>

      <p className="mt-2 text-slate-500 text-sm mb-5">
        Создайте встречу или присоединитесь по ссылке — аккаунт не нужен.
      </p>

      <img
        className="w-full h-48 object-cover rounded-2xl mb-5"
        src={meetingImage}
        alt="meeting"
      />

      <InstantMeetingForm />

      <p className="mt-15 text-slate-400 text-sm mb-5">
        Присоединяясь к комнате, вы принимаете наши{" "}
        <Link to="" className="text-primary-400 underline">
          Условия использования
        </Link>{" "}
        и{" "}
        <Link to="" className="text-primary-400 underline">
          Политику конфиденциальности
        </Link>
        . Ссылки на комнаты для гостей истекают через 24 часа.
      </p>
    </div>
  );
}
