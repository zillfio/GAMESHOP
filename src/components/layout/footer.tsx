import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/90">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 text-sm text-slate-300 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="mb-4 text-xl font-black tracking-tight text-white">GAMESHOP</div>
          <p className="max-w-xs leading-6 text-slate-400">
            Каталог игровых товаров и продавцов для игроков Кыргызстана.
          </p>
        </div>
        <div>
          <h3 className="mb-4 font-semibold text-white">Навигация</h3>
          <ul className="space-y-2 text-slate-400">
            <li><Link href="/games" className="hover:text-white">Каталог</Link></li>
            <li><Link href="/security" className="hover:text-white">Защита сделки</Link></li>
            <li><Link href="/seller" className="hover:text-white">Продавцам</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-semibold text-white">Поддержка</h3>
          <ul className="space-y-2 text-slate-400">
            <li><Link href="/support" className="hover:text-white">Telegram support</Link></li>
            <li><Link href="/buyer" className="hover:text-white">Покупателям</Link></li>
            <li><Link href="/account" className="hover:text-white">Профиль</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-semibold text-white">Информация</h3>
          <ul className="space-y-2 text-slate-400">
            <li><Link href="/security" className="hover:text-white">Статус оплаты</Link></li>
            <li><Link href="/admin" className="hover:text-white">Админ-панель</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
        © 2026 Gameshop — цифровые товары для игроков Кыргызстана.
      </div>
    </footer>
  );
}
