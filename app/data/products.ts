// app/data/products.ts

export interface DownloadButton {
  label: string;
  title: string;
  link: string;
}

export interface Media {
  video?: string;       // URL video (misalnya: mp4) atau "none"
  photos?: string[];    // Array URL foto atau "none"
}

export interface Product {
  id: number;
  slug: string;
  category: "Aki Motor" | "Aki Mobil";
  title: string;
  subtitle: string;
  image: string;
  description: string;
  price: string;
  beliSekarang: string; //ubah fungsi ini
  downloadButtons?: DownloadButton[];
  media?: Media;
}

export const products: Product[] = [
  {
    id: 4,
    slug: "Aki-Motor-Heybatt-GTZ-5S",
    category: "Aki Motor",
    title: "Aki Motor Heybatt GTZ 5S",
    subtitle: "Bukan hanya melayanin pengantian Aki, tapi kami juga melayanin untuk charger battery dengan cepat dan dengan harga terjangkau",
    image: "https://res.cloudinary.com/djbum58xh/image/upload/v1744789955/Aki-Heybatt-Garansi.png",
    description:
      "Aki Motor Heybatt menyediakan berbagai aplikasi kreatif untuk desain grafis, video editing, dan pembuatan konten digital.",
    price: " RP. 135.000 - 95.000",
    beliSekarang: "beli", //ubah fungsi ini
      downloadButtons: [
      {
        label: "Torrent",
        title: "Download",
        link: "https://res.cloudinary.com/dlv5ytn1a/raw/upload/fl_attachment/ojazcofkacibd4gskm1v.torrent",
      },
    ],
    media: {
      // Misalnya, Adobe tidak punya video, jadi bisa diisi "none" atau tidak disertakan
      video: "none",
      photos: [
        "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742392482/Image/App/Adobe%20Cloud%20Creative/y47eoe1e96rvioijs1va.jpg",
      ],
    },
  },
  {
    id: 3,
    slug: "Aki-Mobil-Heybatt",
    category: "Aki Mobil",
    title: "Aki Mobil Heybatt",
    subtitle: "Aki Mobil Heybatt, pilihan terbaik untuk kendaraan anda, dengan harga yang bersahabat dan tenaga yang teruji kuat, cocok untuk anda",
    image: "https://res.cloudinary.com/djbum58xh/image/upload/v1744830101/Heybatt_guhprh.jpg",
    description:
      "Microsoft Office adalah paket aplikasi produktivitas yang meliputi Word, Excel, PowerPoint, dan lain-lain untuk kebutuhan bisnis dan pendidikan.",
      price: "860.000 - 425.000",
      beliSekarang: "beli", //ubah fungsi ini
      downloadButtons: [
      {
        label: "Ranoz.gg",
        title: "Download",
        link: "https://ranoz.gg/file/yxzBQqbq",
      },
    ],
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
