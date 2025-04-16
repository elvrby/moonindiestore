import { MetadataRoute } from "next";
import { products } from "./data/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  // URL halaman statis
  const staticUrls = [
    { url: `${baseUrl}/` },
    { url: `${baseUrl}/about` },
    { url: `${baseUrl}/contact` }
  ];

  // URL produk dinamis
  const productUrls = products.map((product) => ({
    url: `${baseUrl}/product/${product.slug}`
  }));

  return [...staticUrls, ...productUrls];
}
