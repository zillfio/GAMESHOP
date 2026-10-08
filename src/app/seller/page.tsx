"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth/auth-provider";
import { SellerWorkspace } from "@/components/seller/seller-workspace";
import { db } from "@/lib/firebase";

type SellerAccess = {
  role: string;
  application: Record<string, unknown> | null;
};

export default function SellerPage() {
  const { user, isLoading } = useAuth();
  const [access, setAccess] = useState<SellerAccess | null>(null);
  const [checkedUid, setCheckedUid] = useState<string | null>(null);
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    if (!user) return () => { active = false; };
    Promise.all([
      getDoc(doc(db, "users", user.uid)),
      getDoc(doc(db, "sellerApplications", user.uid)),
    ]).then(([profile, application]) => {
      if (!active) return;
      setAccess({
        role: String(profile.data()?.role ?? "BUYER"),
        application: application.exists() ? application.data() : null,
      });
      setStoreName(String(application.data()?.storeName ?? user.displayName ?? ""));
      setDescription(String(application.data()?.description ?? ""));
    }).catch(() => {
      if (active) setError("Не удалось проверить профиль и заявку. Проверьте подключение к Firestore.");
    }).finally(() => {
      if (active) setCheckedUid(user.uid);
    });

    return () => { active = false; };
  }, [refreshKey, user]);

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError("");
    try {
      await setDoc(doc(db, "sellerApplications", user.uid), {
        uid: user.uid,
        storeName: storeName.trim(),
        description: description.trim(),
        status: "PENDING",
        createdAt: serverTimestamp(),
      });
      setRefreshKey((key) => key + 1);
    } catch (submitError) {
      setError(submitError instanceof FirebaseError && submitError.code === "permission-denied"
        ? "Firestore отклонил заявку. Убедитесь, что вы вошли как покупатель и правила опубликованы."
        : "Не удалось отправить заявку. Попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || (user && checkedUid !== user.uid)) {
    return <main className="mx-auto max-w-6xl px-4 py-16 text-slate-300">Проверяем доступ к кабинету продавца...</main>;
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black text-white">Раздел продавца</h1>
        <p className="mt-4 text-slate-300">Войдите, чтобы подать заявку или открыть свой магазин.</p>
        <Link href="/login/" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 font-semibold text-slate-950">Войти или зарегистрироваться</Link>
      </main>
    );
  }

  if (access?.role === "SELLER") {
    return <SellerWorkspace userId={user.uid} email={user.email} displayName={user.displayName} />;
  }

  const applicationStatus = String(access?.application?.status ?? "");
  if (applicationStatus === "PENDING" || applicationStatus === "REJECTED") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm uppercase tracking-[0.22em] text-emerald-300">Заявка продавца</p>
        <h1 className="mt-4 text-4xl font-black text-white">{applicationStatus === "PENDING" ? "Заявка на проверке" : "Заявка отклонена"}</h1>
        <p className="mt-4 leading-7 text-slate-300">{applicationStatus === "PENDING" ? "Статус обновится здесь после решения администратора." : "Свяжитесь с поддержкой, чтобы уточнить причину и возможность повторной подачи."}</p>
        {error && <p role="alert" className="mt-5 text-sm text-rose-200">{error}</p>}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm uppercase tracking-[0.22em] text-emerald-300">Раздел продавца</p>
      <h1 className="mt-4 text-4xl font-black text-white">Подключите свой магазин</h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-300">После проверки заявки откроются объявления и рабочее место продавца.</p>
      <form onSubmit={submitApplication} className="mt-8 max-w-2xl space-y-4 rounded-2xl border border-white/10 bg-slate-900/80 p-6">
        <label className="block text-sm text-slate-300">Название магазина
          <input required minLength={2} maxLength={60} value={storeName} onChange={(event) => setStoreName(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-emerald-400" />
        </label>
        <label className="block text-sm text-slate-300">Что планируете продавать?
          <textarea required minLength={10} maxLength={500} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-400" />
        </label>
        {error && <p role="alert" className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
        <button disabled={isSubmitting} className="h-11 rounded-full bg-white px-5 font-semibold text-slate-950 disabled:opacity-60">{isSubmitting ? "Отправляем..." : "Отправить на проверку"}</button>
      </form>
    </main>
  );
}
