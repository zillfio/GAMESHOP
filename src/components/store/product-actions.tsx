"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useStore } from "@/components/store/store-provider";

export function ProductActions({ productId }: { productId: string }) {
  const { addToCart } = useStore();
  const router = useRouter();

  function buyNow() {
    addToCart(productId);
    router.push("/cart");
  }

  return (
    <div className="space-y-3">
      <button onClick={buyNow} className="h-12 w-full rounded-full bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 font-semibold text-slate-950 transition hover:brightness-110">
        Купить сейчас
      </button>
      <button onClick={() => addToCart(productId)} className="inline-flex h-12 w-full items-center justify-center rounded-full border border-white/10 bg-white/5 font-medium text-white transition hover:border-cyan-400/50">
        <ShoppingCart className="mr-2 h-4 w-4" />
        Добавить в корзину
      </button>
    </div>
  );
}