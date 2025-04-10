"use client";
import React, { useState, useEffect } from "react";
import HeaderComponent from "./header";

const Index: React.FC = () => {
  // Array background image
  const backgroundImages = [
    "/Images/Car-background.jpg",
    "/Images/Motor-background.jpg",
    "/Images/Electric-background.jpeg",
  ];

  // State untuk menyimpan indeks gambar yang aktif
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // useEffect untuk mengganti background setiap 5 detik
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % backgroundImages.length
      );
    }, 5000); // ganti setiap 5000ms = 5 detik

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  return (
    <main>
      <div
        className="relative min-h-screen bg-cover bg-center transition-all duration-1000 "
        style={{
          backgroundImage: `url('${backgroundImages[currentImageIndex]}')`,
        }}
      >
        
        <div className="text-white">
          <HeaderComponent />
        </div>

        <div className="md:p-40 md:pt-16 md:pb-5">
          <div className="flex justify-between">
            <div>
              <div className="shadow-black  drop-shadow-2xl text-sm p-5">
                <h1 className="md:text-6xl text-4xl font-semibold mb-2">
                  <span className="text-red-700">BatteryParts</span> - Drive
                  <br />
                  With Confident
                </h1>
                <span>
                  Jadikan hari harimu berkendara lebih nyaman dan bertenaga
                  serta tampil dengan percaya diri
                </span>
              </div>
            </div>

            <div className="md:flex flex-col space-y-6 items-center relative hidden">
              <a
                href="https://www.instagram.com/p/DIQ68O0B-xp/?utm_source=ig_web_copy_link"
                className=""
              >
                <svg
                  version="1.1"
                  id="Layer_1"
                  fill="#BABABA"
                  width="35px"
                  height="35px"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 56.7 56.7"
                >
                  <g>
                    <path d="M28.2,16.7c-7,0-12.8,5.7-12.8,12.8s5.7,12.8,12.8,12.8S41,36.5,41,29.5S35.2,16.7,28.2,16.7z M28.2,37.7
                              c-4.5,0-8.2-3.7-8.2-8.2s3.7-8.2,8.2-8.2s8.2,3.7,8.2,8.2S32.7,37.7,28.2,37.7z" />
                    <circle cx="41.5" cy="16.4" r="2.9" />
                    <path d="M49,8.9c-2.6-2.7-6.3-4.1-10.5-4.1H17.9c-8.7,0-14.5,5.8-14.5,14.5v20.5
                              c0,4.3,1.4,8,4.2,10.7c2.7,2.6,6.3,3.9,10.4,3.9h20.4c4.3,0,7.9-1.4,10.5-3.9
                              c2.7-2.6,4.1-6.3,4.1-10.6V19.3C53,15.1,51.6,11.5,49,8.9z M48.6,39.9c0,3.1-1.1,5.6-2.9,7.3
                              s-4.3,2.6-7.3,2.6H18c-3,0-5.5-0.9-7.3-2.6C8.9,45.4,8,42.9,8,39.8V19.3c0-3,0.9-5.5,2.7-7.3
                              c1.7-1.7,4.3-2.6,7.3-2.6h20.6c3,0,5.5,0.9,7.3,2.7c1.7,1.8,2.7,4.3,2.7,7.2V39.9L48.6,39.9z" />
                  </g>
                </svg>
              </a>

              <a href="" className="pt-2">
                <svg
                  data-name="Layer 1"
                  width="35px"
                  height="35px"
                  stroke="#BABABA"
                  fill="none"
                  strokeWidth={8}
                  id="Layer_1"
                  viewBox="0 0 128 128"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title />
                  <path d="M53.68,38.26v15.1H37.11V72H53.68v42H73.29V72H90l2-18.63H73.29V38.26c0-2.67,2.11-4,3-4.82,
                                1.57-1.34,9.15-1.55,9.15-1.55h7.43V15a93.26,93.26,0,0,0-11.68-1C53.11,14,53.68,38.26,53.68,38.26Z" />
                </svg>
              </a>

              <a
                href="https://www.instagram.com/p/DIQ68O0B-xp/?utm_source=ig_web_copy_link"
                className=""
              >
                <svg
                  width="30px"
                  height="30px"
                  stroke="#BABABA"
                  fill="none"
                  strokeWidth={30}
                  viewBox="0 0 448 512"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" />
                </svg>
              </a>
            </div>
          </div>

            <div className="">
            
            <div className="flex md:mt-64 mt-10 items-center md:p-0 p-5">
                <div className="w-11 h-11 rounded-full border-2 border-red-600 flex items-center justify-center">
                    <svg className="pl-1" width={"28px"} height={"28px"} fill="white" id="Layer_1" version="1.1" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M405.2,232.9L126.8,67.2c-3.4-2-6.9-3.2-10.9-3.2c-10.9,0-19.8,9-19.8,20H96v344h0.1c0,11,8.9,20,19.8,20  c4.1,0,7.5-1.4,11.2-3.4l278.1-165.5c6.6-5.5,10.8-13.8,10.8-23.1C416,246.7,411.8,238.5,405.2,232.9z"/></svg>
                </div>
                <span className="ml-5">Lihat Dokumentasi</span>
            </div>

          {/* Indikator untuk background image */}
          <div className="flex space-x-2 justify-center md:justify-end md:mt-6 mt-96">
            {backgroundImages.map((_, index) => (
              <div
                key={index}
                className={`w-12 h-3 rounded-md ${
                  currentImageIndex === index
                    ? "bg-red-700"
                    : "border-2 border-red-700"
                }`}
              ></div>
            ))}
          </div>

          </div>

        </div>
      </div>
    </main>
  );
};

export default Index;
