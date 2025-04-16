"use client";

import React, { useEffect, useState } from 'react';
import Link from "next/link";
import MobileComponent from '../addons/mobileheader';

const HeaderComponent: React.FC = () => {

      // Scroll Effect
      const [isScrolled, setIsScrolled] = useState(false);

      useEffect(() => {
        const handleScroll = () => {
          if (window.scrollY > 50) {
            setIsScrolled(true);
          } else {
            setIsScrolled(false);
          }
        };
    
        window.addEventListener("scroll", handleScroll);
        return () => {
          window.removeEventListener("scroll", handleScroll);
        };
      }, []);

  return (
    <header className="w-full navbar h-14 flex items-center justify-center z-50">
      <div className={`md:fixed hidden top-0 w-full p-5 lg:flex h-16 items-center justify-between lg:pl-40 lg:pr-40 z-20 transition-colors duration-300 ${isScrolled ? "navbar bg-zinc-900 shadow-md" : "bg-transparent"}`}>
        {/* Logo di kiri */}
        <div className="flex-shrink-0">
          <Link href="/"> 
            <span className="text-xl font-bold">Logo</span>
          </Link>
        </div>

        {/* Navigasi untuk tampilan desktop */}
        <nav className="hidden md:flex space-x-8 items-center ">
          <Link href="/">Home</Link>
          <Link href="/products">Products</Link>
          <Link href="/contact">Contact</Link>
          <Link className="border-2 pl-6 pr-6 rounded-full" href="/login">Login</Link>
          <svg height={"30px"} widths={"20px"} fill="white" id="Layer_1" version="1.1" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M344.5,298c15-23.6,23.8-51.6,23.8-81.7c0-84.1-68.1-152.3-152.1-152.3C132.1,64,64,132.2,64,216.3  c0,84.1,68.1,152.3,152.1,152.3c30.5,0,58.9-9,82.7-24.4l6.9-4.8L414.3,448l33.7-34.3L339.5,305.1L344.5,298z M301.4,131.2  c22.7,22.7,35.2,52.9,35.2,85c0,32.1-12.5,62.3-35.2,85c-22.7,22.7-52.9,35.2-85,35.2c-32.1,0-62.3-12.5-85-35.2  c-22.7-22.7-35.2-52.9-35.2-85c0-32.1,12.5-62.3,35.2-85c22.7-22.7,52.9-35.2,85-35.2C248.5,96,278.7,108.5,301.4,131.2z"/></svg>
        </nav>

        

      </div>

      <div>
          <MobileComponent></MobileComponent>
        </div>

      
    </header>
  );
};

export default HeaderComponent;
