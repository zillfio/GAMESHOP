import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata = {
  title: "Админ-панель | GAMESHOP",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
