"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/components/auth/auth-provider";

type AuthMode = "login" | "register";

function getAuthMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) return "Не удалось выполнить запрос. Попробуйте ещё раз.";

  const messages: Record<string, string> = {
    "auth/email-already-in-use": "Этот адрес уже зарегистрирован.",
    "auth/invalid-credential": "Проверьте адрес почты и пароль.",
    "auth/invalid-email": "Введите корректный адрес электронной почты.",
    "auth/weak-password": "Пароль должен содержать не менее 6 символов.",
    "auth/popup-closed-by-user": "Окно входа Google было закрыто.",
    "auth/operation-not-allowed": "Этот способ входа ещё не включён в Firebase Console.",
    "permission-denied": "Firebase Firestore не разрешил сохранить профиль. Проверьте опубликованные Security Rules.",
  };

  return messages[error.code] ?? `Ошибка Firebase: ${error.code}`;
}

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "register") await signUp(name.trim(), email.trim(), password);
      else await signIn(email.trim(), password);
      router.push("/account");
    } catch (authError) {
      setError(getAuthMessage(authError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      router.push("/account");
    } catch (authError) {
      setError(getAuthMessage(authError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="w-full max-w-md rounded-[28px] border border-white/10 bg-slate-900/90 p-6 shadow-2xl sm:p-8">
      <div className="mb-6 flex rounded-full border border-white/10 bg-slate-950 p-1">
        {(["login", "register"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => { setMode(item); setError(""); }}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${mode === item ? "bg-white text-slate-950" : "text-slate-300 hover:text-white"}`}
          >
            {item === "login" ? "Войти" : "Регистрация"}
          </button>
        ))}
      </div>

      <h1 className="text-2xl font-black text-white">
        {mode === "login" ? "С возвращением" : "Создать аккаунт"}
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        {mode === "login" ? "Войдите, чтобы управлять заказами." : "Профиль покупателя будет создан после регистрации."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "register" && (
          <label className="block text-sm text-slate-300">
            Имя
            <input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-cyan-400" />
          </label>
        )}
        <label className="block text-sm text-slate-300">
          Электронная почта
          <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-cyan-400" />
        </label>
        <label className="block text-sm text-slate-300">
          Пароль
          <input required minLength={6} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-cyan-400" />
        </label>

        {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

        <button disabled={isSubmitting} className="h-11 w-full rounded-full bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">
          {isSubmitting ? "Подождите..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
        <span className="h-px flex-1 bg-white/10" />
        или
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <button disabled={isSubmitting} onClick={handleGoogleSignIn} className="h-11 w-full rounded-full border border-white/10 bg-white/5 font-medium text-white transition hover:border-cyan-400/40 disabled:opacity-60">
        Продолжить с Google
      </button>
    </section>
  );
}