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
                <p className="text-xs font-extralight my-1 mb-2">
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

                {/* Tombol Beli yang memunculkan popup, kita hindari event navigasi Link */}
                <button
                  onClick={(e) => handleBuyClick(product.id, e)}
                  className="mt-3 border-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Beli
                </button>
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
