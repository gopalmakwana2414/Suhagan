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
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const [isSearchHovered, setIsSearchHovered] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        setIsSearchFocused(false);
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSuggestions(false);
        setUserMenu(false);
        setMobileMenu(false);
        setIsSearchFocused(false);
        setIsSearchHovered(false);
        setIsMobileSearchExpanded(false);
        searchInputRef.current?.blur();
        mobileSearchInputRef.current?.blur();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const isExpanded = isSearchHovered || isSearchFocused || search.trim() !== "";

  // Auto-focus input when desktop search is expanded
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);


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

  // Nav link custom styles
  const navLinkClass = "relative py-1 text-[13px] uppercase tracking-widest text-gray-800 hover:text-primary transition-colors duration-300 after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100 font-medium";

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-primary text-white text-center text-sm py-2">
        🎁 Free Shipping on Orders Above ₹999 &nbsp;|&nbsp; Handcrafted Sarees
        Direct from Surat
      </div>

      {/* Navbar */}
      <header className={`sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b transition-all duration-300 ${scrolled ? "shadow-md" : "shadow-sm"}`}>
        <div className="container-custom px-4 sm:px-6 lg:px-10 xl:px-12">
          <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? "py-1 min-h-[70px]" : "py-1.5 min-h-[80px]"}`}>
            {/* Logo */}
            <Logo className={scrolled ? "h-[43px] w-[98px] md:h-[53px] md:w-[121px] lg:h-[57px] lg:w-[130px]" : "h-[43px] w-[98px] md:h-[53px] md:w-[121px] lg:h-[64px] lg:w-[147px]"} />

            {/* Desktop Menu */}
            <nav className="hidden lg:flex items-center gap-5 xl:gap-7 font-medium">
              <Link href="/" className={navLinkClass}>
                Home
              </Link>
              <Link href="/shop" className={navLinkClass}>
                Shop
              </Link>
              <Link href="/categories" className={navLinkClass}>
                Categories
              </Link>
              <Link href="/collections" className={navLinkClass}>
                Collections
              </Link>
              <Link href="/about" className={navLinkClass}>
                About
              </Link>
              <Link href="/contact" className={navLinkClass}>
                Contact
              </Link>
            </nav>

            {/* Right Actions Group (Search + Icons) */}
            <div className="flex items-center gap-3 md:gap-4 lg:gap-5">
              {/* Desktop Search */}
              <div
                ref={searchRef}
                className="hidden lg:block relative"
                onMouseEnter={() => setIsSearchHovered(true)}
                onMouseLeave={() => setIsSearchHovered(false)}
              >
                <form
                  onSubmit={handleSearch}
                  className={`flex items-center border rounded-full transition-all duration-300 ease-out h-10 ${
                    isExpanded
                      ? "w-[280px] border-gray-200 bg-gray-50/50 px-4"
                      : "w-10 border-transparent bg-transparent px-2.5 justify-center"
                  }`}
                >
                  <button
                    type={isExpanded && search.trim() !== "" ? "submit" : "button"}
                    onClick={() => {
                      if (!isExpanded) {
                        setIsSearchFocused(true);
                      }
                    }}
                    className="text-gray-600 hover:text-primary focus:outline-none shrink-0 cursor-pointer flex items-center justify-center"
                    aria-label="Search sarees"
                    aria-expanded={isExpanded}
                    suppressHydrationWarning
                  >
                    <Search size={20} />
                  </button>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => {
                      setIsSearchFocused(true);
                      setShowSuggestions(true);
                    }}
                    onBlur={() => {
                      setIsSearchFocused(false);
                    }}
                    placeholder="Search sarees..."
                    className={`outline-none bg-transparent text-sm transition-all duration-300 ease-out origin-left ${
                      isExpanded
                        ? "w-full ml-3 opacity-100 pointer-events-auto"
                        : "w-0 opacity-0 pointer-events-none ml-0"
                    }`}
                    suppressHydrationWarning
                    aria-label="Search sarees"
                  />
                </form>

                {/* Desktop Autocomplete Dropdown */}
                <AnimatePresence>
                  {showSuggestions && debouncedSearch.trim().length >= 2 && isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-12 right-0 w-[340px] bg-white border border-gray-100 shadow-xl rounded-2xl p-2 z-50 max-h-[400px] overflow-y-auto"
                    >
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
                              className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-gray-50 transition-colors text-left cursor-pointer"
                            >
                              <Image
                                src={product.thumbnail.url}
                                alt={product.name}
                                width={40}
                                height={50}
                                className="w-10 h-12 object-cover rounded-lg flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium line-clamp-1 text-gray-800">
                                  {product.name}
                                </p>
                                <p className="text-xs text-primary font-semibold">
                                  ₹{product.salePrice.toLocaleString()}
                                </p>
                              </div>
                            </button>
                          ))}
                          <button
                            onClick={handleSearch}
                            className="w-full text-center text-sm text-primary font-medium py-2 hover:underline cursor-pointer"
                          >
                            View all results for &quot;{debouncedSearch}&quot;
                          </button>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Search Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileSearchExpanded(true);
                  setMobileMenu(false);
                  setUserMenu(false);
                  setTimeout(() => {
                    mobileSearchInputRef.current?.focus();
                  }, 50);
                }}
                className="lg:hidden p-1.5 text-gray-600 hover:text-primary transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                aria-label="Search"
              >
                <Search size={22} />
              </button>

              {/* Wishlist */}
              <Link href="/wishlist" className="relative p-1 text-gray-600 hover:text-primary transition-colors shrink-0 flex items-center justify-center">
                <Heart size={22} />
                <AnimatePresence>
                  {wishlistCount > 0 && (
                    <motion.span
                      key={wishlistCount}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold"
                    >
                      {wishlistCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* Cart */}
              <Link href="/cart" className="relative p-1 text-gray-600 hover:text-primary transition-colors shrink-0 flex items-center justify-center">
                <ShoppingBag size={22} />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* User Dropdown */}
              <div className="relative shrink-0">
                <button
                  onClick={() => {
                    setUserMenu(!userMenu);
                    setMobileMenu(false);
                    setIsMobileSearchExpanded(false);
                  }}
                  className="flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/45 rounded-full p-0.5 transition cursor-pointer shrink-0"
                  aria-expanded={userMenu}
                  aria-haspopup="true"
                  aria-label="User profile menu"
                  suppressHydrationWarning
                >
                  <div className="w-9 h-9 bg-secondary border border-primary rounded-full flex items-center justify-center hover:bg-soft-bg-hover transition-colors">
                    <User size={18} className="text-primary" />
                  </div>
                </button>

                <AnimatePresence>
                  {userMenu && (
                    <motion.div
                      role="menu"
                      aria-label="User Menu"
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 8 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 top-12 bg-white/95 backdrop-blur-md border border-gray-100 shadow-2xl rounded-2xl w-60 p-4 z-50 origin-top-right"
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
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-secondary hover:text-primary text-gray-700 text-sm font-medium transition focus:outline-none focus:bg-secondary focus:text-primary"
                          >
                            <User size={15} /> My Profile
                          </Link>
                          <Link
                            href="/orders"
                            role="menuitem"
                            onClick={() => setUserMenu(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-secondary hover:text-primary text-gray-700 text-sm font-medium transition focus:outline-none focus:bg-secondary focus:text-primary"
                          >
                            <ShoppingBag size={15} /> My Orders
                          </Link>
                          {user.role === "admin" && (
                            <Link
                              href="/admin"
                              role="menuitem"
                              onClick={() => setUserMenu(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-secondary hover:text-primary text-gray-700 text-sm font-medium transition focus:outline-none focus:bg-secondary focus:text-primary"
                            >
                              <Settings size={15} /> Admin Panel
                            </Link>
                          )}
                          <button
                            onClick={handleLogout}
                            role="menuitem"
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-600 hover:text-red-700 text-sm font-medium w-full text-left transition focus:outline-none focus:bg-red-50 focus:text-red-700 cursor-pointer"
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
                            className="block w-full text-center px-4 py-2.5 rounded-xl border border-primary text-primary hover:bg-secondary text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/40"
                          >
                            Login
                          </Link>
                          <Link
                            href="/register"
                            role="menuitem"
                            onClick={() => setUserMenu(false)}
                            className="block w-full text-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white hover:from-primary-dark hover:to-deep-maroon text-sm font-semibold transition shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
                          >
                            Create Account
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden text-gray-600 hover:text-primary transition cursor-pointer p-1 shrink-0 flex items-center justify-center"
                onClick={() => {
                  setMobileMenu(!mobileMenu);
                  setIsMobileSearchExpanded(false);
                  setUserMenu(false);
                }}
                aria-label="Toggle menu"
                aria-expanded={mobileMenu}
              >
                {mobileMenu ? <X size={26} /> : <Menu size={26} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        <AnimatePresence>
          {isMobileSearchExpanded && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
                onClick={() => setIsMobileSearchExpanded(false)}
              />

              {/* Search Bar Overlay */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="absolute inset-x-0 top-0 h-full bg-white z-50 flex items-center px-4 gap-3 shadow-md"
              >
                <form
                  onSubmit={(e) => {
                    handleSearch(e);
                    setIsMobileSearchExpanded(false);
                  }}
                  className="flex items-center w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5"
                >
                  <Search size={18} className="text-gray-400 shrink-0" />
                  <input
                    ref={mobileSearchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Search sarees..."
                    className="outline-none ml-2 w-full text-sm bg-transparent py-1"
                    suppressHydrationWarning
                    aria-label="Search sarees"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="text-gray-400 hover:text-gray-600 p-0.5 shrink-0"
                    >
                      <X size={16} />
                    </button>
                  )}
                </form>
                <button
                  type="button"
                  onClick={() => setIsMobileSearchExpanded(false)}
                  className="text-gray-600 hover:text-primary text-sm font-medium shrink-0 cursor-pointer"
                >
                  Cancel
                </button>

                {/* Mobile Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && debouncedSearch.trim().length >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-[100%] left-0 right-0 bg-white border-t border-gray-100 shadow-2xl p-2 z-50 max-h-[70vh] overflow-y-auto"
                    >
                      {suggestions.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-6">
                          No products found for &quot;{debouncedSearch}&quot;
                        </p>
                      ) : (
                        <>
                          {suggestions.map((product: any) => (
                            <button
                              key={product._id}
                              onClick={() => {
                                goToProduct(product.slug);
                                setIsMobileSearchExpanded(false);
                              }}
                              className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-gray-50 transition-colors text-left cursor-pointer"
                            >
                              <Image
                                src={product.thumbnail.url}
                                alt={product.name}
                                width={40}
                                height={50}
                                className="w-10 h-12 object-cover rounded-lg flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium line-clamp-1 text-gray-800">
                                  {product.name}
                                </p>
                                <p className="text-xs text-primary font-semibold">
                                  ₹{product.salePrice.toLocaleString()}
                                </p>
                              </div>
                            </button>
                          ))}
                          <button
                            onClick={(e) => {
                              handleSearch(e);
                              setIsMobileSearchExpanded(false);
                            }}
                            className="w-full text-center text-sm text-primary font-medium py-2 hover:underline cursor-pointer"
                          >
                            View all results for &quot;{debouncedSearch}&quot;
                          </button>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="lg:hidden border-t bg-white overflow-hidden"
            >
              <div className="flex flex-col p-5 gap-4 font-medium text-gray-700">
                <Link href="/" onClick={() => setMobileMenu(false)} className="hover:text-primary transition">
                  Home
                </Link>
                <Link href="/shop" onClick={() => setMobileMenu(false)} className="hover:text-primary transition">
                  Shop
                </Link>
                <Link href="/categories" onClick={() => setMobileMenu(false)} className="hover:text-primary transition">
                  Categories
                </Link>
                <Link href="/collections" onClick={() => setMobileMenu(false)} className="hover:text-primary transition">
                  Collections
                </Link>
                <Link href="/about" onClick={() => setMobileMenu(false)} className="hover:text-primary transition">
                  About
                </Link>
                <Link href="/contact" onClick={() => setMobileMenu(false)} className="hover:text-primary transition">
                  Contact
                </Link>
                <hr className="border-gray-100" />
                {user ? (
                  <>
                    <Link href="/profile" onClick={() => setMobileMenu(false)} className="hover:text-primary transition">
                      My Profile
                    </Link>
                    <Link href="/orders" onClick={() => setMobileMenu(false)} className="hover:text-primary transition">
                      My Orders
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenu(false);
                      }}
                      className="text-left text-red-500 hover:text-red-600 transition cursor-pointer"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileMenu(false)} className="hover:text-primary transition">
                      Login
                    </Link>
                    <Link href="/register" onClick={() => setMobileMenu(false)} className="hover:text-primary transition">
                      Register
                    </Link>
                  </>
                )}
                <Link href="/wishlist" onClick={() => setMobileMenu(false)} className="hover:text-primary transition">
                  Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                </Link>
                <Link href="/cart" onClick={() => setMobileMenu(false)} className="hover:text-primary transition">
                  Cart {cartCount > 0 && `(${cartCount})`}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Overlay to close menus */}
      <AnimatePresence>
        {(userMenu || mobileMenu) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/5 backdrop-blur-xs"
            onClick={() => {
              setUserMenu(false);
              setMobileMenu(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
