"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { featuredGames } from "@/data/mock-store";
import { useStore } from "@/components/store/store-provider";

export function HeroSearch() {
  const { searchQuery, setSearchQuery } = useStore();
  const router = useRouter();

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/games/");
  }

  function searchGame(game: string) {
    setSearchQuery(game);
    router.push("/games/");
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3 shadow-xl shadow-slate-950/30">
      <form onSubmit={submitSearch} className="flex items-center gap-3">
        <Search className="ml-2 h-5 w-5 shrink-0 text-cyan-300" />
        <input
          aria-label="Поиск игры или товара"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Найти игру или товар..."
          className="h-11 min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
        />
        <button className="h-10 rounded-full bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100">Найти</button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Популярные игры">
        {featuredGames.slice(0, 6).map((game) => (
          <button key={game} onClick={() => searchGame(game)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-100">
            {game}
          </button>
        ))}
      </div>
    </div>
  );
}
