"use client";

import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Heart, Star } from "lucide-react";
import type { Product } from "@/types";
import { useStore } from "@/components/store/store-provider";

export function ProductCard({ product }: { product: Product }) {
  const { favorites, toggleFavorite } = useStore();
  const isFavorite = favorites.includes(product.id);

  return (
    <article className="group overflow-hidden rounded-[24px] border border-white/10 bg-slate-900/80 shadow-[0_20px_60px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_25px_90px_rgba(34,211,238,0.12)]">
      <div className="relative overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
          {product.online ? "Онлайн" : "Оффлайн"}
        </div>
        <button aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"} aria-pressed={isFavorite} onClick={() => toggleFavorite(product.id)} className="absolute right-4 top-4 rounded-full border border-white/10 bg-slate-950/60 p-2 text-slate-200 backdrop-blur-sm transition hover:border-pink-400/50 hover:text-pink-300">
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-pink-400 text-pink-400" : ""}`} />
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{product.game}</span>
          <span className="flex items-center gap-1 text-amber-300">
            <Star className="h-3.5 w-3.5 fill-current" />
            {product.rating > 0 ? product.rating.toFixed(1) : "Новый"}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">{product.name}</h3>
            {product.verified && (
              <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 p-1 text-cyan-300">
                <BadgeCheck className="h-4 w-4" />
              </span>
            )}
          </div>
          <p className="line-clamp-2 text-sm leading-6 text-slate-300">{product.shortDescription}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
          <div className="rounded-xl bg-slate-950/60 p-2">
            <span className="block text-slate-400">Продавец</span>
            <span className="mt-1 block font-medium text-white">{product.seller}</span>
          </div>
          <div className="rounded-xl bg-slate-950/60 p-2">
            <span className="block text-slate-400">Продажи</span>
            <span className="mt-1 block font-medium text-white">{product.sales > 0 ? product.sales : "Пока нет"}</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
          <span>Успешных заказов</span>
          <span className="font-semibold text-emerald-300">{product.successRate > 0 ? `${product.successRate}%` : "Нет истории"}</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-2xl font-black text-white">{product.price} сом</p>
            <div className="mt-1 text-xs text-amber-200">
              Онлайн-оплата отключена
            </div>
          </div>
          <Link href={`/product?id=${encodeURIComponent(product.id)}`} className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110">
            Купить
          </Link>
        </div>
      </div>
    </article>
  );
}
