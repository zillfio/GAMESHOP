"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { updateProfile } from "firebase/auth";
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { Heart, LockKeyhole, LogOut, PackageCheck, RefreshCw, ShoppingBag, Star, UserRound, Wallet } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { db } from "@/lib/firebase";

type AccountTab = "profile" | "purchases" | "orders" | "favorites" | "balance" | "reviews" | "security";
type AccountRecord = { id: string; data: Record<string, unknown> };

const tabs: { id: AccountTab; label: string; icon: typeof UserRound }[] = [
  { id: "profile", label: "Профиль", icon: UserRound },
  { id: "purchases", label: "Мои покупки", icon: ShoppingBag },
  { id: "orders", label: "Мои заказы", icon: PackageCheck },
  { id: "favorites", label: "Избранное", icon: Heart },
  { id: "balance", label: "Баланс", icon: Wallet },
  { id: "reviews", label: "Отзывы", icon: Star },
  { id: "security", label: "Безопасность", icon: LockKeyhole },
];

const money = (value: unknown) => typeof value === "number" ? `${value.toLocaleString("ru-RU")} сом` : "—";
const statusName = (value: unknown) => ({
  CREATED: "Создан", WAITING_PAYMENT: "Ожидает оплаты", PAID: "Оплачен", PROCESSING: "В работе",
  DELIVERED: "Выдан", BUYER_CONFIRMATION: "Ожидает подтверждения", COMPLETED: "Завершён",
  DISPUTED: "Спор", REFUNDED: "Возврат", CANCELLED: "Отменён",
}[String(value)] ?? String(value ?? "—"));

