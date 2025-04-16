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
  category: "game" | "aplikasi";
  title: string;
  subtitle: string;
  image: string;
  description: string;
  downloadButtons?: DownloadButton[];
  media?: Media;
}

export const products: Product[] = [
  {
    id: 4,
    slug: "adobe-creative-clouds",
    category: "aplikasi",
    title: "Adobe Creative Clouds",
    subtitle: "Applications",
    image: "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742392482/Image/App/Adobe%20Cloud%20Creative/y47eoe1e96rvioijs1va.jpg",
    description:
      "Adobe Creative Clouds menyediakan berbagai aplikasi kreatif untuk desain grafis, video editing, dan pembuatan konten digital.",
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
    slug: "microsoft-office",
    category: "aplikasi",
    title: "Microsoft Office",
    subtitle: "Applications",
    image: "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742392480/Image/App/MSOffice/mo5oxei5tqff93by4iiv.jpg",
    description:
      "Microsoft Office adalah paket aplikasi produktivitas yang meliputi Word, Excel, PowerPoint, dan lain-lain untuk kebutuhan bisnis dan pendidikan.",
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
  {
    id: 2,
    slug: "elden-ring-nighrein",
    category: "game",
    title: "Elden Ring: NIGHTREIN",
    subtitle: "Action Exploration RPG",
    image: "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742391214/Image/Game/ELDENRING:NIGHTREIN/y4wirmzdlfqag2f6eopl.png",
    description:
      "Elden Ring: NIGHTREIN adalah game RPG aksi dengan dunia yang luas, penuh tantangan, dan eksplorasi yang menarik.",
    downloadButtons: [
      {
        label: "Official Elden Site",
        title: "Download",
        link: "https://download-link.com/elden-ring",
      },
    ],
    media: {
      video: "https://example.com/videos/eldenring.mp4", // URL video
      photos: [
        "/IMG/EldenRing-1.png",
        "/IMG/EldenRing-3.png",
        "/IMG/EldenRing-4.png",
        "/IMG/EldenRing-5.png",
      ],
    },
  },
  {
    id: 1,
    slug: "grand-theft-auto-v",
    category: "game",
    title: "Grand Theft Auto V Enhanced",
    subtitle: "Action Story RPG",
    image: "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742383622/Image/Game/GTA5/hihszbxmnjxyt5wgcjax.jpg",
    description:
      "Grand Theft Auto V adalah game aksi yang menawarkan dunia terbuka dengan cerita mendalam dan gameplay yang seru.",
    downloadButtons: [
      {
        label: "Datanodes",
        title: "Download",
        link: "https://datanodes.to/cc7dakefxy6u/Grand-Theft-Auto-V-Enhanced.rar",
      },
      {
        label: "1Fichier",
        title: "Download",
        link: "https://1fichier.com/?jw9ke74i34b1c1r20yjv",
      },
    ],
    media: {
      video: "https://www.youtube.com/watch?v=QkkoHAzjnUs",
      photos: [
        "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742383891/Image/Game/GTA5/gqacyamkiz05wkosbaqk.png",
        "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742383886/Image/Game/GTA5/qws7gqriqhrce7x7wiwq.png",
        "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742383885/Image/Game/GTA5/lhjc5ibo3px2vislq5ki.png",
        "https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742383890/Image/Game/GTA5/n3xoreivixukun5exrdk.png",
      ],
    },
  },
];
