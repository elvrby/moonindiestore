/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import HeaderComponent from "./header";
import Image from "next/image";
import NewProductComponent from "@/app/productsLayout";

const Index: React.FC = () => {
  // Array background image
  const backgroundImages = ["/Images/product.jpeg", "/Images/product2.jpeg", "/Images/product3.jpeg"];

  // State untuk menyimpan indeks gambar yang aktif
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // useEffect untuk mengganti background setiap 5 detik
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 5000); // ganti setiap 5000ms = 5 detik

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  return (
    <main className="bg-white">
      <div
        className="relative min-h-screen bg-cover bg-center transition-all duration-1000 "
        style={{
          backgroundImage: `url('${backgroundImages[currentImageIndex]}')`,
        }}
      >
        <div className="text-white z-50">
          <HeaderComponent />
        </div>

        <div className="md:p-40 md:pt-16 md:pb-5 lg:h-screen">
          {/* Deskripsi */}
          <div className="flex justify-between h-3/5">
            <div>
              <div className="shadow-black  drop-shadow-2xl text-sm p-5 md:p-0">
                <h1 className="md:text-6xl text-4xl font-semibold mb-2">
                  <span className="text-yellow-400">Print</span> 
                  <br />
                  With Confident
                </h1>
                <span>Jl H.Saikin No.27 RT15/RW08. Pd.Pinang , Kebayoran lama, Jakarta Selatan</span>
              </div>
            </div>

            <div className="md:flex flex-col space-y-6 items-center relative hidden">
              <a href="https://www.instagram.com/p/DIQ68O0B-xp/?utm_source=ig_web_copy_link" className="">
                <svg version="1.1" id="Layer_1" fill="#BABABA" width="35px" height="35px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56.7 56.7">
                  <g>
                    <path
                      d="M28.2,16.7c-7,0-12.8,5.7-12.8,12.8s5.7,12.8,12.8,12.8S41,36.5,41,29.5S35.2,16.7,28.2,16.7z M28.2,37.7
                              c-4.5,0-8.2-3.7-8.2-8.2s3.7-8.2,8.2-8.2s8.2,3.7,8.2,8.2S32.7,37.7,28.2,37.7z"
                    />
                    <circle cx="41.5" cy="16.4" r="2.9" />
                    <path
                      d="M49,8.9c-2.6-2.7-6.3-4.1-10.5-4.1H17.9c-8.7,0-14.5,5.8-14.5,14.5v20.5
                              c0,4.3,1.4,8,4.2,10.7c2.7,2.6,6.3,3.9,10.4,3.9h20.4c4.3,0,7.9-1.4,10.5-3.9
                              c2.7-2.6,4.1-6.3,4.1-10.6V19.3C53,15.1,51.6,11.5,49,8.9z M48.6,39.9c0,3.1-1.1,5.6-2.9,7.3
                              s-4.3,2.6-7.3,2.6H18c-3,0-5.5-0.9-7.3-2.6C8.9,45.4,8,42.9,8,39.8V19.3c0-3,0.9-5.5,2.7-7.3
                              c1.7-1.7,4.3-2.6,7.3-2.6h20.6c3,0,5.5,0.9,7.3,2.7c1.7,1.8,2.7,4.3,2.7,7.2V39.9L48.6,39.9z"
                    />
                  </g>
                </svg>
              </a>

              <a href="" className="pt-2">
                <svg data-name="Layer 1" width="35px" height="35px" stroke="#BABABA" fill="none" strokeWidth={8} id="Layer_1" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
                  <title />
                  <path
                    d="M53.68,38.26v15.1H37.11V72H53.68v42H73.29V72H90l2-18.63H73.29V38.26c0-2.67,2.11-4,3-4.82,
                                1.57-1.34,9.15-1.55,9.15-1.55h7.43V15a93.26,93.26,0,0,0-11.68-1C53.11,14,53.68,38.26,53.68,38.26Z"
                  />
                </svg>
              </a>

              <a href="https://www.instagram.com/p/DIQ68O0B-xp/?utm_source=ig_web_copy_link" className="">
                <svg width="30px" height="30px" stroke="#BABABA" fill="none" strokeWidth={30} viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                  <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" />
                </svg>
              </a>
            </div>
          </div>


        </div>
      </div>

      {/* konten 2 */}
      <div className="w-full block">

        <div className="lg:px-48 md:mb-40 mb-10 w-full h-96">
          <div className="lg:relative flex lg:mt-60 w-full h-full bg-zinc-600 rounded-lg">
            {/* Box dengan clip-path yang berada di atas gambar */}
            <div className="w-full">
              {/* Desktop */}
              <div
                className="lg:absolute lg:block hidden top-0 left-0 w-full h-full bg-zinc-800 z-10 rounded-lg"
                style={{
                  clipPath: "polygon(0 0, 65% 0, 55% 100%, 0 100%)",
                }}
              >
                <div className="w-3/5 p-10 flex-col">
                  <span className="text-red-600 font-bold ">ABOUT US</span>
                  <h1 className="w-96 text-5xl my-5 font-semibold">Mengenal MoonIndieStore</h1>
                  <div className="w-80 mb-5">
                    <span>Moonindiestore merupakan salah satu usaha mikro, kecil, dan menengah (UMKM) yang bergerak di bidang jasa percetakan sablon digital dengan metode DTF (Direct to Film). Usaha ini berlokasi di Jakarta Selatan.</span>
                  </div>
                  
                </div>
              </div>

              {/* Mobile */}
              <div className="lg:hidden top-0 left-0 w-full h-full bg-zinc-800 z-10 rounded-lg">
                <div className="w-full p-10 flex-col">
                  <span className="text-red-600 font-bold ">ABOUT US</span>
                  <h1 className="text-4xl my-5 font-semibold">Our Reputation Speaks for Itself</h1>
                  <div className="w-80 mb-5">
                    <span>Telah banyak pelanggan yang kami layani dengan pelayanan terbaik dari kami, serta memberikan kenyamanan berkendara anda</span>
                  </div>
                  <button className="border-red-600 border rounded-full p-2 px-8">Lihat Review</button>
                </div>
              </div>
            </div>

            <div className="w-full hidden lg:block">
              {/* Gambar latar belakang, dibuat memenuhi container */}
              <Image className="w-full h-full rounded-lg" src="/Images/product3.jpeg" width={500} height={500} objectFit="cover" alt="car" />
            </div>
          </div>
        </div>

        <div className="w-full inline-block font-semibold">
          {/* Judul Text Services Kita */}
          <div className="w-full text-center">
            <span className="text-sm text-blue-700">WHAT WE OFFER</span>
            <h1 className="text-4xl text-black">Our Services</h1>
          </div>

          {/* Menggunakan grid responsif */}
          <div className="w-full p-5 px-5 md:px-40 grid grid-cols-1 md:grid-cols-3 gap-4 ">
            <div className="bg-zinc-800 rounded-lg overflow-hidden">
              <div className="w-full">
                <Image className="w-full" src="/Images/sablon.jpg" width={1000} height={1000} alt="Battery-Repair" />
              </div>
              <div className="px-4 py-5">
                <span className="text-sm text-blue-700">Sablon</span>
                <h1 className="text-2xl mb-2">Sablon Digital DTF</h1>
                <p className="text-sm font-extralight w-72 h-14">Produk kami menggunakan bahan berkualitas yang nyaman digunakan dan tidak mudah rusak</p>
                <div className="w-full flex items-center mt-4 space-x-4">
                  <button className="bg-blue-800 p-2 px-5 rounded-full text-xs ">Kontak Kami</button>
                  <div className="border-2 p-2 rounded-full">
                    <svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M15.558 0.123661C13.3153 1.04917 3.69926 5.01853 1.04227 6.10043C-0.739679 6.79341 0.303399 7.44305 0.303399 7.44305C0.303399 7.44305 1.82444 7.96269 3.12825 8.35251C4.43205 8.74233 5.12743 8.30918 5.12743 8.30918L11.2553 4.19466C13.4282 2.72223 12.9068 3.93484 12.3853 4.45448C11.2553 5.58061 9.38654 7.3562 7.82201 8.78549C7.12662 9.39179 7.47432 9.91161 7.77852 10.1714C8.90857 11.1242 11.9941 13.0732 12.1681 13.2032C13.0863 13.8508 14.8922 14.7833 15.1669 12.8133L16.2534 6.01377C16.6011 3.71836 16.9488 1.5961 16.9923 0.98979C17.1226 -0.482647 15.558 0.123661 15.558 0.123661Z"
                        fill="#DBDBDB"
                      />
                    </svg>
                  </div>
                  <div className="border-2 p-2 rounded-full">
                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M14.5231 2.47049C12.925 0.878196 10.7998 0.000923265 8.53548 0C3.87001 0 0.072807 3.77875 0.070986 8.42335C0.0703332 9.9081 0.460104 11.3573 1.20085 12.6348L0 17L4.48714 15.8286C5.72345 16.4997 7.11544 16.8534 8.53211 16.8539H8.53554C13.2005 16.8539 16.998 13.0748 17 8.43009C17.0008 6.17917 16.1212 4.06271 14.5231 2.47049ZM8.53551 15.4312H8.53266C7.2703 15.4308 6.0321 15.0932 4.95191 14.4553L4.69505 14.3036L2.03231 14.9987L2.74307 12.415L2.57577 12.15C1.87155 11.0353 1.49961 9.7468 1.50016 8.42383C1.50167 4.56342 4.65777 1.42275 8.53836 1.42275C10.4175 1.42333 12.1839 2.15261 13.5122 3.47606C14.8405 4.79951 15.5716 6.55867 15.5708 8.42951C15.5692 12.2902 12.4132 15.4312 8.53551 15.4312Z"
                        fill="#DBDBDB"
                      />
                      <path
                        d="M12.3945 10.1873C12.183 10.082 11.1432 9.57285 10.9493 9.50255C10.7555 9.43231 10.6145 9.39719 10.4735 9.6079C10.3325 9.81858 9.9272 10.2927 9.80381 10.4332C9.68046 10.5736 9.55704 10.5913 9.3456 10.4859C9.13412 10.3805 8.45264 10.1583 7.64482 9.44117C7.01604 8.883 6.5916 8.19377 6.46819 7.98299C6.34484 7.77232 6.45506 7.65841 6.56096 7.55343C6.6561 7.45909 6.77247 7.30761 6.87823 7.18467C6.98395 7.06181 7.0192 6.97393 7.08971 6.83356C7.16021 6.69305 7.125 6.57012 7.07208 6.4648C7.0192 6.35945 6.59624 5.32341 6.42001 4.90189C6.24829 4.49151 6.07395 4.54711 5.94411 4.54058C5.82093 4.53446 5.67975 4.5332 5.53877 4.5332C5.39779 4.5332 5.16862 4.58589 4.9748 4.79656C4.78094 5.00731 4.23453 5.51657 4.23453 6.55251C4.23453 7.58859 4.99239 8.58947 5.09815 8.72991C5.20387 8.87045 6.58951 10.9964 8.71112 11.9082C9.21572 12.1251 9.60968 12.2546 9.91682 12.3515C10.4235 12.5118 10.8845 12.4891 11.249 12.4349C11.6553 12.3745 12.5003 11.9258 12.6765 11.4342C12.8528 10.9424 12.8528 10.5209 12.7999 10.4332C12.747 10.3454 12.606 10.2927 12.3945 10.1873Z"
                        fill="#DBDBDB"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800 rounded-lg overflow-hidden">
              <div className="w-full">
                <Image className="w-full" src="/Images/lanyard.jpeg" width={1000} height={1000} alt="Packing-1" />
              </div>
              <div className="px-4 py-5">
                <span className="text-sm text-blue-700">Lanyard</span>
                <h1 className="text-2xl mb-2">Print Lanyard</h1>
                <p className="text-sm font-extralight w-72 h-14">Kami juga menerima orderan pembuatan lanyard untuk perusahaan atau perorangan</p>
                <div className="w-full flex items-center mt-4 space-x-4">
                  <button className="bg-blue-800 p-2 px-5 rounded-full text-xs ">Kontak Kami</button>
                  <div className="border-2 p-2 rounded-full">
                    <svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M15.558 0.123661C13.3153 1.04917 3.69926 5.01853 1.04227 6.10043C-0.739679 6.79341 0.303399 7.44305 0.303399 7.44305C0.303399 7.44305 1.82444 7.96269 3.12825 8.35251C4.43205 8.74233 5.12743 8.30918 5.12743 8.30918L11.2553 4.19466C13.4282 2.72223 12.9068 3.93484 12.3853 4.45448C11.2553 5.58061 9.38654 7.3562 7.82201 8.78549C7.12662 9.39179 7.47432 9.91161 7.77852 10.1714C8.90857 11.1242 11.9941 13.0732 12.1681 13.2032C13.0863 13.8508 14.8922 14.7833 15.1669 12.8133L16.2534 6.01377C16.6011 3.71836 16.9488 1.5961 16.9923 0.98979C17.1226 -0.482647 15.558 0.123661 15.558 0.123661Z"
                        fill="#DBDBDB"
                      />
                    </svg>
                  </div>
                  <div className="border-2 p-2 rounded-full">
                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M14.5231 2.47049C12.925 0.878196 10.7998 0.000923265 8.53548 0C3.87001 0 0.072807 3.77875 0.070986 8.42335C0.0703332 9.9081 0.460104 11.3573 1.20085 12.6348L0 17L4.48714 15.8286C5.72345 16.4997 7.11544 16.8534 8.53211 16.8539H8.53554C13.2005 16.8539 16.998 13.0748 17 8.43009C17.0008 6.17917 16.1212 4.06271 14.5231 2.47049ZM8.53551 15.4312H8.53266C7.2703 15.4308 6.0321 15.0932 4.95191 14.4553L4.69505 14.3036L2.03231 14.9987L2.74307 12.415L2.57577 12.15C1.87155 11.0353 1.49961 9.7468 1.50016 8.42383C1.50167 4.56342 4.65777 1.42275 8.53836 1.42275C10.4175 1.42333 12.1839 2.15261 13.5122 3.47606C14.8405 4.79951 15.5716 6.55867 15.5708 8.42951C15.5692 12.2902 12.4132 15.4312 8.53551 15.4312Z"
                        fill="#DBDBDB"
                      />
                      <path
                        d="M12.3945 10.1873C12.183 10.082 11.1432 9.57285 10.9493 9.50255C10.7555 9.43231 10.6145 9.39719 10.4735 9.6079C10.3325 9.81858 9.9272 10.2927 9.80381 10.4332C9.68046 10.5736 9.55704 10.5913 9.3456 10.4859C9.13412 10.3805 8.45264 10.1583 7.64482 9.44117C7.01604 8.883 6.5916 8.19377 6.46819 7.98299C6.34484 7.77232 6.45506 7.65841 6.56096 7.55343C6.6561 7.45909 6.77247 7.30761 6.87823 7.18467C6.98395 7.06181 7.0192 6.97393 7.08971 6.83356C7.16021 6.69305 7.125 6.57012 7.07208 6.4648C7.0192 6.35945 6.59624 5.32341 6.42001 4.90189C6.24829 4.49151 6.07395 4.54711 5.94411 4.54058C5.82093 4.53446 5.67975 4.5332 5.53877 4.5332C5.39779 4.5332 5.16862 4.58589 4.9748 4.79656C4.78094 5.00731 4.23453 5.51657 4.23453 6.55251C4.23453 7.58859 4.99239 8.58947 5.09815 8.72991C5.20387 8.87045 6.58951 10.9964 8.71112 11.9082C9.21572 12.1251 9.60968 12.2546 9.91682 12.3515C10.4235 12.5118 10.8845 12.4891 11.249 12.4349C11.6553 12.3745 12.5003 11.9258 12.6765 11.4342C12.8528 10.9424 12.8528 10.5209 12.7999 10.4332C12.747 10.3454 12.606 10.2927 12.3945 10.1873Z"
                        fill="#DBDBDB"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800 rounded-lg overflow-hidden">
              <div className="w-full">
                <Image className="w-full" src="/Images/banner.jpeg" width={1000} height={1000} alt="tukar-tambah-1" />
              </div>
              <div className="px-4 py-5">
                <span className="text-sm text-blue-700">Banner</span>
                <h1 className="text-2xl mb-2">Tukar Tambah</h1>
                <p className="text-sm font-extralight w-72 h-14">Kami melayani tukar tambah aki lama anda dengan aki baru</p>
                <div className="w-full flex items-center mt-4 space-x-4">
                  <button className="bg-blue-800 p-2 px-5 rounded-full text-xs ">Kontak Kami</button>
                  <div className="border-2 p-2 rounded-full">
                    <svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M15.558 0.123661C13.3153 1.04917 3.69926 5.01853 1.04227 6.10043C-0.739679 6.79341 0.303399 7.44305 0.303399 7.44305C0.303399 7.44305 1.82444 7.96269 3.12825 8.35251C4.43205 8.74233 5.12743 8.30918 5.12743 8.30918L11.2553 4.19466C13.4282 2.72223 12.9068 3.93484 12.3853 4.45448C11.2553 5.58061 9.38654 7.3562 7.82201 8.78549C7.12662 9.39179 7.47432 9.91161 7.77852 10.1714C8.90857 11.1242 11.9941 13.0732 12.1681 13.2032C13.0863 13.8508 14.8922 14.7833 15.1669 12.8133L16.2534 6.01377C16.6011 3.71836 16.9488 1.5961 16.9923 0.98979C17.1226 -0.482647 15.558 0.123661 15.558 0.123661Z"
                        fill="#DBDBDB"
                      />
                    </svg>
                  </div>
                  <div className="border-2 p-2 rounded-full">
                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M14.5231 2.47049C12.925 0.878196 10.7998 0.000923265 8.53548 0C3.87001 0 0.072807 3.77875 0.070986 8.42335C0.0703332 9.9081 0.460104 11.3573 1.20085 12.6348L0 17L4.48714 15.8286C5.72345 16.4997 7.11544 16.8534 8.53211 16.8539H8.53554C13.2005 16.8539 16.998 13.0748 17 8.43009C17.0008 6.17917 16.1212 4.06271 14.5231 2.47049ZM8.53551 15.4312H8.53266C7.2703 15.4308 6.0321 15.0932 4.95191 14.4553L4.69505 14.3036L2.03231 14.9987L2.74307 12.415L2.57577 12.15C1.87155 11.0353 1.49961 9.7468 1.50016 8.42383C1.50167 4.56342 4.65777 1.42275 8.53836 1.42275C10.4175 1.42333 12.1839 2.15261 13.5122 3.47606C14.8405 4.79951 15.5716 6.55867 15.5708 8.42951C15.5692 12.2902 12.4132 15.4312 8.53551 15.4312Z"
                        fill="#DBDBDB"
                      />
                      <path
                        d="M12.3945 10.1873C12.183 10.082 11.1432 9.57285 10.9493 9.50255C10.7555 9.43231 10.6145 9.39719 10.4735 9.6079C10.3325 9.81858 9.9272 10.2927 9.80381 10.4332C9.68046 10.5736 9.55704 10.5913 9.3456 10.4859C9.13412 10.3805 8.45264 10.1583 7.64482 9.44117C7.01604 8.883 6.5916 8.19377 6.46819 7.98299C6.34484 7.77232 6.45506 7.65841 6.56096 7.55343C6.6561 7.45909 6.77247 7.30761 6.87823 7.18467C6.98395 7.06181 7.0192 6.97393 7.08971 6.83356C7.16021 6.69305 7.125 6.57012 7.07208 6.4648C7.0192 6.35945 6.59624 5.32341 6.42001 4.90189C6.24829 4.49151 6.07395 4.54711 5.94411 4.54058C5.82093 4.53446 5.67975 4.5332 5.53877 4.5332C5.39779 4.5332 5.16862 4.58589 4.9748 4.79656C4.78094 5.00731 4.23453 5.51657 4.23453 6.55251C4.23453 7.58859 4.99239 8.58947 5.09815 8.72991C5.20387 8.87045 6.58951 10.9964 8.71112 11.9082C9.21572 12.1251 9.60968 12.2546 9.91682 12.3515C10.4235 12.5118 10.8845 12.4891 11.249 12.4349C11.6553 12.3745 12.5003 11.9258 12.6765 11.4342C12.8528 10.9424 12.8528 10.5209 12.7999 10.4332C12.747 10.3454 12.606 10.2927 12.3945 10.1873Z"
                        fill="#DBDBDB"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Pemisah Konten */}
          <div className="w-full h-2 items-center flex justify-center mt-3">
            <div className="w-2/6 h-1 bg-red-800"></div>
          </div>
        </div>
      </div>

      {/* Konten 3 */}
      <div className="p-5 md:px-32">
        <NewProductComponent></NewProductComponent>
      </div>
    </main>
  );
};

export default Index;
