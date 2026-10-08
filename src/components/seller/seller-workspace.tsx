"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { addDoc, collection, doc, getDoc, getDocs, limit, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { BadgeDollarSign, ClipboardList, MessageSquareText, PackagePlus, RefreshCw, Settings2, ShoppingBag, Wallet } from "lucide-react";
import type { Product } from "@/types";
import { db } from "@/lib/firebase";

type SellerTab = "products" | "orders" | "sales" | "balance" | "withdrawals" | "reviews" | "settings";
type DocumentRow = { id: string; data: Record<string, unknown> };
type SellerProfile = { storeName: string; description: string };
type ProductDraft = {
  name: string;
  game: string;
  category: string;
  price: string;
  stock: string;
  deliveryType: Product["deliveryType"];
  deliveryTime: string;
  imageUrl: string;
  description: string;
  shortDescription: string;
};
type SellerData = {
  products: DocumentRow[];
  orders: DocumentRow[];
  reviews: DocumentRow[];
  withdrawals: DocumentRow[];
  wallet: Record<string, unknown> | null;
  profile: SellerProfile | null;
};

const emptyDraft: ProductDraft = {
  name: "", game: "", category: "Игровая валюта", price: "", stock: "1",
  deliveryType: "MANUAL", deliveryTime: "По договорённости", imageUrl: "",
  description: "", shortDescription: "",
};

const tabs: { id: SellerTab; label: string; icon: typeof ShoppingBag }[] = [
  { id: "products", label: "Товары", icon: ShoppingBag },
  { id: "orders", label: "Заказы", icon: ClipboardList },
  { id: "sales", label: "Продажи", icon: BadgeDollarSign },
  { id: "balance", label: "Баланс", icon: Wallet },
  { id: "withdrawals", label: "Вывод средств", icon: BadgeDollarSign },
  { id: "reviews", label: "Отзывы", icon: MessageSquareText },
  { id: "settings", label: "Магазин", icon: Settings2 },
];

function errorText(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (code.includes("permission-denied")) return "Firestore отклонил действие. Проверьте роль продавца и опубликованные правила.";
  if (code.includes("unavailable")) return "Firebase временно недоступен. Попробуйте ещё раз.";
  return error instanceof Error ? error.message : "Не удалось выполнить действие.";
}

