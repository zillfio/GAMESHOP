"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Star } from "lucide-react";
import { ProductCard } from "@/components/catalog/product-card";
import { useActiveProducts } from "@/components/catalog/use-active-products";
import { rankProducts } from "@/lib/catalog";

export function FeaturedListings({ compact = false }: { compact?: boolean }) {
  const { products, status } = useActiveProducts();
  const featured = rankProducts(products).slice(0, compact ? 3 : 6);

  if (compact) {
    return (
      <aside className="rounded-[28px] border border-white/10 bg-slate-900/85 p-5 shadow-[0_30px_100px_rgba(15,23,42,0.55)] sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Витрина Gameshop</p>
            <h2 className="mt-2 text-xl font-bold text-white">Лучшие предложения</h2>
          </div>
          {status === "ready" && products.length > 0 && (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200">{products.length} в наличии</span>
          )}
        </div>

        {status === "loading" ? (
          <div className="space-y-3" aria-label="Загрузка предложений">
            {[0, 1, 2].map((item) => <div key={item} className="h-[74px] animate-pulse rounded-2xl bg-slate-800" />)}
          </div>
        ) : status === "error" ? (
          <div role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-5 text-sm leading-6 text-rose-100">
            Не удалось получить объявления из Firestore. Попробуйте обновить страницу.
          </div>
        ) : featured.length > 0 ? (
          <div className="space-y-3">
            {featured.map((product) => (
              <Link key={product.id} href={`/product?id=${encodeURIComponent(product.id)}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-3 transition hover:border-cyan-400/40">
                <div className="min-w-0">
                  <p className="truncate text-xs text-slate-400">{product.game}</p>
                  <p className="mt-1 truncate font-medium text-white">{product.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-amber-300">
                    <Star className="h-3 w-3 fill-current" />
                    {product.rating > 0 ? product.rating.toFixed(1) : "Новый продавец"}
                    {product.verified && <BadgeCheck className="h-3.5 w-3.5 text-cyan-300" />}
                  </p>
                </div>
                <span className="shrink-0 text-right text-lg font-bold text-cyan-300">{product.price} сом</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/50 p-5">
            <p className="font-semibold text-white">Пока нет активных объявлений</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">Здесь автоматически появятся предложения продавцов. Сейчас в каталоге ничего не продаётся.</p>
            <Link href="/seller" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-white">
              Подать заявку продавца <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </aside>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Каталог</p>
          <h2 className="mt-3 text-3xl font-black text-white">Лучшие активные объявления</h2>
        </div>
        <Link href="/games" className="inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-white">Весь каталог <ArrowRight className="h-4 w-4" /></Link>
      </div>
      {status === "loading" ? (
        <p className="text-slate-300">Загружаем активные предложения...</p>
      ) : status === "error" ? (
        <div role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-8 text-rose-100">
          Не удалось загрузить объявления из Firestore. Проверьте доступ к каталогу и обновите страницу.
        </div>
      ) : featured.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center">
          <p className="text-lg font-semibold text-white">Активных объявлений пока нет</p>
          <p className="mt-2 text-sm text-slate-300">Как только продавцы опубликуют товары, лучшие предложения появятся здесь.</p>
        </div>
      )}
    </section>
  );
}
