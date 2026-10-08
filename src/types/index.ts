import type { Timestamp } from "firebase/firestore";

export type GameCategory =
  | "Игровая валюта"
  | "Донат"
  | "Аккаунты"
  | "Предметы"
  | "Ключи"
  | "Gift Cards"
  | "Услуги"
  | "Другое";

export type DeliveryType = "AUTOMATIC" | "MANUAL" | "ACCOUNT_SERVICE";

export type SellerBadge = "Новый продавец" | "Проверенный продавец" | "Надёжный продавец";
export type UserRole = "BUYER" | "SELLER" | "ADMIN";
export type SellerApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ProductStatus = "PENDING_REVIEW" | "ACTIVE" | "REJECTED" | "SUSPENDED";
export type OrderStatus =
  | "CREATED"
  | "WAITING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "DELIVERED"
  | "BUYER_CONFIRMATION"
  | "COMPLETED"
  | "DISPUTED"
  | "REFUNDED"
  | "CANCELLED";

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
};

export type SellerApplication = {
  uid: string;
  storeName: string;
  description: string;
  status: SellerApplicationStatus;
  createdAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  game: string;
  category: GameCategory;
  price: number;
  seller: string;
  sellerId: string;
  sellerLevel: number;
  rating: number;
  sales: number;
  successRate: number;
  online: boolean;
  badge: SellerBadge;
  verified: boolean;
  imageUrl: string;
  description: string;
  shortDescription: string;
  deliveryType: DeliveryType;
  deliveryTime: string;
  stock: number;
  isFavorite?: boolean;
};

export type FirestoreProduct = Product & {
  status: ProductStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type MarketplaceOrder = {
  id: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  quantity: number;
  subtotal: number;
  platformFee: number;
  currency: "KGS";
  status: OrderStatus;
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Wallet = {
  userId: string;
  availableBalance: number;
  pendingBalance: number;
  currency: "KGS";
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type WalletTransaction = {
  id: string;
  userId: string;
  orderId?: string;
  type: "SALE_PENDING" | "SALE_RELEASED" | "REFUND" | "WITHDRAWAL" | "DEPOSIT";
  amount: number;
  currency: "KGS";
  createdAt: Timestamp;
};

export type SellerReview = {
  orderId: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  status: "PUBLISHED";
  createdAt: Timestamp;
};

export type WithdrawalRequest = {
  id: string;
  sellerId: string;
  amount: number;
  currency: "KGS";
  method: "MBANK" | "OBANK" | "CARD" | "OTHER";
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  createdAt: Timestamp;
};

export type OrderMessage = {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  read: boolean;
  createdAt: Timestamp;
};

export type TrustItem = {
  title: string;
  description: string;
  icon: string;
};
