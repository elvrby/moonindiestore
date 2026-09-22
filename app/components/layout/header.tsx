"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import { signInWithGoogle, signOutWithGoogle } from "@/libs/firebase/auth";
import { useUserSession } from "@/hooks/use-user-session";
import { getAuth } from "firebase/auth";

import { doc, onSnapshot } from "firebase/firestore";
import { firebaseFirestore } from "@/libs/firebase/config";
import Image from "next/image";

type CartItem = {
  productId: string;
  quantity: number;
};

const HeaderComponent: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userUid = useUserSession(null);
  const [username, setUsername] = useState("");

  // counts
  const [favCount, setFavCount] = useState<number>(0);
  const [cartCount, setCartCount] = useState<number>(0);

  // Ambil nama user dari Firebase Auth jika login
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user && user.displayName) {
      setUsername(user.displayName);
    } else {
      setUsername("");
    }
  }, [userUid]);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    handleScroll(); // inisialisasi
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Subscribe counts (favorites & cart) dari Firestore user doc
  useEffect(() => {
    if (!userUid) {
      setFavCount(0);
      setCartCount(0);
      return;
    }
    const userRef = doc(firebaseFirestore, "users", userUid);
    const unsub = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) {
        setFavCount(0);
        setCartCount(0);
        return;
      }
      const data = snap.data() as {
        favorites?: string[];
        cart?: CartItem[];
      };

      const favoritesLen = Array.isArray(data?.favorites) ? data.favorites.length : 0;
      const cartQty = Array.isArray(data?.cart) ? data.cart.reduce((sum, it) => sum + (Number(it?.quantity) || 0), 0) : 0;

      setFavCount(favoritesLen);
      setCartCount(cartQty);
    });

    return () => unsub();
  }, [userUid]);

  // Tutup menu mobile dengan ESC dan ketika route/link diklik
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleLogin = async () => {
    await signInWithGoogle();
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await signOutWithGoogle();
    setIsMobileMenuOpen(false);
  };

  // Reusable badge icon
  const IconButton = ({
    href,
    ariaLabel,
    children,
    badge,
    className = "",
    onClick,
  }: {
    href: string;
    ariaLabel: string;
    children: React.ReactNode;
    badge?: number;
    className?: string;
    onClick?: () => void;
  }) => (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={`relative inline-flex items-center justify-center rounded-full p-2 hover:bg-white/10 transition ${className}`}
      onClick={() => {
        if (onClick) onClick();
        setIsMobileMenuOpen(false);
      }}
    >
      {children}
      {!!badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-[18px] text-center">{badge > 99 ? "99+" : badge}</span>
      )}
    </Link>
  );

  const HeartIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2" />
    </svg>
  );

  const CartIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white" aria-hidden="true">
      <path d="M6 6h15l-1.5 9h-13z" strokeWidth="2" />
      <path d="M6 6L5 3H2" strokeWidth="2" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </svg>
  );

  return (
    <header className="w-full h-14 flex items-center justify-center z-50">
      {/* DESKTOP / LARGE */}
      <div
        className={`md:fixed hidden top-0 w-full p-5 lg:flex h-16 items-center justify-between lg:pl-40 lg:pr-40 z-20 transition-colors duration-300 ${
          isScrolled ? "navbar bg-zinc-900 shadow-md" : "bg-transparent"
        }`}
      >
        <div className="flex-shrink-0">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/Images/logomoon.jpg" className="rounded-full" width={40} height={40} objectFit="cover" alt="car"></Image>
            <span>Moon Indie Store</span>
          </Link>
        </div>

        {/* Navigasi untuk desktop */}
        <nav className="hidden md:flex items-center gap-4">
          <Link href="/" className="text-white hover:opacity-90">
            Home
          </Link>
          <Link href="/products" className="text-white hover:opacity-90">
            Products
          </Link>
          <Link href="/warranty" className="text-white hover:opacity-90">
            Garansi
          </Link>
          <Link href="/contact" className="text-white hover:opacity-90">
            Contact
          </Link>

          {/* NEW: Orders */}
          <Link href="/profile/pesanan" className="text-white hover:opacity-90">
            Orders
          </Link>

          {/* Spacer */}
          <div className="w-px h-6 bg-white/20 mx-2" />

          {/* Favorite & Cart */}
          <div className="flex items-center gap-2">
            <IconButton href="/profile/favorites" ariaLabel="Favorites" badge={favCount}>
              {HeartIcon}
            </IconButton>
            <IconButton href="/profile/cart" ariaLabel="Cart" badge={cartCount}>
              {CartIcon}
            </IconButton>
          </div>

          {/* Auth */}
          {userUid ? (
            <>
              <span className="text-white/90 hidden xl:inline">Hi, {username || "User"}</span>
              <button onClick={handleLogout} className="border-2 border-white/60 px-4 py-1 rounded-full text-white hover:bg-white/10 transition">
                Logout
              </button>
            </>
          ) : (
            <button onClick={handleLogin} className="border-2 border-white/60 px-6 py-1 rounded-full text-white hover:bg-white/10 transition">
              Login with Google
            </button>
          )}

          {/* existing icon (if needed) */}
          <svg height={"30px"} width={"20px"} fill="white" viewBox="0 0 512 512" aria-hidden="true">
            <path d="..." />
          </svg>
        </nav>
      </div>

      {/* MOBILE TOP BAR */}
      <div
        className={`md:hidden fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-30 transition-colors duration-300 ${
          isScrolled ? "navbar bg-zinc-900 shadow-md" : "bg-transparent"
        }`}
      >
        {/* Left: Burger + Logo */}
        <div className="flex items-center gap-2">
          <button
            aria-label="Open menu"
            aria-controls="mobile-menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((s) => !s)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            {/* Hamburger / Close */}
            {!isMobileMenuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" className="text-white" aria-hidden="true">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" className="text-white" aria-hidden="true">
                <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>

          <Link href="/" className="text-white font-bold text-lg">
            <span>Akimania</span>
          </Link>
        </div>

        {/* Right: fav + cart + login/logout kecil */}
        <div className="flex items-center gap-1">
          <IconButton href="/profile/favorites" ariaLabel="Favorites" badge={favCount}>
            {HeartIcon}
          </IconButton>
          <IconButton href="/profile/cart" ariaLabel="Cart" badge={cartCount}>
            {CartIcon}
          </IconButton>

          {userUid ? (
            <button onClick={handleLogout} className="ml-1 border border-white/60 px-3 py-1 rounded-full text-white text-sm hover:bg-white/10 transition">
              Logout
            </button>
          ) : (
            <button onClick={handleLogin} className="ml-1 border border-white/60 px-3 py-1 rounded-full text-white text-sm hover:bg-white/10 transition">
              Login
            </button>
          )}
        </div>
      </div>

      {/* MOBILE MENU PANEL */}
      <div
        id="mobile-menu"
        className={`md:hidden fixed top-14 left-0 right-0 z-20 origin-top transition-all duration-200 ${isMobileMenuOpen ? "opacity-100 scale-y-100" : "opacity-0 scale-y-95 pointer-events-none"}`}
      >
        <div className="mx-3 rounded-2xl bg-zinc-900/95 backdrop-blur border border-white/10 shadow-lg">
          <nav className="flex flex-col py-2">
            <Link href="/" className="px-4 py-3 text-white hover:bg-white/10 rounded-xl" onClick={() => setIsMobileMenuOpen(false)}>
              Home
            </Link>
            <Link href="/products" className="px-4 py-3 text-white hover:bg-white/10 rounded-xl" onClick={() => setIsMobileMenuOpen(false)}>
              Products
            </Link>
            <Link href="/warranty" className="px-4 py-3 text-white hover:bg-white/10 rounded-xl" onClick={() => setIsMobileMenuOpen(false)}>
              Garansi
            </Link>
            <Link href="/contact" className="px-4 py-3 text-white hover:bg-white/10 rounded-xl" onClick={() => setIsMobileMenuOpen(false)}>
              Contact
            </Link>

            {/* NEW: Orders */}
            <Link href="/profile/pesanan" className="px-4 py-3 text-white hover:bg-white/10 rounded-xl" onClick={() => setIsMobileMenuOpen(false)}>
              Orders
            </Link>

            <div className="my-2 mx-4 h-px bg-white/10" />

            {/* Auth area di panel */}
            {userUid ? (
              <div className="flex items-center justify-between px-4 pb-3">
                <span className="text-white/80 text-sm">Hi, {username || "User"}</span>
                <button onClick={handleLogout} className="border border-white/60 px-3 py-1 rounded-full text-white text-sm hover:bg-white/10 transition">
                  Logout
                </button>
              </div>
            ) : (
              <div className="px-4 pb-3">
                <button onClick={handleLogin} className="w-full border border-white/60 px-3 py-2 rounded-xl text-white text-sm hover:bg-white/10 transition">
                  Login with Google
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Overlay klik di luar untuk tutup menu */}
      {isMobileMenuOpen && <button aria-label="Close menu overlay" className="md:hidden fixed inset-0 top-14 z-10 bg-black/30 backdrop-blur-[1px]" onClick={() => setIsMobileMenuOpen(false)} />}
    </header>
  );
};

export default HeaderComponent;
