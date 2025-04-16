import Image from "next/image";
import { products, Product } from "../../data/products";
import CommentsSection from "@/app/components/CommentsSection";
import PageViewCounter from "@/app/components/PageViewCounter";
import SidebarComponent from "@/app/sidebar";
import MobileComponent from "@/app/components/addons/mobileheader";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Fungsi untuk mengonversi URL YouTube ke URL embed
function convertYoutubeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.includes("youtu.be")) {
      const videoId = parsedUrl.pathname.slice(1);
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (parsedUrl.hostname.includes("youtube.com")) {
      const videoId = parsedUrl.searchParams.get("v");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    return url;
  } catch (error) {
    return url;
  }
}

export default async function ProductPage({ params }: PageProps) {
  // Unwrap params menggunakan await
  const { slug } = await params;
  const product: Product | undefined = products.find((p) => p.slug === slug);

  if (!product) {
    return <div className="text-center mt-10">Product not found</div>;
  }

  // Filter downloadButtons yang memiliki link valid (tidak "none")
  const validDownloadButtons =
    product.downloadButtons?.filter(
      (btn) => btn.link && btn.link.toLowerCase() !== "none"
    ) || [];

  return (
    <div className="flex flex-col md:flex-row">
      {/* Sidebar: hanya tampil di desktop dan berada di sebelah kiri */}
      <div className="hidden md:block md:order-1 md:w-72">
        <SidebarComponent />
      </div>

      <div className="">
        <MobileComponent/>
      </div>

      {/* Media: tampil di atas pada mobile (order-1) dan di kanan pada desktop (order-3) */}
      <div className="order-1 w-full p-5 md:order-3 md:w-2/5">
        <div className="space-y-4">
          {/* Video */}
          {product.media &&
            product.media.video &&
            product.media.video.toLowerCase() !== "none" && (
              <div className="w-full h-96 mb-4">
                {product.media.video.includes("youtube") ||
                product.media.video.includes("youtu.be") ? (
                  <iframe
                    src={convertYoutubeUrl(product.media.video)}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full object-cover rounded-lg"
                  ></iframe>
                ) : (
                  <video
                    src={product.media.video}
                    controls
                    className="w-full h-full object-cover rounded-lg"
                  />
                )}
              </div>
            )}

          {/* Grid Foto */}
          {product.media &&
            product.media.photos &&
            product.media.photos.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {product.media.photos.map(
                  (photo, idx) =>
                    photo.toLowerCase() !== "none" && (
                      <div key={idx} className="relative w-full h-40">
                        <Image
                          src={photo}
                          alt={`${product.title} photo ${idx + 1}`}
                          fill
                          style={{
                            objectFit: "cover",
                            objectPosition: "center",
                          }}
                          className="rounded-lg"
                        />
                      </div>
                    )
                )}
              </div>
            )}
        </div>
      </div>

      {/* Konten Utama: tampil di tengah pada desktop (order-2) */}
      <div className="order-2 w-full md:flex-1 p-4">
        <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
        <p className="text-lg">{product.description}</p>

        {/* Tombol Download */}
        {validDownloadButtons.length > 0 && (
          <div className="mt-4 space-y-4">
            {validDownloadButtons.map((btn, index) => (
              <div key={index} className="flex items-center space-x-4">
                <span className="text-lg font-medium">{btn.label}</span>
                <a href={btn.link} target="_blank" rel="noopener noreferrer">
                  <button className="p-5 pb-1 pt-1 rounded-2xl bg-red-700 text-white">
                    {btn.title}
                  </button>
                </a>
              </div>
            ))}
          </div>
        )}

        <PageViewCounter slug={product.slug} />
        <CommentsSection productSlug={product.slug} />
      </div>
    </div>
  );
}
