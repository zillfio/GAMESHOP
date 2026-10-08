import { Suspense } from "react";
import { ProductDetail } from "@/components/catalog/product-detail";

export default function ProductPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-12 text-slate-300">Загружаем объявление...</main>}>
      <ProductDetail />
    </Suspense>
  );
}