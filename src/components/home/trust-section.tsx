import { trustItems } from "@/data/mock-store";

export function TrustSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Почему нам доверяют</p>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Безопасная площадка для цифровых покупок
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {trustItems.map((item) => (
          <div
            key={item.title}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.25)] transition duration-200 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-slate-900/80"
          >
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 text-2xl">
              {item.icon}
            </div>
            <h3 className="mb-3 text-xl font-bold text-white">{item.title}</h3>
            <p className="leading-7 text-slate-300">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
