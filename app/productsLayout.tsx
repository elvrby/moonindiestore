"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { products, Product } from "./data/products";

const NewProductComponent: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<"semua" | "Aki Motor" | "Aki Mobil">("semua");

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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-5">
        {filteredProducts.map((product: Product) => (
          <Link key={product.id} href={`/product/${product.slug}`}>
            <div className="bg-zinc-800 rounded-2xl shadowH cursor-pointer lg:h-80">
              <div className="relative h-40 w-full">
                <Image
                  className="rounded-t-2xl"
                  src={product.image}
                  alt={`Gambar ${product.title}`}
                  fill
                  style={{ objectFit: "cover", objectPosition: "center" }}
                />
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mt-2 mb-2">
                  <span className="text-xs bg-red-800 pl-3 pr-3 rounded-lg">Latest</span>
                </div>
                <h2 className="font-bold text-xl">{product.title}</h2>
                <span className="text-xs" style={{ wordSpacing: "0.5rem" }}>
                  {product.subtitle}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default NewProductComponent;
