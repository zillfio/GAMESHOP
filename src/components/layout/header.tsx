"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Search,
  ShoppingBag,
  Sparkles,
  UserRound,
} from "lucide-react";
import { navigation } from "@/data/mock-store";
import { useAuth } from "@/components/auth/auth-provider";
import { useStore } from "@/components/store/store-provider";

export function Header() {
  const { user } = useAuth();
  const { cartCount, searchQuery, setSearchQuery } = useStore();
  const router = useRouter();

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/games");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-cyan-400 to-emerald-400 shadow-lg shadow-cyan-500/20">
            <Sparkles className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight text-white">GAMESHOP</div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">marketplace</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm text-slate-300 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={handleSearch} className="ml-auto hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-slate-300 md:flex">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            aria-label="Поиск"
            placeholder="Найти игру или товар..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-52 bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
          />
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link href="/favorites" aria-label="Избранное" title="Избранное" className="rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-200 transition hover:border-cyan-400/60 hover:text-cyan-300">
            <Heart className="h-4 w-4" />
          </Link>
          <Link href="/cart" aria-label="Корзина" title="Корзина" className="relative rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-200 transition hover:border-violet-400/60 hover:text-violet-300">
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-cyan-300 px-1 text-center text-[10px] font-bold text-slate-950">{cartCount}</span>}
          </Link>
          <Link
            href="/account"
            className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-100"
          >
            <UserRound className="h-4 w-4" />
            {user?.displayName?.split(" ")[0] || (user ? "Профиль" : "Войти")}
          </Link>
        </div>
      </div>
    </header>
  );
}
