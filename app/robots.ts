// app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    // Aturan robots.txt: izinkan semua user-agent untuk mengakses seluruh situs
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    
  };
}
