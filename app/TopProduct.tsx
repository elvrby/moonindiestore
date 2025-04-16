"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { products, Product } from "./data/TopProductData";

const TopProductComponent: React.FC = () => {
  const [selectedCategory] = useState<"all" | "game" | "aplikasi">("all");
  const [] = useState(false);

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((item: Product) => item.category === selectedCategory);

  return (

    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-5">
        {filteredProducts.map((product: Product) => (
          <Link key={product.id} href={`/product/${product.slug}`}>
            <div className="bg-zinc-800 rounded-2xl shadowH cursor-pointer">
              <div className="relative h-40 w-full">
                <Image
                  className="rounded-t-2xl"
                  src={product.image}
                  alt={`Gambar ${product.title}`}
                  fill
                  style={{ objectFit: "cover", objectPosition: "center" }}
                />
              </div>
              <div className="p-3 pt-0">
                <div className="flex items-center justify-between mb-2">
                    <svg className='fill-zinc-500 w-6' height="56.693px" id="Layer_1" version="1.1" viewBox="0 0 56.693 56.693" width="56.693px" xmlns="http://www.w3.org/2000/svg"><g><path d="M3.765,46.362l19.836,2.873V30.257H3.765V46.362z M3.765,27.546h19.836V8.566L3.765,11.439V27.546z M26.312,49.628   l26.616,3.855V30.257H26.312V49.628z M26.312,8.172v19.374h26.616V4.319L26.312,8.172z"/></g></svg>
                    <span className="text-xs bg-red-800 pl-3 pr-3 rounded-lg">
                        Trends
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

export default TopProductComponent;
