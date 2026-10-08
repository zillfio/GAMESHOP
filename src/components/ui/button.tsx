import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
} & (ButtonHTMLAttributes<HTMLButtonElement> | AnchorHTMLAttributes<HTMLAnchorElement>);

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200",
    variant === "primary" && "bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 text-slate-950 shadow-lg shadow-cyan-500/20 hover:brightness-110",
    variant === "secondary" && "border border-white/10 bg-white/5 text-white hover:border-cyan-400/60 hover:bg-slate-900",
    variant === "ghost" && "text-slate-300 hover:text-white",
    size === "sm" && "h-9 px-3 text-sm",
    size === "md" && "h-11 px-5 text-sm",
    size === "lg" && "h-12 px-6 text-base",
    className,
  );

  if ("href" in props && typeof props.href === "string") {
    return <Link href={props.href} className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)} />;
  }

  return <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)} />;
}