export default function AccountPage() {
  const { user, isLoading, signOut } = useAuth();
  const [tab, setTab] = useState<AccountTab>("profile");
  const [displayName, setDisplayName] = useState("");
  const [orders, setOrders] = useState<AccountRecord[]>([]);
  const [reviews, setReviews] = useState<AccountRecord[]>([]);
  const [transactions, setTransactions] = useState<AccountRecord[]>([]);
  const [wallet, setWallet] = useState<Record<string, unknown> | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const applyData = useCallback((data: { orders: AccountRecord[]; reviews: AccountRecord[]; transactions: AccountRecord[]; wallet: Record<string, unknown> | null }) => {
    setOrders(data.orders);
    setReviews(data.reviews);
    setTransactions(data.transactions);
    setWallet(data.wallet);
  }, []);

  const fetchAccountData = useCallback(async () => {
    if (!user) return { orders: [], reviews: [], transactions: [], wallet: null };
    const [orderSnapshot, reviewSnapshot, transactionSnapshot, walletSnapshot] = await Promise.all([
      getDocs(query(collection(db, "orders"), where("buyerId", "==", user.uid), limit(50))),
      getDocs(query(collection(db, "reviews"), where("buyerId", "==", user.uid), limit(50))),
      getDocs(query(collection(db, "transactions"), where("userId", "==", user.uid), limit(50))),
      getDoc(doc(db, "wallets", user.uid)),
    ]);
    return {
      orders: orderSnapshot.docs.map((item) => ({ id: item.id, data: item.data() })),
      reviews: reviewSnapshot.docs.map((item) => ({ id: item.id, data: item.data() })),
      transactions: transactionSnapshot.docs.map((item) => ({ id: item.id, data: item.data() })),
      wallet: walletSnapshot.exists() ? walletSnapshot.data() : null,
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetchAccountData()
      .then((data) => { if (active) applyData(data); })
      .catch(() => { if (active) setError("Не удалось загрузить кабинет. Проверьте подключение к Firestore."); })
      .finally(() => { if (active) setIsLoadingData(false); });
    return () => { active = false; };
  }, [applyData, fetchAccountData, user]);

  const refresh = useCallback(async () => {
    setIsLoadingData(true);
    setError("");
    try { applyData(await fetchAccountData()); }
    catch { setError("Не удалось обновить данные кабинета. Проверьте подключение к Firestore."); }
    finally { setIsLoadingData(false); }
  }, [applyData, fetchAccountData]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const nextName = displayName.trim() || user.displayName || "Игрок";
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      await updateProfile(user, { displayName: nextName });
      await updateDoc(doc(db, "users", user.uid), { displayName: nextName, updatedAt: serverTimestamp() });
      setDisplayName(nextName);
      setNotice("Имя профиля сохранено.");
    } catch {
      setError("Не удалось сохранить профиль. Проверьте Security Rules.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || (user && isLoadingData && !orders.length && !reviews.length && !transactions.length && !wallet)) {
    return <main className="mx-auto max-w-6xl px-4 py-16 text-slate-300">Загружаем профиль…</main>;
  }

  if (!user) {
    return <main className="mx-auto max-w-6xl px-4 py-16"><h1 className="text-4xl font-black text-white">Личный кабинет</h1><p className="mt-4 text-slate-300">Войдите, чтобы открыть покупки и настройки профиля.</p><Link href="/login/" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 font-semibold text-slate-950">Войти или зарегистрироваться</Link></main>;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Личный кабинет</p><h1 className="mt-3 text-4xl font-black text-white">{displayName || user.displayName || "Игрок"}</h1><p className="mt-2 text-sm text-slate-400">{user.email}</p></div>
        <div className="flex gap-2"><button onClick={() => void refresh()} disabled={isLoadingData} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 disabled:opacity-50"><RefreshCw size={15} className={isLoadingData ? "animate-spin" : ""} />Обновить</button><button onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300"><LogOut size={15} />Выйти</button></div>
      </div>

      <div className="mt-8 flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
        {tabs.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setTab(item.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition ${tab === item.id ? "bg-cyan-300 text-slate-950" : "border border-white/10 text-slate-300 hover:text-white"}`}><Icon size={15} />{item.label}</button>; })}
      </div>

      {(error || notice) && <p role={error ? "alert" : "status"} className={`mt-5 rounded-xl p-4 text-sm ${error ? "bg-rose-500/10 text-rose-200" : "bg-emerald-500/10 text-emerald-200"}`}>{error || notice}</p>}
      <section className="mt-6">
        {tab === "profile" && <form onSubmit={saveProfile} className="max-w-xl rounded-2xl border border-white/10 bg-slate-900/70 p-5"><h2 className="text-lg font-bold text-white">Данные профиля</h2><label className="mt-5 block text-sm text-slate-300">Имя<input value={displayName || user.displayName || ""} maxLength={100} required onChange={(event) => setDisplayName(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white" /></label><label className="mt-4 block text-sm text-slate-400">Email<input disabled value={user.email ?? ""} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-slate-500" /></label><button disabled={isSaving} className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50">{isSaving ? "Сохраняем…" : "Сохранить профиль"}</button></form>}
        {tab === "purchases" && <OrdersList title="Мои покупки" orders={orders} loading={isLoadingData} completedOnly />}
        {tab === "orders" && <OrdersList title="Мои заказы" orders={orders} loading={isLoadingData} />}
        {tab === "favorites" && <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6"><h2 className="text-lg font-bold text-white">Избранные объявления</h2><p className="mt-2 text-sm text-slate-400">Избранное хранится в этом браузере.</p><Link href="/favorites/" className="mt-4 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-cyan-200">Открыть избранное</Link></section>}
        {tab === "balance" && <BalanceView wallet={wallet} transactions={transactions} loading={isLoadingData} />}
        {tab === "reviews" && <RecordsList title="Мои отзывы" rows={reviews} fields={["sellerId", "rating", "comment", "createdAt"]} loading={isLoadingData} />}
        {tab === "security" && <section className="max-w-2xl rounded-2xl border border-white/10 bg-slate-900/70 p-6"><h2 className="text-lg font-bold text-white">Безопасность аккаунта</h2><p className="mt-3 text-sm text-slate-300">Вход защищён Firebase Authentication. Пароль хранится у провайдера и не доступен сайту.</p><p className="mt-3 text-sm text-amber-200">Онлайн-оплата отключена; деньги не списываются.</p><button onClick={() => void signOut()} className="mt-5 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200">Выйти из аккаунта</button></section>}
      </section>
    </main>
  );
}

function OrdersList({ title, orders, loading, completedOnly = false }: { title: string; orders: AccountRecord[]; loading: boolean; completedOnly?: boolean }) {
  const visibleOrders = completedOnly ? orders.filter((order) => order.data.status === "COMPLETED") : orders;
  return <RecordsList title={title} rows={visibleOrders} fields={["productId", "sellerId", "subtotal", "status", "createdAt"]} loading={loading} />;
}

function BalanceView({ wallet, transactions, loading }: { wallet: Record<string, unknown> | null; transactions: AccountRecord[]; loading: boolean }) {
  if (!wallet) return <section className="max-w-2xl rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] p-6"><h2 className="font-bold text-white">Кошелёк пока не создан</h2><p className="mt-2 text-sm text-slate-300">Баланс не отображается фиктивным значением. Пополнение и вывод средств пока недоступны.</p></section>;
  return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><AccountMetric title="Доступно" value={money(wallet.availableBalance)} /><AccountMetric title="На удержании" value={money(wallet.pendingBalance)} /></div><RecordsList title="Операции" rows={transactions} fields={["type", "amount", "currency", "orderId", "createdAt"]} loading={loading} /></div>;
}

function RecordsList({ title, rows, fields, loading }: { title: string; rows: AccountRecord[]; fields: string[]; loading: boolean }) {
  return <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"><h2 className="text-lg font-bold text-white">{title}</h2>{loading ? <p className="mt-4 text-sm text-slate-400">Загружаем данные…</p> : rows.length ? <div className="mt-4 space-y-3">{rows.map(({ id, data }) => <article key={id} className="rounded-xl border border-white/10 bg-slate-950/50 p-4"><p className="text-xs text-slate-500">#{id}</p><div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">{fields.map((field) => <span key={field}><span className="text-slate-500">{field}: </span>{field === "status" ? statusName(data[field]) : moneyField(field) ? money(data[field]) : display(data[field])}</span>)}</div></article>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">Записей пока нет.</p>}</section>;
}

function AccountMetric({ title, value }: { title: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">{title}</p><p className="mt-3 text-2xl font-bold text-white">{value}</p></div>; }
function display(value: unknown) { if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") return (value.toDate as () => Date)().toLocaleString("ru-RU"); return value === null || value === undefined ? "—" : String(value); }
function moneyField(field: string) { return field === "amount" || field === "subtotal"; }