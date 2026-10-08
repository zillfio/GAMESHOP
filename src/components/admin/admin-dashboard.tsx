"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getIdTokenResult } from "firebase/auth";
import { collection, doc, getDocs, limit, query, serverTimestamp, writeBatch } from "firebase/firestore";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeDollarSign,
  Check,
  ClipboardList,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  RefreshCw,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { db } from "@/lib/firebase";

type AdminSection = "overview" | "users" | "products" | "orders" | "applications" | "withdrawals" | "disputes" | "auditLogs";
type AdminDocument = { id: string; data: Record<string, unknown> };
type CollectionName = Exclude<AdminSection, "overview">;

const sections: { id: AdminSection; label: string; icon: typeof LayoutDashboard; collection?: CollectionName }[] = [
  { id: "overview", label: "Обзор", icon: LayoutDashboard },
  { id: "users", label: "Пользователи", icon: Users, collection: "users" },
  { id: "products", label: "Товары", icon: ShoppingBag, collection: "products" },
  { id: "orders", label: "Заказы", icon: ClipboardList, collection: "orders" },
  { id: "applications", label: "Заявки продавцов", icon: ShieldCheck, collection: "applications" },
  { id: "withdrawals", label: "Выводы", icon: BadgeDollarSign, collection: "withdrawals" },
  { id: "disputes", label: "Споры", icon: Scale, collection: "disputes" },
  { id: "auditLogs", label: "Журнал действий", icon: ClipboardList, collection: "auditLogs" },
];

const firestoreCollection: Record<CollectionName, string> = {
  users: "users",
  products: "products",
  orders: "orders",
  applications: "sellerApplications",
  withdrawals: "withdrawals",
  disputes: "disputes",
  auditLogs: "auditLogs",
};

const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object" && value !== null && "toDate" in value && typeof value.toDate === "function") {
    return (value.toDate as () => Date)().toLocaleString("ru-RU");
  }
  if (typeof value === "object") return "Данные";
  return String(value);
};

const stateLabel = (value: unknown) => {
  const state = displayValue(value);
  const labels: Record<string, string> = {
    PENDING: "Ожидает",
    APPROVED: "Одобрено",
    REJECTED: "Отклонено",
    ACTIVE: "Активен",
    SUSPENDED: "Приостановлен",
    PAID: "Оплачен",
    COMPLETED: "Завершён",
    DISPUTED: "Спор",
    REFUNDED: "Возврат",
    UNPAID: "Не оплачен",
  };
  return labels[state] ?? state;
};

