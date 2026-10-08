import Link from "next/link";

export default function SecurityPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-amber-200">Статус оплаты</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-white">Оформление заказа пока отключено</h1>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-300">Платёжный провайдер и серверная система удержания средств ещё не подключены. Сайт не принимает оплату и не обещает активную escrow-защиту.</p>
      </div>

      <div className="space-y-6">
        {[
          "Каталог показывает только активные объявления из Firestore.",
          "Покупатель может посмотреть цену, наличие и данные продавца.",
          "Корзина хранится в браузере и не создаёт заказ.",
          "Оплата не запускается, деньги не списываются.",
          "Защита сделки и разбор споров появятся после запуска серверной оплаты.",
        ].map((step, index) => (
          <div key={step} className="flex gap-4 rounded-[24px] border border-white/10 bg-slate-900/80 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 text-sm font-black text-slate-950">
              {index + 1}
            </div>
            <p className="flex-1 pt-2 text-lg leading-8 text-slate-200">{step}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-[28px] border border-amber-300/20 bg-amber-300/10 p-6 text-center">
        <h2 className="text-2xl font-black text-white">Покупки не оформляются</h2>
        <p className="mt-3 text-slate-200">
          Просматривайте объявления и сохраняйте товары. Не переводите деньги продавцам вне включённой системы заказа.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/games" className="rounded-full bg-white px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-100">Перейти в каталог</Link>
          <Link href="/support" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 font-medium text-white transition hover:border-cyan-400/40 hover:text-cyan-200">Поддержка</Link>
        </div>
      </div>
    </main>
  );
}
