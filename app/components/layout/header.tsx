"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import MobileComponent from "../addons/mobileheader";

import { signInWithGoogle, signOutWithGoogle } from "@/libs/firebase/auth";
import { useUserSession } from "@/hooks/use-user-session";
import { getAuth } from "firebase/auth";

const HeaderComponent: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const userUid = useUserSession(null);
  const [username, setUsername] = useState("");

  // Ambil nama user dari Firebase Auth jika login
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user && user.displayName) {
      setUsername(user.displayName);
    }
  }, [userUid]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogin = async () => {
    await signInWithGoogle();
  };

  const handleLogout = async () => {
    await signOutWithGoogle();
  };

  return (
    <header className="w-full navbar h-14 flex items-center justify-center z-50">
      <div
        className={`md:fixed hidden top-0 w-full p-5 lg:flex h-16 items-center justify-between lg:pl-40 lg:pr-40 z-20 transition-colors duration-300 ${
          isScrolled ? "navbar bg-zinc-900 shadow-md" : "bg-transparent"
        }`}
      >
        <div className="flex-shrink-0">
          <Link href="/">
            <span className="text-xl font-bold">Logo</span>
          </Link>
        </div>

        {/* Navigasi untuk desktop */}
        <nav className="hidden md:flex space-x-8 items-center">
          <Link href="/">Home</Link>
          <Link href="/products">Products</Link>
          <Link href="/contact">Contact</Link>

          {userUid ? (
            <>
              <span className="text-white">Hi, {username || "User"}</span>
              <button onClick={handleLogout} className="border-2 pl-4 pr-4 py-1 rounded-full text-white">
                Logout
              </button>
            </>
          ) : (
            <button onClick={handleLogin} className="border-2 pl-6 pr-6 py-1 rounded-full text-white">
              Login with Google
            </button>
          )}

          <svg height={"30px"} width={"20px"} fill="white" viewBox="0 0 512 512">
            <path d="..." />
          </svg>
        </nav>
      </div>

      <div>
        <MobileComponent />
      </div>
    </header>
  );
};

export default HeaderComponent;
