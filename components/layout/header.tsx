"use client";

import { useState } from "react";
import Link from "next/link";

const HeaderComponent: React.FC = () => {
  const [navOpen, setNavOpen] = useState(false);

  const handleToggle = () => {
    setNavOpen(!navOpen);
  };

  return (
    <header className="w-full">
      <div className="container mx-auto flex justify-between items-center md:p-5 md:pl-40 md:pr-40 p-5">
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

        {/* Tombol hamburger untuk tampilan mobile */}
        <div className="md:hidden">
          <button onClick={handleToggle} className="focus:outline-none">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {navOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menu navigasi untuk tampilan mobile */}
      {navOpen && (
        <nav className="md:hidden w-full">
          <ul className="flex flex-col items-center space-y-4 pb-4">
            <li>
              <Link href="/" onClick={() => setNavOpen(false)}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/products" onClick={() => setNavOpen(false)}>
                Products
              </Link>
            </li>
            <li>
              <Link href="/contact" onClick={() => setNavOpen(false)}>
                Contact
              </Link>
            </li>
            <li>
              <Link href="/login" onClick={() => setNavOpen(false)}>
                Login
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
};

export default HeaderComponent;
