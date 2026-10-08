"use client";

import { useEffect, useState } from "react";
import { getActiveProduct } from "@/lib/catalog";
import type { Product } from "@/types";

type ProductState = {
  product: Product | null;
  status: "loading" | "ready" | "error";
};

export function useActiveProduct(productId: string) {
  const [state, setState] = useState<ProductState>({ product: null, status: productId ? "loading" : "ready" });

  useEffect(() => {
    let isCurrent = true;
    if (!productId) {
      return () => { isCurrent = false; };
    }

    getActiveProduct(productId)
      .then((product) => {
        if (isCurrent) setState({ product, status: "ready" });
      })
      .catch(() => {
        if (isCurrent) setState({ product: null, status: "error" });
      });

    return () => {
      isCurrent = false;
    };
  }, [productId]);

  return productId ? state : { product: null, status: "ready" };
}