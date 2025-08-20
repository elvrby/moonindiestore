"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import MobileComponent from "../addons/mobileheader";

import { signInWithGoogle, signOutWithGoogle } from "@/libs/firebase/auth";
import { useUserSession } from "@/hooks/use-user-session";
import { getAuth } from "firebase/auth";

import { doc, onSnapshot } from "firebase/firestore";
import { firebaseFirestore } from "@/libs/firebase/config";

type CartItem = {
  productId: string;
  quantity: number;
};

const HeaderComponent: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
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

    window.addEventListener("scroll", handleScroll);
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

      const favoritesLen = Array.isArray(data?.favorites) ? data!.favorites!.length : 0;
      const cartQty = Array.isArray(data?.cart) ? data!.cart!.reduce((sum, it) => sum + (Number(it?.quantity) || 0), 0) : 0;

      setFavCount(favoritesLen);
      setCartCount(cartQty);
    });

    return () => unsub();
  }, [userUid]);

  const handleLogin = async () => {
    await signInWithGoogle();
  };

  const handleLogout = async () => {
    await signOutWithGoogle();
  };

  // Reusable badge icon
  const IconButton = ({ href, ariaLabel, children, badge }: { href: string; ariaLabel: string; children: React.ReactNode; badge?: number }) => (
    <Link href={href} aria-label={ariaLabel} className="relative inline-flex items-center justify-center rounded-full p-2 hover:bg-white/10 transition">
      {children}
      {!!badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-[18px] text-center">{badge > 99 ? "99+" : badge}</span>
      )}
    </Link>
  );

  const HeartIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2" />
    </svg>
  );

  const CartIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white">
      <path d="M6 6h15l-1.5 9h-13z" strokeWidth="2" />
      <path d="M6 6L5 3H2" strokeWidth="2" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </svg>
  );

  return (
    <header className="w-full navbar h-14 flex items-center justify-center z-50">
      {/* DESKTOP / LARGE */}
      <div
        className={`md:fixed hidden top-0 w-full p-5 lg:flex h-16 items-center justify-between lg:pl-40 lg:pr-40 z-20 transition-colors duration-300 ${
          isScrolled ? "navbar bg-zinc-900 shadow-md" : "bg-transparent"
        }`}
      >
        <div className="flex-shrink-0">
          <Link href="/">
            <span className="text-xl font-bold text-white">Logo</span>
          </Link>
        </div>

        {/* Navigasi untuk desktop */}
        <nav className="hidden md:flex space-x-6 items-center">
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
              <button onClick={handleLogout} className="border-2 border-white/60 pl-4 pr-4 py-1 rounded-full text-white hover:bg-white/10 transition">
                Logout
              </button>
            </>
          ) : (
            <button onClick={handleLogin} className="border-2 border-white/60 pl-6 pr-6 py-1 rounded-full text-white hover:bg-white/10 transition">
              Login with Google
            </button>
          )}

          {/* existing icon (if needed) */}
          <svg height={"30px"} width={"20px"} fill="white" viewBox="0 0 512 512">
            <path d="..." />
          </svg>
        </nav>
      </div>

      {/* MOBILE TOP BAR (ikon + login/logout), muncul saat md:hidden */}
      <div
        className={`md:hidden fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-20 transition-colors duration-300 ${
          isScrolled ? "navbar bg-zinc-900 shadow-md" : "bg-transparent"
        }`}
      >
        <Link href="/" className="text-white font-bold text-lg">
          Logo
        </Link>

        <div className="flex items-center gap-1">
          {/* Favorites & Cart w/ badge */}
          <IconButton href="/profile/favorites" ariaLabel="Favorites" badge={favCount}>
            {HeartIcon}
          </IconButton>
          <IconButton href="/profile/cart" ariaLabel="Cart" badge={cartCount}>
            {CartIcon}
          </IconButton>

          {/* Auth */}
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

      {/* Mobile menu/komponen lain milikmu */}
      <div className="w-full">
        <MobileComponent />
      </div>
    </header>
  );
};

export default HeaderComponent;
