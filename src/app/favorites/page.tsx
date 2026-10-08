"use client";

import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import { useActiveProducts } from "@/components/catalog/use-active-products";
import { useStore } from "@/components/store/store-provider";

export default function FavoritesPage() {
  const { favorites } = useStore();
  const { products, status } = useActiveProducts();
  const favoriteProducts = products.filter((product) => favorites.includes(product.id));

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Сохранённое</p>
      <h1 className="mt-3 text-4xl font-black text-white">Избранное</h1>
      {status === "loading" ? (
        <p className="mt-8 text-slate-300">Загружаем сохранённые объявления...</p>
      ) : status === "error" ? (
        <div role="alert" className="mt-8 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">
          Не удалось загрузить актуальные объявления. Проверьте соединение с Firestore и обновите страницу.
        </div>
      ) : favoriteProducts.length ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {favoriteProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/80 p-8 text-center text-slate-300">
          Сохранённых товаров пока нет. <Link href="/games" className="text-cyan-200 underline">Открыть каталог</Link>
        </div>
      )}
    </main>
  );
}