export function AdminDashboard() {
  const { user, isLoading, signOut } = useAuth();
  const [adminUid, setAdminUid] = useState<string | null>(null);
  const [verifiedUid, setVerifiedUid] = useState<string | null>(null);
  const [section, setSection] = useState<AdminSection>("overview");
  const [records, setRecords] = useState<Partial<Record<CollectionName, AdminDocument[]>>>({});
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [busyUserId, setBusyUserId] = useState("");

  useEffect(() => {
    let active = true;
    if (!user) return () => { active = false; };
    getIdTokenResult(user, true)
      .then((token) => {
        if (!active) return;
        setAdminUid(token.claims.admin === true ? user.uid : null);
        setVerifiedUid(user.uid);
      })
      .catch(() => { if (active) setError("Не удалось проверить права администратора. Войдите повторно."); })
      .finally(() => { if (active) setVerifiedUid(user.uid); });
    return () => { active = false; };
  }, [user]);

  const isAdmin = !!user && adminUid === user.uid;

  const loadData = useCallback(async () => {
    if (!user || !isAdmin) return;
    setLoadingData(true);
    setError("");
    try {
      const collections = Object.entries(firestoreCollection) as [CollectionName, string][];
      const snapshots = await Promise.all(collections.map(async ([key, name]) => {
        const result = await getDocs(query(collection(db, name), limit(30)));
        return [key, result.docs.map((item) => ({ id: item.id, data: item.data() }))] as const;
      }));
      setRecords(Object.fromEntries(snapshots));
    } catch (cause) {
      const code = typeof cause === "object" && cause && "code" in cause ? String(cause.code) : "";
      setError(code.includes("permission-denied")
        ? "Firestore отклонил чтение. Проверьте опубликованные правила и admin claim."
        : "Не удалось загрузить данные из Firestore. Проверьте подключение и настройки Firebase.");
    } finally {
      setLoadingData(false);
    }
  }, [isAdmin, user]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    let active = true;
    async function fetchInitialData() {
      try {
        const collections = Object.entries(firestoreCollection) as [CollectionName, string][];
        const snapshots = await Promise.all(collections.map(async ([key, name]) => {
          const result = await getDocs(query(collection(db, name), limit(30)));
          return [key, result.docs.map((item) => ({ id: item.id, data: item.data() }))] as const;
        }));
        if (active) setRecords(Object.fromEntries(snapshots));
      } catch {
        if (active) setError("Не удалось загрузить данные из Firestore. Проверьте правила и подключение.");
      }
    }
    void fetchInitialData();
    return () => { active = false; };
  }, [isAdmin, user]);

  const selectedCollection = sections.find((item) => item.id === section)?.collection;
  const selectedRecords = selectedCollection ? records[selectedCollection] ?? [] : [];

  async function decideApplication(userId: string, decision: "APPROVED" | "REJECTED") {
    if (!user || !isAdmin) {
      setError("Недостаточно прав для обработки заявки.");
      return;
    }
    setBusyUserId(userId);
    setActionMessage("");
    setError("");
    try {
      const batch = writeBatch(db);
      const applicationRef = doc(db, "sellerApplications", userId);
      const auditRef = doc(collection(db, "auditLogs"));
      batch.update(applicationRef, {
        status: decision,
        reviewedAt: serverTimestamp(),
        reviewedBy: user.uid,
      });

      if (decision === "APPROVED") {
        const application = records.applications?.find((record) => record.id === userId)?.data;
        if (!application) throw new Error("Заявка больше не загружена. Обновите список.");

        batch.update(doc(db, "users", userId), {
          role: "SELLER",
          updatedAt: serverTimestamp(),
        });
        batch.set(doc(db, "publicProfiles", userId), {
          uid: userId,
          storeName: application.storeName,
          description: application.description,
          rating: 0,
          salesCount: 0,
          successRate: 0,
          verified: false,
          status: "ACTIVE",
          createdAt: serverTimestamp(),
        });
      }

      batch.set(auditRef, {
        action: `SELLER_APPLICATION_${decision}`,
        actorId: user.uid,
        targetUserId: userId,
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      setActionMessage(decision === "APPROVED" ? "Заявка одобрена. Роль и профиль продавца сохранены." : "Заявка отклонена.");
      await loadData();
    } catch (cause) {
      const code = typeof cause === "object" && cause && "code" in cause ? String(cause.code) : "";
      const message = cause instanceof Error ? cause.message : "";
      setError(code.includes("permission-denied")
        ? "Firestore отклонил изменение. Проверьте, что текущий аккаунт имеет admin claim и новые Rules опубликованы."
        : message || "Заявка уже была обработана или данные пользователя недоступны.");
    } finally {
      setBusyUserId("");
    }
  }

  async function decideProduct(productId: string, decision: "ACTIVE" | "REJECTED") {
    if (!user || !isAdmin) {
      setError("Недостаточно прав для проверки объявления.");
      return;
    }
    setBusyUserId(productId);
    setActionMessage("");
    setError("");
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "products", productId), {
        status: decision,
        reviewedAt: serverTimestamp(),
        reviewedBy: user.uid,
      });
      batch.set(doc(collection(db, "auditLogs")), {
        action: decision === "ACTIVE" ? "PRODUCT_APPROVED" : "PRODUCT_REJECTED",
        actorId: user.uid,
        targetUserId: productId,
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      setActionMessage(decision === "ACTIVE" ? "Объявление опубликовано." : "Объявление отклонено.");
      await loadData();
    } catch (cause) {
      const code = typeof cause === "object" && cause && "code" in cause ? String(cause.code) : "";
      setError(code.includes("permission-denied")
        ? "Firestore отклонил модерацию товара. Проверьте admin claim и опубликованные правила."
        : cause instanceof Error ? cause.message : "Не удалось обработать объявление.");
    } finally {
      setBusyUserId("");
    }
  }

  if (isLoading || (user && verifiedUid !== user.uid)) {
    return <div className="mx-auto flex min-h-[65vh] max-w-7xl items-center justify-center text-slate-300"><LoaderCircle className="mr-3 animate-spin" size={20} />Проверяем доступ…</div>;
  }

  if (!user) {
    return <AccessMessage title="Войдите в аккаунт" description="Админ-панель доступна только авторизованному администратору." action="Войти" href="/login/" />;
  }

  if (!isAdmin) {
    return <AccessMessage title="Нет доступа" description="Для этой страницы требуется Firebase custom claim admin=true. Роль из профиля браузера не считается подтверждением прав." action="На главную" href="/" />;
  }

  const latestPending = (records.applications ?? []).filter((record) => record.data.status === "PENDING").length;
  const stats = [
    { title: "Пользователи · последние 30", value: records.users?.length ?? "—", icon: Users, color: "text-sky-300" },
    { title: "Товары · последние 30", value: records.products?.length ?? "—", icon: ShoppingBag, color: "text-violet-300" },
    { title: "Заказы · последние 30", value: records.orders?.length ?? "—", icon: ClipboardList, color: "text-cyan-300" },
    { title: "Ожидают решения", value: latestPending, icon: ShieldCheck, color: "text-amber-300" },
  ];

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200"><span className="h-2 w-2 rounded-full bg-emerald-400" />Защищённая сессия администратора</div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Панель управления</h1>
          <p className="mt-2 text-sm text-slate-400">GAMESHOP <span className="px-1 text-slate-600">/</span> Firebase Console</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void loadData()} disabled={loadingData} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-50"><RefreshCw size={16} className={loadingData ? "animate-spin" : ""} />Обновить</button>
          <button onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:border-rose-400/30 hover:text-rose-200"><LogOut size={16} />Выйти</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-white/[0.08] bg-slate-900/70 p-3">
          <p className="px-3 pb-3 pt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Управление</p>
          <nav className="space-y-1">
            {sections.map((item) => {
              const Icon = item.icon;
              return <button key={item.id} onClick={() => setSection(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${section === item.id ? "bg-cyan-400/10 font-medium text-cyan-200" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}><Icon size={17} />{item.label}{item.id === "applications" && latestPending > 0 && <span className="ml-auto rounded-full bg-amber-400/15 px-2 py-0.5 text-xs text-amber-200">{latestPending}</span>}</button>;
            })}
          </nav>
          <div className="mt-5 rounded-xl border border-cyan-300/10 bg-cyan-400/[0.06] p-3 text-xs leading-5 text-slate-400"><ShieldCheck size={17} className="mb-2 text-cyan-300" />Решения доступны только аккаунту с Firebase admin claim и разрешены Firestore Rules.</div>
        </aside>

        <section className="min-w-0">
          {error && <div role="alert" className="mb-4 flex gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.08] p-4 text-sm text-rose-100"><AlertTriangle className="shrink-0" size={18} />{error}</div>}
          {actionMessage && <div role="status" className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] p-4 text-sm text-emerald-100">{actionMessage}</div>}

          {section === "overview" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => { const Icon = stat.icon; return <article key={stat.title} className="rounded-2xl border border-white/[0.08] bg-slate-900/65 p-5"><div className="flex items-center justify-between"><span className="text-xs text-slate-400">{stat.title}</span><Icon size={18} className={stat.color} /></div><div className="mt-4 text-3xl font-semibold text-white">{stat.value}</div><p className="mt-1 text-xs text-slate-500">Количество загруженных записей</p></article>; })}
              </div>
              <div className="mt-5 rounded-2xl border border-white/[0.08] bg-slate-900/65 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-white">Заявки продавцов</h2><p className="mt-1 text-sm text-slate-400">Роль, публичный профиль и audit log обновляются атомарно.</p></div><button onClick={() => setSection("applications")} className="inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-cyan-100">Все заявки <ArrowUpRight size={15} /></button></div>
                <div className="mt-5">{renderApplications((records.applications ?? []).filter((record) => record.data.status === "PENDING").slice(0, 5), busyUserId, decideApplication)}</div>
              </div>
            </>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/65">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4"><div><h2 className="text-lg font-semibold text-white">{sections.find((item) => item.id === section)?.label}</h2><p className="mt-1 text-xs text-slate-500">Загружены последние 30 документов из Firestore.</p></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">{selectedRecords.length} записей</span></div>
              {loadingData ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-400"><LoaderCircle size={17} className="animate-spin" />Загрузка из Firestore…</div> : section === "applications" ? renderApplications(selectedRecords, busyUserId, decideApplication) : section === "products" ? <ProductReviewList records={selectedRecords} busyId={busyUserId} decide={decideProduct} /> : <RecordsTable records={selectedRecords} section={section} />}
            </div>
          )}
          <p className="mt-4 text-xs leading-5 text-slate-500">Суммы и финансовые операции здесь не подменяются демо-значениями. Если коллекции пусты или backend не опубликован, панель покажет это явно.</p>
        </section>
      </div>
    </main>
  );
}

