"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import { useActiveProducts } from "@/components/catalog/use-active-products";
import { categories, featuredGames } from "@/data/mock-store";
import { useStore } from "@/components/store/store-provider";
import { rankProducts } from "@/lib/catalog";

export default function GamesPage() {
  const { searchQuery, setSearchQuery } = useStore();
  const { products, status } = useActiveProducts();
  const [game, setGame] = useState("Все игры");
  const [category, setCategory] = useState("Все категории");
  const [delivery, setDelivery] = useState("Любая");
  const [maxPrice, setMaxPrice] = useState("");
  const [minimumRating, setMinimumRating] = useState("0");
  const [sort, setSort] = useState("popular");

  const games = useMemo(() => [...new Set([...featuredGames, ...products.map((product) => product.game)])], [products]);
  const filteredProducts = useMemo(() => {
    const filtered = rankProducts(products).filter((product) => {
      const query = searchQuery.trim().toLocaleLowerCase("ru");
      const matchesQuery = !query || `${product.name} ${product.game} ${product.category}`.toLocaleLowerCase("ru").includes(query);
      const matchesGame = game === "Все игры" || product.game === game;
      const matchesCategory = category === "Все категории" || product.category === category;
      const matchesDelivery = delivery === "Любая" || product.deliveryType === delivery;
      const matchesPrice = !maxPrice || product.price <= Number(maxPrice);
      return matchesQuery && matchesGame && matchesCategory && matchesDelivery && matchesPrice && product.rating >= Number(minimumRating) && product.stock > 0;
    });

    if (sort === "cheap") filtered.sort((a, b) => a.price - b.price);
    if (sort === "expensive") filtered.sort((a, b) => b.price - a.price);
    if (sort === "rating") filtered.sort((a, b) => b.rating - a.rating);
    if (sort === "sales") filtered.sort((a, b) => b.sales - a.sales);
    return filtered;
  }, [category, delivery, game, maxPrice, minimumRating, products, searchQuery, sort]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Каталог</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Игровые товары</h1>
        <div className="mt-5 flex flex-wrap gap-2">
          {["Все категории", ...categories].map((item) => (
            <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item} className={`rounded-full border px-3 py-1.5 text-sm transition ${category === item ? "border-cyan-300 bg-cyan-300/10 text-cyan-200" : "border-white/10 bg-white/5 text-slate-200 hover:border-cyan-400/50"}`}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <section className="mb-8 rounded-2xl border border-white/10 bg-slate-900/80 p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <label className="text-xs text-slate-400">Поиск товара
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Название или игра" className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white placeholder:text-slate-500" />
          </label>
          <SelectFilter label="Игра" value={game} onChange={setGame} options={["Все игры", ...games]} />
          <label className="text-xs text-slate-400">Цена до, сом
            <input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Любая" className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white" />
          </label>
          <SelectFilter label="Выдача" value={delivery} onChange={setDelivery} options={["Любая", "AUTOMATIC", "MANUAL", "ACCOUNT_SERVICE"]} labels={{ AUTOMATIC: "Автоматическая", MANUAL: "Ручная", ACCOUNT_SERVICE: "Аккаунт / услуга" }} />
          <SelectFilter label="Рейтинг продавца" value={minimumRating} onChange={setMinimumRating} options={["0", "4", "4.5", "4.8"]} labels={{ "0": "Любой", "4": "От 4.0", "4.5": "От 4.5", "4.8": "От 4.8" }} />
        </div>
      </section>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <p className="text-sm text-slate-300">
          {status === "loading" ? "Загружаем реальные объявления..." : status === "error" ? "Не удалось загрузить каталог" : `Найдено товаров: ${filteredProducts.length}`}
        </p>
        <SelectFilter label="Сортировка" value={sort} onChange={setSort} options={["popular", "cheap", "expensive", "rating", "sales"]} labels={{ popular: "Популярные", cheap: "Сначала дешевле", expensive: "Сначала дороже", rating: "По рейтингу", sales: "По продажам" }} />
      </div>

      {status === "loading" ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-10 text-center text-slate-300">Получаем активные предложения продавцов...</div>
      ) : status === "error" ? (
        <div role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-10 text-center text-rose-100">
          Не удалось загрузить каталог из Firestore. Проверьте интернет-соединение и права чтения коллекции `products`.
        </div>
      ) : filteredProducts.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-10 text-center">
          <p className="text-lg font-semibold text-white">Пока нет активных объявлений</p>
          <p className="mt-2 text-sm text-slate-300">Здесь появятся реальные предложения продавцов после проверки.</p>
          <a href="/seller" className="mt-5 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-cyan-200 hover:border-cyan-400/50">Стать продавцом</a>
        </div>
      )}
    </main>
  );
}

function SelectFilter({ label, value, onChange, options, labels = {} }: { label: string; value: string; onChange: (value: string) => void; options: string[]; labels?: Record<string, string> }) {
  return (
    <label className="text-xs text-slate-400">{label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white">
        {options.map((option) => <option key={option} value={option}>{labels[option] ?? option}</option>)}
      </select>
    </label>
  );
}
