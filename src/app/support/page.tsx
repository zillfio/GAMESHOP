export default function SupportPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Поддержка</p>
        <h1 className="mt-4 text-4xl font-black text-white">Официальный Telegram</h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-slate-300">
          Если заказ уже оформлен, укажите его номер, чтобы менеджер быстро нашёл сделку и помог решить вопрос.
        </p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-slate-200">
          <span className="font-semibold text-white">Номер заказа: укажите из личного кабинета</span>
        </div>
      </div>
    </main>
  );
}
