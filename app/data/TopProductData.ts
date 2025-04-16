// app/data/products.ts
export interface Product {
    id: number;
    slug: string;
    category: "game" | "aplikasi";
    title: string;
    subtitle: string;
    image: string;
    description: string;
  }
  
  export const products: Product[] = [
    {
      id: 1,
      slug: "grand-theft-auto-v",
      category: "game",
      title: "Grand Theft Auto V",
      subtitle: "Action Story RPG",
      image: "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742383622/Image/Game/GTA5/hihszbxmnjxyt5wgcjax.jpg",
      description:
        "Grand Theft Auto V adalah game aksi yang menawarkan dunia terbuka dengan cerita mendalam dan gameplay yang seru.",
    },
    {
      id: 2,
      slug: "elden-ring-nighrein",
      category: "game",
      title: "Elden Ring: NIGHTREIN",
      subtitle: "Action Exploration RPG",
      image: "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742391214/Image/Game/ELDENRING:NIGHTREIN/y4wirmzdlfqag2f6eopl.png",
      description:
        "Elden Ring: NIGHTREIN adalah game RPG aksi dengan dunia yang luas, penuh tantangan, dan eksplorasi yang menarik.",
    },
    {
      id: 3,
      slug: "microsoft-office",
      category: "aplikasi",
      title: "Microsoft Office",
      subtitle: "Applications",
      image: "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742392480/Image/App/MSOffice/mo5oxei5tqff93by4iiv.jpg",
      description:
        "Microsoft Office adalah paket aplikasi produktivitas yang meliputi Word, Excel, PowerPoint, dan lain-lain untuk kebutuhan bisnis dan pendidikan.",
    },
    {
      id: 4,
      slug: "adobe-creative-clouds",
      category: "aplikasi",
      title: "Adobe Creative Clouds",
      subtitle: "Applications",
      image: "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742392482/Image/App/Adobe%20Cloud%20Creative/y47eoe1e96rvioijs1va.jpg",
      description:
        "Adobe Creative Clouds menyediakan berbagai aplikasi kreatif untuk desain grafis, video editing, dan pembuatan konten digital.",
    },
    
  ];
  