"use client";
import Image from "next/image";
import { Inter } from "next/font/google";
import Link from "next/link";
import { useState } from "react";
import { products, Product } from "./data/products";
import ProductPopup from "./components/addons/productPopup";

const inter = Inter({ subsets: ["latin"] });

const NewProductComponent: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<"semua" | "Aki Motor" | "Aki Mobil">("semua");
  // State untuk mengontrol tampilan popup dan produk yang sedang dipilih
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Fungsi yang dipanggil ketika tombol Beli diklik
  const handleBuyClick = (productId: number, e: React.MouseEvent) => {
    // Cegah navigasi karena event berada di dalam Link
    e.preventDefault();
    e.stopPropagation();

    // Set produk yang dipilih dan tampilkan popup
    setSelectedProductId(productId);
    setShowPopup(true);
  };

  const filteredProducts =
    selectedCategory === "semua"
      ? products
      : products.filter((item: Product) => item.category === selectedCategory);

  return (
    <div className="mt-10">
      <div className="font-semibold">
        <span className="text-sm text-red-700">OUR PRODUCTS</span>
        <h2 className="text-4xl font-bold">Products</h2>
      </div>

      {/* Kategori sebagai tombol flex */}
      <div className="flex gap-4 mt-4">
        {["semua", "Aki Motor", "Aki Mobil"].map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category as "semua" | "Aki Motor" | "Aki Mobil")}
            className={`px-2 py-2 rounded ${
              selectedCategory === category
                ? "text-red-800"
                : " text-white hover:text-red-700"
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-5 ${inter.className}`}>
        {filteredProducts.map((product) => (
          // Bungkus kartu produk dengan Link agar user bisa klik di area lain untuk melihat detail
          <Link key={product.id} href={`/product/${product.slug}`}>
            <div className="bg-zinc-800 rounded-2xl shadowH cursor-pointer lg:h-96 relative">
              <div className="relative h-52 w-full">
                <Image
                  className="rounded-t-xl"
                  src={product.image}
                  alt={`Gambar ${product.title}`}
                  fill
                  style={{ objectFit: "cover", objectPosition: "center" }}
                />
              </div>
              <div className="p-3 block w-full">
                <h2 className="font-bold text-lg">{product.title}</h2>
                <p className="text-xs font-extralight my-1 mb-2 h-12">
                  {product.subtitle}
                </p>
                <p className="text-sm italic font-semibold w-full">
                  {product.price.includes(" - ") ? (
                    <>
                      <span className="mr-2">
                        RP.{" "}
                        <span className="line-through">
                          {product.price.split(" - ")[0].replace("RP.", "").trim()}
                        </span>
                      </span>
                      {product.price.split(" - ")[1]}
                    </>
                  ) : (
                    product.price
                  )}
                </p>

                <div className="w-full flex items-center mt-3 space-x-4">
                  {/* Tombol Beli yang memunculkan popup, kita hindari event navigasi Link */}
                  <button
                    onClick={(e) => handleBuyClick(product.id, e)}
                    className="text-sm  px-10 py-1 bg-red-800 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    Beli
                  </button>

                  <div className="border p-2 rounded-full">
                    <svg width="16" height="16" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.69195 4.10526H8.72184V2.6H10.1379V1.50526H8.72184V0H7.69195V1.50526H6.27586V2.6H7.69195V4.10526ZM12.7126 1.36842V5.13158L4.63448 6.65053L3.05747 0H0.643678C0.472964 0 0.309242 0.0720862 0.188529 0.200401C0.0678159 0.328715 0 0.502747 0 0.684211C0 0.865674 0.0678159 1.03971 0.188529 1.16802C0.309242 1.29633 0.472964 1.36842 0.643678 1.36842H2.07264L4.15172 10.2632H12.7126V8.89474H5.15586L4.94345 7.98474L14 6.28105V1.36842H12.7126ZM4.34483 10.9474C4.15387 10.9474 3.96719 11.0076 3.80842 11.1203C3.64964 11.2331 3.52588 11.3934 3.45281 11.5809C3.37973 11.7685 3.36061 11.9748 3.39786 12.1739C3.43512 12.373 3.52707 12.5559 3.6621 12.6994C3.79713 12.8429 3.96917 12.9407 4.15646 12.9803C4.34376 13.0199 4.53789 12.9996 4.71432 12.9219C4.89074 12.8442 5.04153 12.7127 5.14763 12.5439C5.25372 12.3751 5.31035 12.1767 5.31035 11.9737C5.31035 11.7015 5.20862 11.4404 5.02755 11.248C4.84648 11.0555 4.6009 10.9474 4.34483 10.9474ZM12.069 10.9474C11.878 10.9474 11.6913 11.0076 11.5326 11.1203C11.3738 11.2331 11.25 11.3934 11.1769 11.5809C11.1039 11.7685 11.0847 11.9748 11.122 12.1739C11.1593 12.373 11.2512 12.5559 11.3862 12.6994C11.5213 12.8429 11.6933 12.9407 11.8806 12.9803C12.0679 13.0199 12.262 12.9996 12.4385 12.9219C12.6149 12.8442 12.7657 12.7127 12.8718 12.5439C12.9779 12.3751 13.0345 12.1767 13.0345 11.9737C13.0345 11.7015 12.9328 11.4404 12.7517 11.248C12.5706 11.0555 12.325 10.9474 12.069 10.9474Z" fill="#DBDBDB"/>
                    </svg>
                  </div>
                  
                  <div className="border p-2 rounded-full">
                    <svg width="16" height="16" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.99999 12.2644L1.47143 6.29809L1.47042 6.29701C0.191283 4.92477 0.163482 2.82443 1.46565 1.46582C2.10159 0.802359 2.94522 0.516261 3.81334 0.516261C4.67984 0.516261 5.52184 0.801315 6.15768 1.46234L6.63208 1.97782L6.99999 2.37758L7.36789 1.97782L7.83862 1.46634C9.13597 0.176775 11.2421 0.177886 12.538 1.46968C13.8364 2.82843 13.8076 4.92609 12.5296 6.29699L12.5285 6.29809L6.99999 12.2644Z" stroke="#DBDBDB"/>
                    </svg>
                  </div>

                </div>
                
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Tampilkan popup jika state showPopup true */}
      {showPopup && selectedProductId && (
        <ProductPopup
          productId={selectedProductId}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
    
  );
};

export default NewProductComponent;
