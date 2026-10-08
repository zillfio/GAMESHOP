"use client";

import { useEffect, useState } from "react";
import { getActiveProducts } from "@/lib/catalog";
import type { Product } from "@/types";

type ProductFeed = {
  products: Product[];
  status: "loading" | "ready" | "error";
};

export function useActiveProducts() {
  const [feed, setFeed] = useState<ProductFeed>({ products: [], status: "loading" });

  useEffect(() => {
    let isCurrent = true;
    getActiveProducts()
      .then((products) => {
        if (isCurrent) setFeed({ products, status: "ready" });
      })
      .catch(() => {
        if (isCurrent) setFeed({ products: [], status: "error" });
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  return feed;
}
