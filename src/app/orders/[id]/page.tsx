export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: "unavailable" }];
}

export default function OrderDetailsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Мои заказы</p>
        <h1 className="mt-4 text-4xl font-black text-white">Заказов пока нет</h1>
        <p className="mt-4 leading-7 text-slate-300">Здесь будут отображаться реальные заказы после подключения серверного оформления и оплаты. Сейчас платежи не принимаются.</p>
      </div>
    </main>
  );
}
