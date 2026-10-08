import Link from "next/link";
import { ArrowRight, CircleDollarSign, ShoppingBag, Store } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { TrustSection } from "@/components/home/trust-section";
import { categories, featuredGames } from "@/data/mock-store";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main>
        <Hero />

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Категории</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Найдите подходящий товар</h2>
            </div>
            <Link href="/games" className="hidden items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200 sm:inline-flex">
              Все категории <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {categories.map((category, idx) => (
              <Link
                key={category}
                href="/games"
                className="group rounded-[26px] border border-white/10 bg-slate-900/80 p-5 transition hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-slate-900"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 via-cyan-500/15 to-emerald-500/20 text-xl">
                  {"🧩"}
                </div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{category}</h3>
                  <span className="text-xs text-cyan-300">0{idx + 1}</span>
                </div>
                <p className="text-sm leading-6 text-slate-300">Автоматическая выдача, безопасные сделки и проверенные продавцы.</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Популярные игры</p>
              <h2 className="mt-3 text-3xl font-black text-white">Сейчас в тренде</h2>
            </div>
            <Link href="/games" className="text-sm text-slate-300 hover:text-white">Посмотреть все</Link>
          </div>

          <div className="flex flex-wrap gap-3">
            {featuredGames.map((game) => (
              <Link
                key={game}
                href="/games"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-200"
              >
                {game}
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Gameshop</p>
            <h2 className="mt-3 text-3xl font-black text-white">Выберите свою сторону</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/buyer" className="group rounded-2xl border border-white/10 bg-slate-900/80 p-6 transition hover:border-cyan-400/40">
              <ShoppingBag className="h-7 w-7 text-cyan-300" />
              <h3 className="mt-5 text-xl font-bold text-white">Покупатель</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">Аккаунт, избранное и история ваших покупок.</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-cyan-200">Личный кабинет <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </Link>
            <Link href="/seller" className="group rounded-2xl border border-white/10 bg-slate-900/80 p-6 transition hover:border-emerald-400/40">
              <Store className="h-7 w-7 text-emerald-300" />
              <h3 className="mt-5 text-xl font-bold text-white">Продавец</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">Подайте заявку на магазин. Статус продавца назначается только после проверки.</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-200">Раздел продавца <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </Link>
          </div>
        </section>

        <TrustSection />

        <section className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-white/10 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 p-7 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-amber-200">Платёжный статус</p>
                  <h3 className="mt-3 text-3xl font-black text-white">Онлайн-оплата пока отключена</h3>
                  <p className="mt-3 max-w-2xl leading-7 text-slate-300">Добавление товара в корзину не списывает деньги. Оформление заказа включим после подключения и проверки платёжного backend.</p>
              </div>
                <div className="flex items-center gap-3 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm text-amber-100">
                  <CircleDollarSign className="h-4 w-4" />
                  Деньги не списываются
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