function renderApplications(records: AdminDocument[], busyUserId: string, decide: (userId: string, decision: "APPROVED" | "REJECTED") => Promise<void>) {
  if (!records.length) return <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-500">Нет заявок для отображения.</div>;
  return <div className="space-y-3">{records.map(({ id, data }) => <article key={id} className="rounded-xl border border-white/[0.07] bg-slate-950/40 p-4"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><h3 className="font-medium text-white">{displayValue(data.storeName)}</h3><p className="mt-1 text-xs text-slate-500">UID: {id} · {stateLabel(data.status)}</p><p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-slate-300">{displayValue(data.description)}</p></div>{data.status === "PENDING" && <div className="flex shrink-0 gap-2"><button disabled={busyUserId === id} title="Одобрить заявку" onClick={() => void decide(id, "APPROVED")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:bg-emerald-400/20 disabled:opacity-50"><Check size={14} />Одобрить</button><button disabled={busyUserId === id} title="Отклонить заявку" onClick={() => void decide(id, "REJECTED")} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-400/10 px-3 py-2 text-xs font-medium text-rose-200 transition hover:bg-rose-400/20 disabled:opacity-50"><X size={14} />Отклонить</button></div>}</div></article>)}</div>;
}

function ProductReviewList({ records, busyId, decide }: { records: AdminDocument[]; busyId: string; decide: (productId: string, decision: "ACTIVE" | "REJECTED") => Promise<void> }) {
  const pending = records.filter(({ data }) => data.status === "PENDING_REVIEW");
  if (!pending.length) return <div className="px-5 py-14 text-center text-sm text-slate-500">Объявлений на модерации нет.</div>;
  return <div className="space-y-3 p-4">{pending.map(({ id, data }) => <article key={id} className="rounded-xl border border-white/[0.07] bg-slate-950/40 p-4"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><h3 className="font-semibold text-white">{displayValue(data.name)}</h3><p className="mt-1 text-xs text-slate-400">{displayValue(data.game)} · {displayValue(data.category)} · {displayValue(data.price)} сом · остаток {displayValue(data.stock)}</p><p className="mt-3 text-sm text-slate-300">{displayValue(data.description)}</p><p className="mt-2 text-xs text-slate-500">Продавец: {displayValue(data.seller)} · UID {displayValue(data.sellerId)}</p></div><div className="flex shrink-0 gap-2"><button disabled={busyId === id} onClick={() => void decide(id, "ACTIVE")} className="rounded-lg bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-200 hover:bg-emerald-400/20 disabled:opacity-50">Опубликовать</button><button disabled={busyId === id} onClick={() => void decide(id, "REJECTED")} className="rounded-lg bg-rose-400/10 px-3 py-2 text-xs font-medium text-rose-200 hover:bg-rose-400/20 disabled:opacity-50">Отклонить</button></div></div></article>)}</div>;
}

function RecordsTable({ records, section }: { records: AdminDocument[]; section: AdminSection }) {
  if (!records.length) return <div className="px-5 py-14 text-center text-sm text-slate-500">В этой коллекции пока нет записей.</div>;
  const fields: Record<AdminSection, string[]> = {
    overview: [], users: ["displayName", "email", "role", "createdAt"], products: ["name", "game", "price", "status"],
    orders: ["buyerId", "sellerId", "subtotal", "status"], applications: ["storeName", "uid", "status", "createdAt"],
    withdrawals: ["sellerId", "amount", "method", "status"], disputes: ["orderId", "buyerId", "status", "createdAt"],
    auditLogs: ["action", "actorId", "targetUserId", "createdAt"],
  };
  return <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-white/[0.025] text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-medium">ID</th>{fields[section].map((field) => <th className="px-5 py-3 font-medium" key={field}>{field}</th>)}</tr></thead><tbody className="divide-y divide-white/[0.06]">{records.map(({ id, data }) => <tr key={id} className="hover:bg-white/[0.025]"><td className="max-w-48 truncate px-5 py-4 font-mono text-xs text-slate-400" title={id}>{id}</td>{fields[section].map((field) => <td className="max-w-56 truncate px-5 py-4 text-slate-200" key={field} title={displayValue(data[field])}>{field === "status" || field === "role" ? stateLabel(data[field]) : displayValue(data[field])}</td>)}</tr>)}</tbody></table></div>;
}

function AccessMessage({ title, description, action, href }: { title: string; description: string; action: string; href: string }) {
  return <main className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center px-4 py-16"><section className="w-full rounded-3xl border border-white/10 bg-slate-900/70 p-8 text-center shadow-2xl shadow-black/20"><div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200"><ShieldCheck size={26} /></div><h1 className="text-2xl font-semibold text-white">{title}</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">{description}</p><Link href={href} className="mt-6 inline-flex items-center justify-center rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">{action}</Link></section></main>;
}
