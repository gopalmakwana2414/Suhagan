"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Logo from "@/components/ui/Logo";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  Users,
  Star,
  Ticket,
  Image as ImageIcon,
  LogOut,
  Menu,
  X,
  Mail,
} from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { href: "/admin/products", label: "Products", icon: <Package size={18} /> },
  { href: "/admin/categories", label: "Categories", icon: <Tag size={18} /> },
  { href: "/admin/orders", label: "Orders", icon: <ShoppingBag size={18} /> },
  { href: "/admin/customers", label: "Customers", icon: <Users size={18} /> },
  { href: "/admin/reviews", label: "Reviews", icon: <Star size={18} /> },
  { href: "/admin/coupons", label: "Coupons", icon: <Ticket size={18} /> },
  { href: "/admin/home-backgrounds", label: "Home Backgrounds", icon: <ImageIcon size={18} /> },
  { href: "/admin/subscribers", label: "Subscribers", icon: <Mail size={18} /> },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b">
        <Logo />
        <p className="text-xs text-gray-400 mt-1.5">Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMobileSidebar(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-semibold text-sm cursor-pointer ${
              isActive(link.href)
                ? "bg-primary text-white shadow-md shadow-primary/10"
                : "text-gray-600 hover:bg-secondary/40 hover:text-primary"
            }`}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t">
        <div className="px-4 py-3 bg-gray-50 rounded-xl mb-3">
          <p className="font-semibold text-sm">{user?.name}</p>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition text-sm font-medium"
          suppressHydrationWarning
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white shadow-lg hidden md:flex flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileSidebar && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileSidebar(false)}
          />
          <aside className="relative w-64 bg-white shadow-xl flex flex-col z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-30">
          <button
            className="md:hidden"
            onClick={() => setMobileSidebar(true)}
          >
            <Menu size={22} />
          </button>
          <h2 className="font-semibold text-gray-700 hidden md:block">
            {NAV_LINKS.find((l) => isActive(l.href))?.label || "Admin"}
          </h2>
          <div className="text-sm text-gray-500">
            Welcome, {user?.name}
          </div>
        </header>

        {/* Content */}
        <main className="p-6 flex-1">{children}</main>
      </div>
    </div>
  );
}
