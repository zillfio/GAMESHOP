"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, BadgeCheck, Star } from "lucide-react";
import { useActiveProduct } from "@/components/catalog/use-active-product";
import { ProductActions } from "@/components/store/product-actions";

export function ProductDetail() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("id") ?? "";
  const { product, status } = useActiveProduct(productId);

  if (status === "loading") {
    return <main className="mx-auto max-w-7xl px-4 py-12 text-slate-300">Загружаем актуальное объявление...</main>;
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-black text-white">Объявление недоступно</h1>
        <p className="mt-3 text-slate-300">Оно могло быть снято продавцом или ещё не опубликовано.</p>
        <Link href="/games/" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 font-semibold text-slate-950">Вернуться в каталог</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/games/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Назад к каталогу
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="relative h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80">
            <Image src={product.imageUrl} alt={product.name} fill priority unoptimized sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" />
          </div>
          <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
            <p className="text-sm text-slate-300">{product.game} <span className="px-2 text-slate-500">/</span> {product.category}</p>
            <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">{product.name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <span className="flex items-center gap-1 text-amber-300"><Star className="h-4 w-4 fill-current" />{product.rating > 0 ? product.rating.toFixed(1) : "Новый продавец"}</span>
              <span>{product.sales} продаж</span>
              {product.verified && <span className="inline-flex items-center gap-1 text-cyan-200"><BadgeCheck className="h-4 w-4" />Проверенный продавец</span>}
            </div>
            <p className="mt-6 leading-8 text-slate-300">{product.description}</p>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
            <p className="text-sm text-slate-400">Актуальная цена продавца</p>
            <p className="mt-2 text-4xl font-black text-white">{product.price} сом</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-950/60 p-3"><p className="text-slate-400">Наличие</p><p className="mt-2 font-semibold text-white">{product.stock}</p></div>
              <div className="rounded-xl bg-slate-950/60 p-3"><p className="text-slate-400">Выдача</p><p className="mt-2 font-semibold text-white">{product.deliveryTime}</p></div>
            </div>
            <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
              Онлайн-оплата и оформление заказа пока отключены. Добавление в корзину не списывает деньги.
            </div>
            <div className="mt-5"><ProductActions productId={product.id} /></div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Продавец</p>
            <h2 className="mt-3 text-xl font-bold text-white">{product.seller}</h2>
            <p className="mt-2 text-sm text-slate-300">{product.successRate > 0 ? `${product.successRate}% успешных заказов` : "История заказов ещё не сформирована"}</p>
          </section>
        </aside>
      </div>
    </main>
  );
}