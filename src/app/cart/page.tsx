"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useActiveProducts } from "@/components/catalog/use-active-products";
import { useStore } from "@/components/store/store-provider";

export default function CartPage() {
  const { cart, setCartQuantity, removeFromCart } = useStore();
  const { products, status } = useActiveProducts();
  const lines = cart.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId);
    return product ? [{ ...line, product }] : [];
  });
  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Покупки</p>
      <h1 className="mt-3 text-4xl font-black text-white">Корзина</h1>
      {status === "loading" ? (
        <p className="mt-8 text-slate-300">Проверяем наличие товаров...</p>
      ) : status === "error" ? (
        <div role="alert" className="mt-8 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">
          Не удалось загрузить актуальные товары. Проверьте соединение с Firestore и обновите страницу.
        </div>
      ) : !lines.length ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/80 p-8 text-center">
          <p className="text-slate-300">Корзина пока пуста.</p>
          <Link href="/games" className="mt-5 inline-flex rounded-full bg-white px-5 py-3 font-semibold text-slate-950">Перейти в каталог</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {lines.map(({ product, quantity }) => (
              <article key={product.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:flex-row sm:items-center">
                <Image src={product.imageUrl} alt="" width={256} height={192} sizes="128px" unoptimized className="h-24 w-full rounded-xl object-cover sm:w-32" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-400">{product.game}</p>
                  <h2 className="mt-1 font-semibold text-white">{product.name}</h2>
                  <p className="mt-2 font-bold text-cyan-200">{product.price} сом</p>
                </div>
                <div className="flex items-center gap-3">
                  <button aria-label="Уменьшить количество" onClick={() => setCartQuantity(product.id, quantity - 1)} className="rounded-full border border-white/10 p-2 text-white"><Minus className="h-4 w-4" /></button>
                  <span className="min-w-5 text-center text-white">{quantity}</span>
                  <button aria-label="Увеличить количество" onClick={() => setCartQuantity(product.id, quantity + 1)} className="rounded-full border border-white/10 p-2 text-white"><Plus className="h-4 w-4" /></button>
                  <button aria-label="Удалить товар" onClick={() => removeFromCart(product.id)} className="ml-1 rounded-full p-2 text-slate-400 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
                </div>
              </article>
            ))}
          </div>
          <aside className="h-fit rounded-2xl border border-white/10 bg-slate-900/80 p-5">
            <h2 className="text-lg font-bold text-white">Итого</h2>
            <p className="mt-4 flex justify-between text-slate-300"><span>{lines.reduce((sum, line) => sum + line.quantity, 0)} товара</span><span>{total} сом</span></p>
            <div role="status" className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
              Онлайн-оплата и создание заказов ещё не подключены. Покупка не оформлена, средства не списываются.
            </div>
            <button disabled className="mt-4 h-11 w-full cursor-not-allowed rounded-full bg-slate-700 font-semibold text-slate-400">Перейти к оплате</button>
          </aside>
        </div>
      )}
    </main>
  );
}