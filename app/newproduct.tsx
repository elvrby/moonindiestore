"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { products, Product } from "./data/products";

const NewProductComponent: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "game" | "aplikasi">("all");
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((item: Product) => item.category === selectedCategory);

  return (
    <div className="mt-10">
      <div>
        <h2 className="text-3xl font-bold">Latest Games & Apps</h2>
        <span className="text-sm">New Games and Apps For You</span>
      </div>

      <div className="relative mt-4">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-4 py-2 rounded bg-red-800 text-white"
        >
          Categories
        </button>
        {showDropdown && (
          <div className="absolute mt-2 bg-zinc-800 shadow rounded w-40 z-10">
            <button
              onClick={() => {
                setSelectedCategory("all");
                setShowDropdown(false);
              }}
              className="block w-full text-left px-4 py-2 hover:bg-zinc-700"
            >
              All
            </button>
            <button
              onClick={() => {
                setSelectedCategory("game");
                setShowDropdown(false);
              }}
              className="block w-full text-left px-4 py-2 hover:bg-zinc-700"
            >
              Game
            </button>
            <button
              onClick={() => {
                setSelectedCategory("aplikasi");
                setShowDropdown(false);
              }}
              className="block w-full text-left px-4 py-2 hover:bg-zinc-700"
            >
              Aplikasi
            </button>
          </div>
        )}
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
                  <span className="text-xs bg-red-800 pl-3 pr-3 rounded-lg">
                    Latest
                  </span>
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
