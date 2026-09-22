// app/data/products.ts

export interface Media {
  video?: string; // URL video (misalnya: mp4) atau "none"
  photos?: string[]; // Array URL foto
}

export interface Product {
  id: number;
  slug: string;
  category: "Banner" | "Sablon" | "Lanyard" | "Sticker";
  title: string;
  subtitle: string;
  image: string;
  description: string;
  price: string;
  beliSekarang: string; // tetap sama
  beratGram: number; // NEW: berat barang dalam gram
  media?: Media;
}

export const products: Product[] = [
    {
    id: 5,
    slug: "Banner",
    category: "Banner",
    title: "Banner",
    subtitle: "Banner custom untuk keperluan promosi dan iklan",
    image: "/Images/banner.jpeg",
    description: "Aki Motor Heybatt menyediakan berbagai aplikasi kreatif untuk desain grafis, video editing, dan pembuatan konten digital.",
    price: " RP. 25.000/M",
    beliSekarang: "beli",
    beratGram: 1500,
    media: {
      video: "none",
      photos: ["https://res.cloudinary.com/djbum58xh/image/upload/v1744789955/Aki-Heybatt-Garansi.png"],
    },
  },
  {
    id: 4,
    slug: "Sablon",
    category: "Sablon",
    title: "Sablon Baju",
    subtitle: "Bahan baju dan bahan sablon yan berkualitas tinggi, cocok untuk keperluan promosi, event, atau personalisasi pakaian.",
    image: "/Images/sablon.jpg",
    description: "Aki Motor Heybatt menyediakan berbagai aplikasi kreatif untuk desain grafis, video editing, dan pembuatan konten digital.",
    price: " RP. 40.000 sd 75.000",
    beliSekarang: "beli",
    beratGram: 1500,
    media: {
      video: "none",
      photos: ["https://res.cloudinary.com/djbum58xh/image/upload/v1744789955/Aki-Heybatt-Garansi.png"],
    },
  },
  {
    id: 3,
    slug: "Lanyard",
    category: "Lanyard",
    title: "Print Lanyard",
    subtitle: "Cetak lanyard untuk Identitas Perusahaan atau Event dengan berbagai pilihan bahan dan warna.",
    image: "/Images/lanyard.jpeg",
    description: "Microsoft Office adalah paket aplikasi produktivitas yang meliputi Word, Excel, PowerPoint, dan lain-lain untuk kebutuhan bisnis dan pendidikan.",
    price: "25.000/Pcs",
    beliSekarang: "beli",
    beratGram: 15000,
    media: {
      video: "none",
      photos: [
        "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742392480/Image/App/MSOffice/mo5oxei5tqff93by4iiv.jpg",
        "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742393342/Image/App/MSOffice/jldac1br6bfnr7cw1rza.png",
        "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742393343/Image/App/MSOffice/wpxtatirltr5eucobo8q.jpg",
        "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742393444/Image/App/MSOffice/htyn3b60xalp3trbg3x7.jpg",
      ],
    },
  },
  {
    id: 2,
    slug: "Sablon Jaket",
    category: "Sablon",
    title: "Sablon Jaket",
    subtitle: "Sablon jaket dengan metode DTF yang awet dan tahan lama.",
    image: "/Images/jaket.jpeg",
    description: "Microsoft Office adalah paket aplikasi produktivitas yang meliputi Word, Excel, PowerPoint, dan lain-lain untuk kebutuhan bisnis dan pendidikan.",
    price: "RP. 100.000 sd 150.000",
    beliSekarang: "beli",
    beratGram: 1800,
    media: {
      video: "none",
      photos: [
        "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742392480/Image/App/MSOffice/mo5oxei5tqff93by4iiv.jpg",
        "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742393342/Image/App/MSOffice/jldac1br6bfnr7cw1rza.png",
        "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742393343/Image/App/MSOffice/wpxtatirltr5eucobo8q.jpg",
        "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742393444/Image/App/MSOffice/htyn3b60xalp3trbg3x7.jpg",
      ],
    },
  },
  {
    id: 1,
    slug: "Sticker",
    category: "Sticker",
    title: "Sticker",
    subtitle: "Cetak stiker dengan berbagai macam pilihan bahan dan ukuran, cocok untuk keperluan promosi, dekorasi, atau personalisasi barang  ",
    image: "/Images/Sticker.jpeg",
    description: "Cetak stiker dengan berbagai macam pilihan bahan dan ukuran.",
    price: "RP. 20.000/Lbr",
    beliSekarang: "beli",
    beratGram: 1500,
    media: {
      video: "none",
      photos: [
        "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742392480/Image/App/MSOffice/mo5oxei5tqff93by4iiv.jpg",
        "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742393342/Image/App/MSOffice/jldac1br6bfnr7cw1rza.png",
        "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742393343/Image/App/MSOffice/wpxtatirltr5eucobo8q.jpg",
        "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742393444/Image/App/MSOffice/htyn3b60xalp3trbg3x7.jpg",
      ],
    },
  },
];
