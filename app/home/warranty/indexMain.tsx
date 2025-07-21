"use client";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

const IndexMain: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const images = [
    { src: "/Image/Heybatt-SlidePart.png", link: "/produk/illustrator" },
    { src: "/Image/Motobatt-SlidePart.png", link: "/produk/web" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <main className={`flex min-h-screen flex-col items-center justify-between p-0 bg-white text-black max-720: pt-5 pl-5 pr-5 pb-0 ${inter.className}`}>
      <div className="Header relative">
        {/* Header Garansi */}
        <div>
          <Image src="Image/Panel.svg" alt="" width={500} height={300} />
        </div>

        <div className="AdsProduk mt-10 ">
          {images.map((item, index) => (
            <a key={index} href={item.link} className={`AdsDisplay ${activeIndex === index ? "fadeIn" : "hidden"}`}>
              <div className="AdsDisplayImage">
                <img src={item.src} alt="" width={500} height={500} />
                <div className="AdsDisplayText">
                  {index === 0 && <h1 className="text-lg font-semibold">Aki Motor Heybatt GTZ5S</h1>}
                  {index === 0 && <p className="text-sm">Aki motor murah dan tahan lama</p>}

                  {index === 1 && <h1 className="text-lg font-semibold">Aki Motor Motobatt GTZ5S</h1>}
                  {index === 1 && <p className="text-sm">Aki motor murah dan tahan lama</p>}
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Garansi Button */}
        <div className="button-choice mt-10">
          <div className="buttons flex justify-between">
            <div className="klaim-button">
              <Link href="/warranty/claimwarranty" passHref>
                <button>Klaim Garansi</button>
              </Link>
            </div>
            <div className="lihat-button">
              <Link href="/warranty/mywarranty">
                <button>Lihat Garansi</button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-white rounded-lg shadow m-4 dark:bg-gray-800">
        <div className="w-full mx-auto max-w-screen-xl p-4 md:flex md:items-center md:justify-between">
          <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
            © 2024{" "}
            <a href="https://flowbite.com/" className="hover:underline">
              Akimania™
            </a>
            . All Rights Reserved.
          </span>
          <ul className="flex flex-wrap items-center mt-3 text-sm font-medium text-gray-500 dark:text-gray-400 sm:mt-0">
            <li>
              <a href="#" className="hover:underline me-4 md:me-6">
                About
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline me-4 md:me-6">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline me-4 md:me-6">
                Licensing
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </footer>

      <style jsx>{`
        .klaim-button button {
          background-color: #a259ff;
          color: white;
          width: 10rem;
          height: 3rem;
          border-radius: 20px;
          outline: solid black 3px;
          font-weight: bold;
        }
        .klaim-button button:hover {
          background-color: #ffffff;
          color: black;
        }
        .lihat-button button {
          background-color: #ffc700;
          width: 10rem;
          height: 3rem;
          border-radius: 20px;
          outline: solid black 3px;
          font-weight: bold;
        }
        .lihat-button button:hover {
          background-color: #00c844;
        }
      `}</style>
    </main>
  );
};

export default IndexMain;
