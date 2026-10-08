"use client";

import Link from "next/link";
import { Heart, ShoppingBag, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

export default function BuyerPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <main className="mx-auto max-w-6xl px-4 py-16 text-slate-300">Загружаем кабинет...</main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Покупателю</p>
      <h1 className="mt-4 text-4xl font-black text-white">Кабинет покупателя</h1>
      <p className="mt-3 text-slate-300">{user ? `Вы вошли как ${user.displayName || user.email}.` : "Войдите, чтобы пользоваться личными функциями."}</p>

      {!user && (
        <Link href="/login" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 font-semibold text-slate-950">Войти или зарегистрироваться</Link>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <BuyerLink href="/account" icon={<UserRound className="h-5 w-5" />} title="Профиль" description="Данные и настройки аккаунта." />
        <BuyerLink href="/cart" icon={<ShoppingBag className="h-5 w-5" />} title="Корзина" description="Товары, которые вы добавили." />
        <BuyerLink href="/favorites" icon={<Heart className="h-5 w-5" />} title="Избранное" description="Сохранённые объявления продавцов." />
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900/80 p-6">
        <h2 className="text-xl font-bold text-white">Мои заказы</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">Здесь будут отображаться оформленные заказы. Оплата и создание заказов пока отключены, поэтому фиктивной истории нет.</p>
      </section>
    </main>
  );
}

function BuyerLink({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 transition hover:border-cyan-400/40">
      <span className="text-cyan-300">{icon}</span>
      <h2 className="mt-4 font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </Link>
  );
}