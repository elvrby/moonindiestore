// File: app/favorites/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { useUserSession } from "@/hooks/use-user-session";
import { firebaseFirestore } from "@/libs/firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import { removeProductFromFavorites, signInWithGoogle } from "@/libs/firebase/auth";
import HeaderComponent from "@/app/components/layout/header";

// SESUAIKAN path ini dengan lokasi data produk kamu
import { products, type Product } from "../../data/products";

type FavoriteEntry = string; // productId disimpan sebagai string

/* ---------- Modal Konfirmasi ---------- */
function ConfirmModal({ open, title, onConfirm, onCancel }: { open: boolean; title?: string; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white">Hapus dari favorite?</h3>
        <p className="text-sm text-gray-300 mt-2">
          Apakah anda yakin ingin menghapus <span className="font-medium text-white">{title ?? "produk ini"}</span> dari favorite anda?
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-white/20 text-gray-200 hover:bg-white/10 transition">
            Batal
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition">
            Iya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

const FavoritesPage: React.FC = () => {
  // pastikan tipe menjadi string | null (tidak undefined)
  const rawUid = useUserSession(null);
  const userUid: string | null = rawUid ?? null;

  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // state untuk konfirmasi hapus
  const [confirmPid, setConfirmPid] = useState<string | null>(null);

  // Map productId -> product untuk lookup cepat
  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) map.set(String(p.id), p);
    return map;
  }, []);

  // Subscribe realtime ke favorites user
  useEffect(() => {
    if (!userUid) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = doc(firebaseFirestore, "users", userUid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data() as { favorites?: string[] } | undefined;
        const favs = Array.isArray(data?.favorites) ? data!.favorites! : [];
        setFavorites(favs.map(String));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [userUid]);

  const ensureUid = async (): Promise<string | null> => {
    if (userUid) return userUid;
    const uid = await signInWithGoogle();
    return uid ?? null;
  };

  const openConfirm = async (pid: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const uid = await ensureUid();
    if (!uid) return;
    setConfirmPid(pid);
  };

  const handleConfirmRemove = async () => {
    if (!confirmPid) return;
    const uid = await ensureUid();
    if (!uid) return;

    try {
      // Optimistic update
      setFavorites((prev) => prev.filter((id) => id !== confirmPid));
      await removeProductFromFavorites(uid, confirmPid);
    } catch (err) {
      console.error("Failed to remove favorite", err);
    } finally {
      setConfirmPid(null);
    }
  };

  const handleCancelRemove = () => setConfirmPid(null);

  // Produk hasil favorit (skip jika id tidak ditemukan di dataset)
  const favoriteProducts = useMemo(() => favorites.map((pid) => productById.get(pid)).filter(Boolean) as Product[], [favorites, productById]);

  if (!userUid) {
    return (
      <main className="min-h-screen px-4 py-12 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Favorites</h1>
          <p className="text-gray-400 mb-6">Silakan login terlebih dahulu untuk melihat produk favorite kamu.</p>
          <Link href="/" className="inline-block bg-red-600 hover:bg-red-700 transition-colors px-5 py-2 rounded-xl font-semibold">
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10 text-white">
      <div className="max-w-7xl mx-auto">
        <HeaderComponent></HeaderComponent>
        <header className="mb-8">
          <h1 className="text-4xl font-bold">Favorites</h1>
          <p className="text-gray-400 mt-2">Produk yang kamu tandai sebagai favorit</p>
        </header>

        {loading ? (
          <ul className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-center gap-4 rounded-2xl border border-gray-800/50 bg-gray-900/40 p-4">
                <div className="w-20 h-20 bg-gray-800/60 rounded-xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-1/2 bg-gray-800/60 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-800/60 rounded animate-pulse" />
                </div>
                <div className="w-10 h-10 bg-gray-800/60 rounded-full animate-pulse" />
              </li>
            ))}
          </ul>
        ) : favoriteProducts.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">belum ada product yang di favorite</h3>
            <p className="text-gray-500">Yuk telusuri produk dan tambahkan ke favoritmu!</p>
            <Link href="/products" className="inline-block mt-6 bg-red-600 hover:bg-red-700 transition-colors px-5 py-2 rounded-xl font-semibold">
              Lihat Produk
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {favoriteProducts.map((p) => {
              const priceHasRange = p.price.includes(" - ");
              const [oldPrice, newPrice] = priceHasRange ? p.price.split(" - ") : [null, null];

              return (
                <li key={p.id}>
                  <Link href={`/product/${p.slug}`} className="group flex items-center gap-4 rounded-2xl border border-gray-800/50 bg-gray-900/40 hover:border-gray-700/60 transition p-4">
                    {/* Gambar kecil & square di kiri */}
                    <Image src={p.image} alt={`Gambar ${p.title}`} width={96} height={96} className="rounded-xl object-cover aspect-square flex-shrink-0" />

                    {/* Detail produk di kanan */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-lg leading-tight truncate group-hover:text-red-400 transition-colors">{p.title}</h3>

                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{p.subtitle}</p>

                      <div className="mt-2 flex items-center gap-3 flex-wrap">
                        <span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">{p.category}</span>

                        <div className="text-sm">
                          {priceHasRange ? (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 line-through">RP. {oldPrice?.replace("RP.", "").trim()}</span>
                              <span className="text-red-400 font-semibold">{newPrice}</span>
                            </div>
                          ) : (
                            <span className="text-red-400 font-semibold">{p.price}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tombol hati (remove favorite) */}
                    <button aria-label="Hapus dari favorite" onClick={(e) => openConfirm(String(p.id), e)} className="ml-2 p-2 rounded-full hover:bg-white/10 transition">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-red-500" aria-hidden>
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 3.99 4 6.5 4c1.74 0 3.41 1.01 4.22 2.56C11.58 5.01 13.25 4 15 4 17.51 4 19.5 6 19.5 8.5c0 3.78-3.4 6.86-8.05 11.54L12 21.35z" />
                      </svg>
                    </button>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Modal Konfirmasi */}
      <ConfirmModal open={!!confirmPid} title={confirmPid ? productById.get(confirmPid)?.title : undefined} onConfirm={handleConfirmRemove} onCancel={handleCancelRemove} />
    </main>
  );
};

export default FavoritesPage;
