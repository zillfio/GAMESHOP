import { ArrowRight, SearchCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeaturedListings } from "@/components/home/featured-listings";
import { HeroSearch } from "@/components/home/hero-search";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.25),transparent_35%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.18),transparent_30%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.16),transparent_30%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:pb-20 lg:pt-16">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200">
            <SearchCheck className="h-3.5 w-3.5" />
            Актуальные объявления продавцов
          </div>

          <div className="space-y-5">
            <h1 className="max-w-xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Лучшие предложения — без выдуманных цен
            </h1>
            <p className="max-w-lg text-lg leading-8 text-slate-300">
              Рейтинг, цена и наличие загружаются из активных объявлений продавцов.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href="/games" size="lg" className="w-full sm:w-auto">
              Перейти в каталог
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button href="/security" variant="secondary" size="lg" className="w-full sm:w-auto">
              Как это работает
            </Button>
          </div>

          <HeroSearch />
        </div>

        <div className="relative">
          <FeaturedListings compact />
        </div>
      </div>
    </section>
  );
}
