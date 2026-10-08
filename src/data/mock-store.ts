import type { TrustItem } from "@/types";

export const navigation = [
  { label: "Игры", href: "/games" },
  { label: "Покупателям", href: "/buyer" },
  { label: "Продавцам", href: "/seller" },
  { label: "Как это работает", href: "/security" },
  { label: "Поддержка", href: "/support" },
];

export const featuredGames = [
  "PUBG Mobile",
  "Free Fire",
  "Minecraft",
  "Roblox",
  "Standoff 2",
  "Steam",
  "Brawl Stars",
  "Apex Legends",
  "Valorant",
  "World of Tanks",
];

export const categories = [
  "Игровая валюта",
  "Донат",
  "Аккаунты",
  "Предметы",
  "Ключи",
  "Gift Cards",
  "Услуги",
  "Другое",
];

export const trustItems: TrustItem[] = [
  {
    title: "Актуальные объявления",
    description: "Витрина получает активные товары напрямую из каталога продавцов.",
    icon: "🎮",
  },
  {
    title: "Реальные цены и наличие",
    description: "Цена и остаток берутся из объявления, а не из демонстрационного списка.",
    icon: "✓",
  },
  {
    title: "Выбор продавца",
    description: "Сравнивайте доступные рейтинги и историю заказов, когда они есть.",
    icon: "★",
  },
  {
    title: "Понятный статус оплаты",
    description: "Оплата пока отключена: корзина не списывает деньги и не создаёт заказ.",
    icon: "сом",
  },
];
