"use client";
import { useState, useEffect } from "react";
import { db } from "../../src/lib/firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  onSnapshot
} from "firebase/firestore";

interface PageViewCounterProps {
  slug: string;
}

const PageViewCounter: React.FC<PageViewCounterProps> = ({ slug }) => {
  const [views, setViews] = useState<number>(0);

  useEffect(() => {
    // Dapatkan referensi dokumen di koleksi "pageViews" dengan id sesuai slug
    const docRef = doc(db, "pageViews", slug);

    // Subscribe untuk mendapatkan update real-time terhadap view count
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setViews(docSnap.data().views);
      } else {
        setViews(0);
      }
    });

    // Pada load halaman, cek apakah dokumen sudah ada
    // Jika ada, update dengan increment(1); jika belum ada, buat dokumen baru dengan views = 1
    getDoc(docRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          updateDoc(docRef, { views: increment(1) });
        } else {
          setDoc(docRef, { views: 1 });
        }
      })
      .catch((error) => {
        console.error("Error updating view count:", error);
      });

    return () => unsubscribe();
  }, [slug]);

  return (
    <div className="mt-4 text-sm text-gray-600">
      Total Views: {views}
    </div>
  );
};

export default PageViewCounter;
