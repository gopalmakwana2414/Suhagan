"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/ui/Logo";
import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  User,
  X,
  LogOut,
  Settings,
} from "lucide-react";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAuthStore } from "@/store/authStore";
import { useDebounce } from "@/hooks/useDebounce";
import api from "@/lib/api";

export default function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const debouncedSearch = useDebounce(search, 350);

  const { data: suggestions = [] } = useQuery({
    queryKey: ["search-suggestions", debouncedSearch],
    queryFn: async () => {
      const res = await api.get(
        `/products?search=${encodeURIComponent(debouncedSearch)}&limit=5`
      );
      return res.data.products;
    },
    enabled: debouncedSearch.trim().length >= 2,
  });

  // Close suggestions when clicking outside & handle Esc key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSuggestions(false);
        setUserMenu(false);
        setMobileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);


  const cartItems = useCartStore((state) => state.items);
  const wishlistItems = useWishlistStore((state) => state.items);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/shop?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
      setShowSuggestions(false);
    }
  };

  const goToProduct = (slug: string) => {
    router.push(`/product/${slug}`);
    setSearch("");
    setShowSuggestions(false);
  };

  const handleLogout = () => {
    logout();
    setUserMenu(false);
    router.push("/");
  };

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-[#d4af37] text-white text-center text-sm py-2">
        🎁 Free Shipping on Orders Above ₹999 &nbsp;|&nbsp; Handcrafted Sarees
        Direct from Surat
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container-custom">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Logo />

            {/* Desktop Menu */}
            <nav className="hidden lg:flex items-center gap-8 font-medium">
              <Link href="/" className="hover:text-[#b8860b] transition">
                Home
              </Link>
              <Link href="/shop" className="hover:text-[#b8860b] transition">
                Shop
              </Link>
              <Link href="/categories" className="hover:text-[#b8860b] transition">
                Categories
              </Link>
              <Link
                href="/collections"
                className="hover:text-[#b8860b] transition"
              >
                Collections
              </Link>
              <Link href="/about" className="hover:text-[#b8860b] transition">
                About
              </Link>
              <Link href="/contact" className="hover:text-[#b8860b] transition">
                Contact
              </Link>
            </nav>

            {/* Search */}
            <div ref={searchRef} className="hidden lg:block relative w-[280px]">
              <form
                onSubmit={handleSearch}
                className="flex items-center border rounded-full px-4 py-2"
              >
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search sarees..."
                  className="outline-none ml-2 w-full text-sm"
                  suppressHydrationWarning
                />
              </form>

              {/* Autocomplete Dropdown */}
              {showSuggestions && debouncedSearch.trim().length >= 2 && (
                <div className="absolute top-12 left-0 w-[340px] bg-white border shadow-xl rounded-2xl p-2 z-50 max-h-[400px] overflow-y-auto">
                  {suggestions.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-6">
                      No products found for &quot;{debouncedSearch}&quot;
                    </p>
                  ) : (
                    <>
                      {suggestions.map((product: any) => (
                        <button
                          key={product._id}
                          onClick={() => goToProduct(product.slug)}
                          className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-gray-50 transition text-left"
                        >
                          <Image
                            src={product.thumbnail.url}
                            alt={product.name}
                            width={40}
                            height={50}
                            className="w-10 h-12 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium line-clamp-1">
                              {product.name}
                            </p>
                            <p className="text-xs text-[#b8860b] font-semibold">
                              ₹{product.salePrice.toLocaleString()}
                            </p>
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={handleSearch}
                        className="w-full text-center text-sm text-[#b8860b] font-medium py-2 hover:underline"
                      >
                        View all results for &quot;{debouncedSearch}&quot;
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-5">
              {/* Wishlist */}
              <Link href="/wishlist" className="relative">
                <Heart size={22} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link href="/cart" className="relative">
                <ShoppingBag size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#d4af37] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className="flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#d4af37] rounded-full p-0.5 transition"
                  aria-expanded={userMenu}
                  aria-haspopup="true"
                  aria-label="User profile menu"
                  suppressHydrationWarning
                >
                  <div className="w-9 h-9 bg-[#fff8e7] border border-[#d4af37] rounded-full flex items-center justify-center hover:bg-[#fff0c8] transition">
                    <User size={18} className="text-[#b8860b]" />
                  </div>
                </button>

                {userMenu && (
                  <div
                    role="menu"
                    aria-label="User Menu"
                    className="absolute right-0 top-12 bg-white/95 backdrop-blur-md border border-[#d4af37]/25 shadow-2xl rounded-2xl w-60 p-4 z-50 transition-all duration-200 origin-top-right animate-in fade-in slide-in-from-top-2"
                  >
                    {user ? (
                      <>
                        <div className="px-2 pb-3 border-b border-gray-100 mb-2">
                          <p className="font-semibold text-sm text-gray-800 truncate">{user.name}</p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                        </div>
                        <Link
                          href="/profile"
                          role="menuitem"
                          onClick={() => setUserMenu(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#fff8e7] hover:text-[#b8860b] text-gray-700 text-sm font-medium transition focus:outline-none focus:bg-[#fff8e7] focus:text-[#b8860b]"
                        >
                          <User size={15} /> My Profile
                        </Link>
                        <Link
                          href="/orders"
                          role="menuitem"
                          onClick={() => setUserMenu(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#fff8e7] hover:text-[#b8860b] text-gray-700 text-sm font-medium transition focus:outline-none focus:bg-[#fff8e7] focus:text-[#b8860b]"
                        >
                          <ShoppingBag size={15} /> My Orders
                        </Link>
                        {user.role === "admin" && (
                          <Link
                            href="/admin"
                            role="menuitem"
                            onClick={() => setUserMenu(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#fff8e7] hover:text-[#b8860b] text-gray-700 text-sm font-medium transition focus:outline-none focus:bg-[#fff8e7] focus:text-[#b8860b]"
                          >
                            <Settings size={15} /> Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          role="menuitem"
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-600 hover:text-red-700 text-sm font-medium w-full text-left transition focus:outline-none focus:bg-red-50 focus:text-red-700"
                        >
                          <LogOut size={15} /> Logout
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Link
                          href="/login"
                          role="menuitem"
                          onClick={() => setUserMenu(false)}
                          className="block w-full text-center px-4 py-2.5 rounded-xl border border-[#d4af37] text-[#b8860b] hover:bg-[#fff8e7] text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40"
                        >
                          Login
                        </Link>
                        <Link
                          href="/register"
                          role="menuitem"
                          onClick={() => setUserMenu(false)}
                          className="block w-full text-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white hover:from-[#b8860b] hover:to-[#996515] text-sm font-semibold transition-all duration-200 shadow-md shadow-[#d4af37]/20 hover:shadow-lg hover:shadow-[#d4af37]/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40"
                        >
                          Create Account
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>


              {/* Mobile Toggle */}
              <button
                className="lg:hidden"
                onClick={() => setMobileMenu(!mobileMenu)}
              >
                {mobileMenu ? <X size={26} /> : <Menu size={26} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="lg:hidden border-t bg-white">
            <div className="flex flex-col p-5 gap-4">
              <Link href="/" onClick={() => setMobileMenu(false)}>
                Home
              </Link>
              <Link href="/shop" onClick={() => setMobileMenu(false)}>
                Shop
              </Link>
              <Link href="/categories" onClick={() => setMobileMenu(false)}>
                Categories
              </Link>
              <Link href="/collections" onClick={() => setMobileMenu(false)}>
                Collections
              </Link>
              <Link href="/about" onClick={() => setMobileMenu(false)}>
                About
              </Link>
              <Link href="/contact" onClick={() => setMobileMenu(false)}>
                Contact
              </Link>
              <hr />
              {user ? (
                <>
                  <Link href="/profile" onClick={() => setMobileMenu(false)}>
                    My Profile
                  </Link>
                  <Link href="/orders" onClick={() => setMobileMenu(false)}>
                    My Orders
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenu(false);
                    }}
                    className="text-left text-red-500"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenu(false)}>
                    Login
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenu(false)}>
                    Register
                  </Link>
                </>
              )}
              <Link href="/wishlist" onClick={() => setMobileMenu(false)}>
                Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
              </Link>
              <Link href="/cart" onClick={() => setMobileMenu(false)}>
                Cart {cartCount > 0 && `(${cartCount})`}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Overlay to close menus */}
      {(userMenu || mobileMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setUserMenu(false);
            setMobileMenu(false);
          }}
        />
      )}
    </>
  );
}