function slugify(value: string) {
  const transliteration: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y",
    к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
    х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return value.trim().toLocaleLowerCase("ru").split("").map((character) => transliteration[character] ?? character)
    .join("").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

function formatMoney(value: unknown) {
  return typeof value === "number" ? `${value.toLocaleString("ru-RU")} сом` : "—";
}

async function fetchSellerData(userId: string): Promise<SellerData> {
  const [productsSnapshot, ordersSnapshot, reviewsSnapshot, withdrawalsSnapshot, walletSnapshot, profileSnapshot] = await Promise.all([
    getDocs(query(collection(db, "products"), where("sellerId", "==", userId), limit(50))),
    getDocs(query(collection(db, "orders"), where("sellerId", "==", userId), limit(50))),
    getDocs(query(collection(db, "reviews"), where("sellerId", "==", userId), where("status", "==", "PUBLISHED"), limit(50))),
    getDocs(query(collection(db, "withdrawals"), where("sellerId", "==", userId), limit(50))),
    getDoc(doc(db, "wallets", userId)),
    getDoc(doc(db, "publicProfiles", userId)),
  ]);

  return {
    products: productsSnapshot.docs.map((item) => ({ id: item.id, data: item.data() })),
    orders: ordersSnapshot.docs.map((item) => ({ id: item.id, data: item.data() })),
    reviews: reviewsSnapshot.docs.map((item) => ({ id: item.id, data: item.data() })),
    withdrawals: withdrawalsSnapshot.docs.map((item) => ({ id: item.id, data: item.data() })),
    wallet: walletSnapshot.exists() ? walletSnapshot.data() : null,
    profile: profileSnapshot.exists() ? {
      storeName: String(profileSnapshot.data().storeName ?? ""),
      description: String(profileSnapshot.data().description ?? ""),
    } : null,
  };
}

function statusText(value: unknown) {
  const labels: Record<string, string> = {
    PENDING_REVIEW: "На модерации", ACTIVE: "Активен", REJECTED: "Отклонён", SUSPENDED: "Снят с продажи",
    CREATED: "Создан", WAITING_PAYMENT: "Ожидает оплаты", PAID: "Оплачен", PROCESSING: "В работе",
    DELIVERED: "Выдан", BUYER_CONFIRMATION: "Ожидает подтверждения", COMPLETED: "Завершён", DISPUTED: "Спор",
    PENDING: "На рассмотрении", APPROVED: "Одобрен", REJECTED_WITHDRAWAL: "Отклонён",
  };
  return typeof value === "string" ? labels[value] ?? value : "—";
}

export function SellerWorkspace({ userId, email, displayName }: { userId: string; email: string | null; displayName: string | null }) {
  const [tab, setTab] = useState<SellerTab>("products");
  const [products, setProducts] = useState<DocumentRow[]>([]);
  const [orders, setOrders] = useState<DocumentRow[]>([]);
  const [reviews, setReviews] = useState<DocumentRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<DocumentRow[]>([]);
  const [wallet, setWallet] = useState<Record<string, unknown> | null>(null);
  const [storeProfile, setStoreProfile] = useState<SellerProfile>({ storeName: displayName ?? "", description: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DocumentRow | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);

  const loadSellerData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchSellerData(userId);
      setProducts(data.products);
      setOrders(data.orders);
      setReviews(data.reviews);
      setWithdrawals(data.withdrawals);
      setWallet(data.wallet);
      if (data.profile) setStoreProfile(data.profile);
      else setStoreProfile((profile) => ({ ...profile, storeName: displayName ?? profile.storeName }));
    } catch (loadError) {
      setError(errorText(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [displayName, userId]);

  useEffect(() => {
    let active = true;
    fetchSellerData(userId)
      .then((data) => {
        if (!active) return;
        setProducts(data.products);
        setOrders(data.orders);
        setReviews(data.reviews);
        setWithdrawals(data.withdrawals);
        setWallet(data.wallet);
        if (data.profile) setStoreProfile(data.profile);
        else setStoreProfile((profile) => ({ ...profile, storeName: displayName ?? profile.storeName }));
      })
      .catch((loadError) => { if (active) setError(errorText(loadError)); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [displayName, userId]);

  const completedOrders = useMemo(() => orders.filter((order) => order.data.status === "COMPLETED"), [orders]);
  const completedRevenue = useMemo(() => completedOrders.reduce((sum, order) => sum + (typeof order.data.subtotal === "number" ? order.data.subtotal : 0), 0), [completedOrders]);

  function startNewProduct() {
    setEditingProduct(null);
    setDraft(emptyDraft);
    setNotice("");
    setError("");
    setShowProductForm(true);
  }

  function startEditProduct(product: DocumentRow) {
    const item = product.data;
    setEditingProduct(product);
    setDraft({
      name: String(item.name ?? ""),
      game: String(item.game ?? ""),
      category: String(item.category ?? "Игровая валюта"),
      price: String(item.price ?? ""),
      stock: String(item.stock ?? "1"),
      deliveryType: item.deliveryType === "AUTOMATIC" || item.deliveryType === "ACCOUNT_SERVICE" ? item.deliveryType : "MANUAL",
      deliveryTime: String(item.deliveryTime ?? "По договорённости"),
      imageUrl: String(item.imageUrl ?? ""),
      description: String(item.description ?? ""),
      shortDescription: String(item.shortDescription ?? ""),
    });
    setNotice("");
    setError("");
    setShowProductForm(true);
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setNotice("");
    const numericPrice = Number(draft.price);
    const numericStock = Number(draft.stock);
    const sellerName = displayName || email?.split("@")[0] || "Продавец";
    const fields = {
      name: draft.name.trim(),
      slug: slugify(draft.name),
      game: draft.game.trim(),
      category: draft.category.trim(),
      price: numericPrice,
      seller: sellerName,
      sellerId: userId,
      sellerLevel: 0,
      rating: 0,
      sales: 0,
      successRate: 0,
      online: false,
      badge: "Новый продавец",
      verified: false,
      imageUrl: draft.imageUrl.trim(),
      description: draft.description.trim(),
      shortDescription: draft.shortDescription.trim(),
      deliveryType: draft.deliveryType,
      deliveryTime: draft.deliveryTime.trim(),
      stock: numericStock,
      status: "PENDING_REVIEW",
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), {
          name: fields.name,
          slug: fields.slug,
          game: fields.game,
          category: fields.category,
          price: fields.price,
          imageUrl: fields.imageUrl,
          description: fields.description,
          shortDescription: fields.shortDescription,
          deliveryType: fields.deliveryType,
          deliveryTime: fields.deliveryTime,
          stock: fields.stock,
          status: fields.status,
          updatedAt: fields.updatedAt,
        });
        setNotice("Изменения отправлены на повторную модерацию.");
      } else {
        await addDoc(collection(db, "products"), { ...fields, createdAt: serverTimestamp() });
        setNotice("Объявление создано и отправлено на модерацию.");
      }
      setShowProductForm(false);
      await loadSellerData();
    } catch (saveError) {
      setError(errorText(saveError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function pauseProduct(product: DocumentRow) {
    setError("");
    setNotice("");
    try {
      await updateDoc(doc(db, "products", product.id), { status: "SUSPENDED", updatedAt: serverTimestamp() });
      setNotice("Объявление снято с продажи.");
      await loadSellerData();
    } catch (pauseError) {
      setError(errorText(pauseError));
    }
  }

  async function saveStoreSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setNotice("");
    try {
      await updateDoc(doc(db, "publicProfiles", userId), {
        storeName: storeProfile.storeName.trim(),
        description: storeProfile.description.trim(),
        updatedAt: serverTimestamp(),
      });
      setNotice("Настройки магазина сохранены.");
      await loadSellerData();
    } catch (saveError) {
      setError(errorText(saveError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Рабочее место продавца</p>
          <h1 className="mt-3 text-4xl font-black text-white">{storeProfile.storeName || displayName || "Мой магазин"}</h1>
          <p className="mt-2 text-sm text-slate-400">{email}</p>
        </div>
        <button onClick={() => void loadSellerData()} disabled={isLoading} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm text-slate-200 hover:border-cyan-400/40 disabled:opacity-50"><RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />Обновить данные</button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
          {tabs.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => { setTab(item.id); setShowProductForm(false); }} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition lg:w-full ${tab === item.id ? "bg-emerald-400/10 text-emerald-100" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}><Icon size={17} />{item.label}</button>; })}
        </nav>

        <section className="min-w-0">
          {error && <div role="alert" className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.08] p-4 text-sm text-rose-100">{error}</div>}
          {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] p-4 text-sm text-emerald-100">{notice}</div>}
          {isLoading ? <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-10 text-center text-slate-300">Загружаем данные магазина…</div> : (
            <>
              {tab === "products" && <ProductsPanel products={products} showForm={showProductForm} editingProduct={editingProduct} draft={draft} setDraft={setDraft} onCreate={startNewProduct} onEdit={startEditProduct} onPause={pauseProduct} onSave={saveProduct} onCancel={() => setShowProductForm(false)} isSubmitting={isSubmitting} />}
              {tab === "orders" && <SellerRecords title="Заказы" records={orders} empty="Заказов пока нет." fields={["buyerId", "productId", "subtotal", "status"]} />}
              {tab === "sales" && <SalesPanel orders={completedOrders} revenue={completedRevenue} />}
              {tab === "balance" && <BalancePanel wallet={wallet} />}
              {tab === "withdrawals" && <WithdrawalsPanel records={withdrawals} />}
              {tab === "reviews" && <SellerRecords title="Отзывы" records={reviews} empty="Опубликованных отзывов пока нет." fields={["rating", "comment", "createdAt"]} />}
              {tab === "settings" && <SettingsPanel profile={storeProfile} setProfile={setStoreProfile} onSave={saveStoreSettings} isSubmitting={isSubmitting} />}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function ProductsPanel({ products, showForm, editingProduct, draft, setDraft, onCreate, onEdit, onPause, onSave, onCancel, isSubmitting }: {
  products: DocumentRow[]; showForm: boolean; editingProduct: DocumentRow | null; draft: ProductDraft;
  setDraft: (draft: ProductDraft) => void; onCreate: () => void; onEdit: (product: DocumentRow) => void;
  onPause: (product: DocumentRow) => void; onSave: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void; isSubmitting: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-bold text-white">Мои объявления</h2><p className="mt-1 text-sm text-slate-400">Новые и изменённые товары проходят модерацию.</p></div>
        <button onClick={onCreate} className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-slate-950"><PackagePlus size={16} />Новое объявление</button>
      </div>
      {showForm && <ProductForm draft={draft} setDraft={setDraft} onSave={onSave} onCancel={onCancel} isSubmitting={isSubmitting} editing={!!editingProduct} />}
      <div className="mt-5 space-y-3">{products.length ? products.map((product) => <article key={product.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-slate-950/45 p-4"><div className="min-w-0"><h3 className="truncate font-semibold text-white">{String(product.data.name ?? "Без названия")}</h3><p className="mt-1 text-xs text-slate-400">{String(product.data.game ?? "")} · {formatMoney(product.data.price)} · остаток {String(product.data.stock ?? 0)}</p><span className="mt-2 inline-flex rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">{statusText(product.data.status)}</span></div>{(product.data.status === "ACTIVE" || product.data.status === "PENDING_REVIEW" || product.data.status === "REJECTED") && <div className="flex gap-2"><button onClick={() => onEdit(product)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:border-cyan-300/40">Изменить</button>{product.data.status === "ACTIVE" && <button onClick={() => void onPause(product)} className="rounded-lg border border-rose-400/20 px-3 py-2 text-xs text-rose-200 hover:bg-rose-400/10">Снять с продажи</button>}</div>}</article>) : <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">Объявлений пока нет. Создайте первое.</div>}</div>
    </div>
  );
}

function ProductForm({ draft, setDraft, onSave, onCancel, isSubmitting, editing }: { draft: ProductDraft; setDraft: (draft: ProductDraft) => void; onSave: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void; isSubmitting: boolean; editing: boolean }) {
  function field<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) { setDraft({ ...draft, [key]: value }); }
  return (
    <form onSubmit={onSave} className="mt-5 rounded-xl border border-emerald-300/20 bg-slate-950/60 p-4 sm:p-5">
      <h3 className="font-semibold text-white">{editing ? "Редактирование объявления" : "Новое объявление"}</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <TextField label="Название" value={draft.name} maxLength={100} required onChange={(value) => field("name", value)} />
        <TextField label="Игра" value={draft.game} maxLength={60} required onChange={(value) => field("game", value)} />
        <TextField label="Категория" value={draft.category} required onChange={(value) => field("category", value)} />
        <TextField label="Цена, сом" value={draft.price} type="number" min="1" max="1000000" required onChange={(value) => field("price", value)} />
        <TextField label="Количество" value={draft.stock} type="number" min="1" max="100000" required onChange={(value) => field("stock", value)} />
        <label className="block text-sm text-slate-300">Тип выдачи<select value={draft.deliveryType} onChange={(event) => field("deliveryType", event.target.value as ProductDraft["deliveryType"])} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white"><option value="AUTOMATIC">Автоматическая</option><option value="MANUAL">Ручная</option><option value="ACCOUNT_SERVICE">Аккаунт / услуга</option></select></label>
        <TextField label="Срок выдачи" value={draft.deliveryTime} maxLength={80} required onChange={(value) => field("deliveryTime", value)} />
        <TextField label="URL изображения (HTTPS)" value={draft.imageUrl} type="url" required onChange={(value) => field("imageUrl", value)} />
        <TextField label="Краткое описание" value={draft.shortDescription} maxLength={240} required onChange={(value) => field("shortDescription", value)} />
        <label className="block text-sm text-slate-300 sm:col-span-2">Полное описание<textarea value={draft.description} minLength={10} maxLength={5000} required onChange={(event) => field("description", event.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2"><button disabled={isSubmitting} className="rounded-full bg-emerald-300 px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50">{isSubmitting ? "Сохраняем…" : "Сохранить и отправить на модерацию"}</button><button type="button" onClick={onCancel} className="rounded-full border border-white/10 px-4 py-2.5 text-sm text-slate-300">Отмена</button></div>
    </form>
  );
}

function TextField({ label, value, onChange, type = "text", required = false, maxLength, min, max }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; maxLength?: number; min?: string; max?: string }) {
  return <label className="block text-sm text-slate-300">{label}<input value={value} type={type} required={required} maxLength={maxLength} min={min} max={max} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white" /></label>;
}

function SellerRecords({ title, records, empty, fields }: { title: string; records: DocumentRow[]; empty: string; fields: string[] }) {
  return <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5"><h2 className="text-xl font-bold text-white">{title}</h2>{records.length ? <div className="mt-4 space-y-3">{records.map(({ id, data }) => <article key={id} className="rounded-xl border border-white/10 bg-slate-950/50 p-4"><p className="text-xs text-slate-500">#{id}</p><div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">{fields.map((field) => <span key={field}><span className="text-slate-500">{field}: </span>{String(data[field] ?? "—")}</span>)}</div></article>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">{empty}</p>}</div>;
}

function SalesPanel({ orders, revenue }: { orders: DocumentRow[]; revenue: number }) {
  return <div className="grid gap-4 sm:grid-cols-2"><Metric title="Завершённые заказы" value={orders.length.toString()} /><Metric title="Сумма завершённых заказов" value={formatMoney(revenue)} /><p className="text-xs leading-5 text-slate-500 sm:col-span-2">Показатели рассчитываются по загруженным документам Firestore. Сейчас checkout отключён; новые продажи не создаются.</p></div>;
}

function BalancePanel({ wallet }: { wallet: Record<string, unknown> | null }) {
  return wallet ? <div className="grid gap-4 sm:grid-cols-2"><Metric title="Доступно" value={formatMoney(wallet.availableBalance)} /><Metric title="На удержании" value={formatMoney(wallet.pendingBalance)} /><p className="text-xs text-slate-500 sm:col-span-2">Баланс только для чтения. Клиент не может изменять финансовые значения.</p></div> : <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] p-6"><h2 className="font-semibold text-white">Кошелёк ещё не создан</h2><p className="mt-2 text-sm leading-6 text-slate-300">Автоматическая инициализация кошелька требует Cloud Function. Баланс не подменяется нулём.</p></div>;
}

function WithdrawalsPanel({ records }: { records: DocumentRow[] }) {
  return <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5"><h2 className="text-xl font-bold text-white">Заявки на вывод</h2>{records.length ? <SellerRecords title="История запросов" records={records} empty="Заявок пока нет." fields={["amount", "method", "status", "createdAt"]} /> : <p className="mt-4 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">Запросы на вывод включим вместе с серверным резервированием баланса и проверкой платежей. Сейчас списаний нет.</p>}</div>;
}

function SettingsPanel({ profile, setProfile, onSave, isSubmitting }: { profile: SellerProfile; setProfile: (profile: SellerProfile) => void; onSave: (event: FormEvent<HTMLFormElement>) => void; isSubmitting: boolean }) {
  return <form onSubmit={onSave} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5"><h2 className="text-xl font-bold text-white">Настройки магазина</h2><p className="mt-1 text-sm text-slate-400">Эти данные видны в публичном профиле продавца.</p><div className="mt-4 grid gap-4"><TextField label="Название магазина" value={profile.storeName} required maxLength={60} onChange={(storeName) => setProfile({ ...profile, storeName })} /><label className="block text-sm text-slate-300">Описание<textarea value={profile.description} maxLength={500} onChange={(event) => setProfile({ ...profile, description: event.target.value })} rows={4} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label></div><button disabled={isSubmitting} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50">{isSubmitting ? "Сохраняем…" : "Сохранить"}</button></form>;
}

function Metric({ title, value }: { title: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5"><p className="text-sm text-slate-400">{title}</p><p className="mt-3 text-3xl font-semibold text-white">{value}</p></div>;
}
