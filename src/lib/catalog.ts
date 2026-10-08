import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { DeliveryType, GameCategory, Product, SellerBadge } from "@/types";

function toProduct(id: string, value: Record<string, unknown>): Product | null {
  if (
    typeof value.name !== "string" ||
    typeof value.game !== "string" ||
    typeof value.category !== "string" ||
    typeof value.price !== "number" ||
    typeof value.seller !== "string" ||
    typeof value.sellerId !== "string" ||
    typeof value.imageUrl !== "string" ||
    !value.imageUrl.startsWith("https://") ||
    typeof value.description !== "string" ||
    typeof value.shortDescription !== "string" ||
    typeof value.deliveryType !== "string" ||
    typeof value.deliveryTime !== "string" ||
    typeof value.stock !== "number"
  ) {
    return null;
  }

  return {
    id,
    name: value.name,
    slug: typeof value.slug === "string" ? value.slug : id,
    game: value.game,
    category: value.category as GameCategory,
    price: value.price,
    seller: value.seller,
    sellerId: value.sellerId,
    sellerLevel: typeof value.sellerLevel === "number" ? value.sellerLevel : 0,
    rating: typeof value.rating === "number" ? value.rating : 0,
    sales: typeof value.sales === "number" ? value.sales : 0,
    successRate: typeof value.successRate === "number" ? value.successRate : 0,
    online: value.online === true,
    badge: typeof value.badge === "string" ? value.badge as SellerBadge : "Новый продавец",
    verified: value.verified === true,
    imageUrl: value.imageUrl,
    description: value.description,
    shortDescription: value.shortDescription,
    deliveryType: value.deliveryType as DeliveryType,
    deliveryTime: value.deliveryTime,
    stock: value.stock,
  };
}

export async function getActiveProducts(maxItems = 60): Promise<Product[]> {
  const activeProducts = query(
    collection(db, "products"),
    where("status", "==", "ACTIVE"),
    limit(maxItems),
  );
  const snapshot = await getDocs(activeProducts);

  return snapshot.docs
    .map((productDoc) => toProduct(productDoc.id, productDoc.data()))
    .filter((product): product is Product => product !== null && product.stock > 0);
}

export async function getActiveProduct(productId: string): Promise<Product | null> {
  const snapshot = await getDoc(doc(db, "products", productId));
  if (!snapshot.exists() || snapshot.data().status !== "ACTIVE") return null;

  const product = toProduct(snapshot.id, snapshot.data());
  return product && product.stock > 0 ? product : null;
}

export function rankProducts(products: Product[]): Product[] {
  return [...products].sort((left, right) => {
    const leftScore = left.rating * 0.6 + left.successRate * 0.004;
    const rightScore = right.rating * 0.6 + right.successRate * 0.004;
    return rightScore - leftScore || right.sales - left.sales;
  });
}
