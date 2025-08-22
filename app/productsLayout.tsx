// src/app/components/products/ProductsLayout.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import { useEffect, useMemo, useState } from "react";

import { products, type Product } from "@/app/data/products";
import Checkout from "@/app/components/addons/checkout";
import AddressMenu from "@/app/components/addons/addressmenu";
import type { ShippingAddress } from "@/app/data/locations";

import { useUserSession } from "@/hooks/use-user-session";
import {
  addToCart,
  addProductToFavorites,
  removeProductFromFavorites,
  signInWithGoogle, // Promise<string | null>
} from "@/libs/firebase/auth";

import { getAuth } from "firebase/auth";
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { firebaseFirestore } from "@/libs/firebase/config";

const inter = Inter({ subsets: ["latin"] });

type Category = "semua" | "Aki Motor" | "Aki Mobil";

type CartItem = {
  productId: string;
  quantity: number;
};

// === Snap Types ===
type SnapCallbacks = {
  onSuccess?: (result: unknown) => void;
  onPending?: (result: unknown) => void;
  onError?: (result: unknown) => void;
  onClose?: () => void;
};
type SnapAPI = { pay: (token: string, callbacks?: SnapCallbacks) => void };
type SnapWindow = Window & { snap?: SnapAPI };

const NewProductComponent: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category>("semua");

  // === Checkout overlay state (menggantikan ProductPopup) ===
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // uid dari sesi user (string | null)
  const userUid = useUserSession(null) ?? null;
  // UID efektif (ambil dari hook atau dari auth.currentUser saat sudah signin)
  const effectiveUid = userUid ?? getAuth().currentUser?.uid ?? null;

  // Favorit lokal (untuk toggle instan di UI)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Address state untuk Checkout
  const [address, setAddress] = useState<ShippingAddress | null>(null);
  const hasAddress = !!(address && address.city && address.kecamatan && address.kelurahan && address.postalCode);
  const [openAddressModal, setOpenAddressModal] = useState(false);

  // Status pembayaran (modals)
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [showError, setShowError] = useState<{ open: boolean; message?: string }>({ open: false });
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Realtime sync favorites + address dari Firestore (gunakan UID yang sudah pasti string)
  useEffect(() => {
    if (!effectiveUid) {
      setFavoriteIds(new Set());
      setAddress(null);
      return;
    }
    const ref = doc(firebaseFirestore, "users", effectiveUid!);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setFavoriteIds(new Set());
        setAddress(null);
        return;
      }
      const data = snap.data() as { favorites?: string[]; shippingAddress?: ShippingAddress | null };
      const favs = Array.isArray(data?.favorites) ? data.favorites : [];
      setFavoriteIds(new Set(favs.map(String)));
      setAddress(data?.shippingAddress ?? null);
    });
    return () => unsub();
  }, [effectiveUid]);

  // Load Midtrans Snap
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    if (typeof window === "undefined" || !key) return;
    const w = window as SnapWindow;
    if (w.snap) return;
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", key);
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const ensureUid = async (): Promise<string | null> => {
    if (effectiveUid) return effectiveUid;
    const uid = await signInWithGoogle();
    return uid ?? null;
  };

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) map.set(String(p.id), p);
    return map;
  }, []);

  const handleBuyClick = async (productId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const uid = await ensureUid();
    if (!uid) return;
    setSelectedProductId(productId);
    setShowCheckout(true);
  };

  const handleAddToCart = async (productId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const uid = await ensureUid();
      if (!uid) return;
      await addToCart(uid, { productId: String(productId), quantity: 1 });
      // TODO: toast sukses
    } catch (err) {
      console.error("Failed to add to cart", err);
    }
  };

  const handleToggleFavorite = async (productId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const uid = await ensureUid();
      if (!uid) return;

      const pid = String(productId);
      const isFav = favoriteIds.has(pid);

      // Optimistic update
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(pid);
        else next.add(pid);
        return next;
      });

      if (isFav) {
        await removeProductFromFavorites(uid, pid);
      } else {
        await addProductToFavorites(uid, pid);
      }
    } catch (err) {
      console.error("Failed to toggle favorite", err);
    }
  };

  // === Konfirmasi bayar dari Checkout ===
  const handleConfirmPay = async ({
    city,
    shipping,
    quantities,
    totalPrice,
    selectedIds,
  }: {
    city: string;
    shipping: string;
    quantities: Record<string, number>;
    totalPrice: number;
    selectedIds: string[];
  }) => {
    try {
      // Pastikan user terlogin
      let authUser = getAuth().currentUser;
      if (!authUser) {
        const uid = await ensureUid();
        if (!uid) {
          setShowError({ open: true, message: "Silakan login terlebih dahulu." });
          return;
        }
        authUser = getAuth().currentUser;
      }
      if (!authUser) {
        setShowError({ open: true, message: "Gagal mendapatkan sesi pengguna." });
        return;
      }

      if (!hasAddress) {
        setShowError({ open: true, message: "Alamat penerima belum diisi. Silakan isi alamat penerima." });
        return;
      }

      const uid = authUser.uid;
      const username = authUser.displayName || "Tanpa Nama";
      const email = authUser.email || "Tanpa Email";

      const newOrderId = `order-${Date.now()}`;
      setOrderId(newOrderId);

      // Minta token Snap
      const resp = await fetch("/api/midtrans/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalPrice, orderId: newOrderId }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.token) {
        setShowError({ open: true, message: data?.error || "Gagal membuat transaksi." });
        return;
      }

      // Siapkan items (hanya produk terpilih)
      const itemsPayload = selectedIds.map((pid) => {
        const p = productById.get(pid);
        const price = p
          ? (() => {
              const parts = p.price.split("-");
              const value = parts[parts.length - 1].trim().replace(/[^\d]/g, "");
              return parseInt(value, 10);
            })()
          : 0;
        return {
          productId: pid,
          productTitle: p?.title || "",
          quantity: quantities[pid] ?? 1,
          pricePerItem: price,
          image: p?.image || "/placeholder.png",
        };
      });

      // Simpan order awal
      await setDoc(doc(firebaseFirestore, "orders", newOrderId), {
        orderId: newOrderId,
        userUid: uid,
        username,
        email,
        items: itemsPayload,
        totalPrice,
        shipping,
        city,
        shippingAddress: { ...address! },
        createdAt: new Date(),
        status: "created",
        snapToken: data.token,
        midtransOrderId: newOrderId,
        midtransOrderIds: [newOrderId],
      });

      // Tambah orderId di user profile
      await setDoc(doc(firebaseFirestore, "users", uid), { orderIds: arrayUnion(newOrderId), lastOrderAt: serverTimestamp() }, { merge: true });

      // Bayar via Snap
      const w = window as SnapWindow;
      if (!w.snap) {
        setShowError({ open: true, message: "Snap JS belum dimuat." });
        return;
      }

      setShowCheckout(false);

      w.snap.pay(data.token, {
        onSuccess: async (result) => {
          setPaymentResult(result);
          try {
            await updateDoc(doc(firebaseFirestore, "orders", newOrderId), {
              status: "success",
              paidAt: new Date(),
              midtrans: result,
            });
            await updateDoc(doc(firebaseFirestore, "users", uid), {
              [`ordersStatus.${newOrderId}`]: "success",
              lastOrderAt: serverTimestamp(),
            });
          } catch {}
          setShowSuccess(true);
        },
        onPending: async (result) => {
          setPaymentResult(result);
          try {
            await updateDoc(doc(firebaseFirestore, "orders", newOrderId), { status: "pending", midtrans: result });
            await updateDoc(doc(firebaseFirestore, "users", uid), {
              [`ordersStatus.${newOrderId}`]: "pending",
              lastOrderAt: serverTimestamp(),
            });
          } catch {}
          setShowPending(true);
        },
        onError: async (result) => {
          try {
            await updateDoc(doc(firebaseFirestore, "orders", newOrderId), {
              status: "error",
              errorAt: new Date(),
              midtrans: result,
            });
            await updateDoc(doc(firebaseFirestore, "users", uid), {
              [`ordersStatus.${newOrderId}`]: "error",
              lastOrderAt: serverTimestamp(),
            });
          } catch {}
          setShowError({ open: true, message: "Terjadi kesalahan pembayaran." });
        },
        onClose: () => {},
      });
    } catch (err) {
      console.error("Error saat memulai pembayaran:", err);
      setShowError({ open: true, message: "Terjadi kesalahan. Silakan coba lagi." });
    }
  };

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "semua") return products;
    return products.filter((item: Product) => item.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="min-h-screen text-white px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-800/30 rounded-full mb-4">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-red-400 tracking-wider uppercase">Our Products</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-4">Products</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Discover our premium collection of high-quality batteries for your vehicle needs</p>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-1.5">
            {["semua", "Aki Motor", "Aki Mobil"].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category as Category)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 relative overflow-hidden group ${
                  selectedCategory === category ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                {selectedCategory === category && <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 rounded-xl" />}
                <span className="relative z-10">{category === "semua" ? "All Products" : category}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className={`grid gap-4 sm:gap-6 ${inter.className}`} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {filteredProducts.map((product) => {
            const isFav = favoriteIds.has(String(product.id));
            return (
              <Link key={product.id} href={`/product/${product.slug}`}>
                <div className="group bg-gradient-to-br from-gray-900/80 to-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-3xl overflow-hidden hover:border-gray-700/50 transition-all duration-500 hover:shadow-2xl hover:shadow-red-600/10 hover:-translate-y-2 h-full flex flex-col">
                  {/* Image */}
                  <div className="relative h-48 sm:h-52 md:h-56 overflow-hidden flex-shrink-0">
                    <Image
                      className="transition-transform duration-700 group-hover:scale-110"
                      src={product.image}
                      alt={`Gambar ${product.title}`}
                      fill
                      style={{ objectFit: "cover", objectPosition: "center" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-red-600/90 backdrop-blur-sm text-white text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-red-500/30">
                      NEW
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-5 md:p-6 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg sm:text-xl mb-2 text-white group-hover:text-red-400 transition-colors duration-300 line-clamp-2">{product.title}</h3>

                    <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed flex-grow min-h-[2.5rem]">{product.subtitle}</p>

                    {/* Price */}
                    <div className="mb-4 sm:mb-6">
                      {product.price.includes(" - ") ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-gray-500 line-through text-sm">RP. {product.price.split(" - ")[0].replace("RP.", "").trim()}</span>
                          <span className="text-red-400 font-bold text-lg">{product.price.split(" - ")[1]}</span>
                        </div>
                      ) : (
                        <span className="text-red-400 font-bold text-lg">{product.price}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:gap-3 mt-auto">
                      <button
                        onClick={(e) => handleBuyClick(product.id, e)}
                        className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-600/25 text-sm sm:text-base"
                      >
                        Buy Now
                      </button>

                      {/* Cart */}
                      <button
                        onClick={(e) => handleAddToCart(product.id, e)}
                        title="Add to cart"
                        className="group/btn p-2.5 sm:p-3 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-gray-600/50 rounded-xl transition-all duration-300 hover:scale-110 flex-shrink-0"
                      >
                        <svg width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M7.69195 4.10526H8.72184V2.6H10.1379V1.50526H8.72184V0H7.69195V1.50526H6.27586V2.6H7.69195V4.10526ZM12.7126 1.36842V5.13158L4.63448 6.65053L3.05747 0H0.643678C0.472964 0 0.309242 0.0720862 0.188529 0.200401C0.0678159 0.328715 0 0.502747 0 0.684211C0 0.865674 0.0678159 1.03971 0.188529 1.16802C0.309242 1.29633 0.472964 1.36842 0.643678 1.36842H2.07264L4.15172 10.2632H12.7126V8.89474H5.15586L4.94345 7.98474L14 6.28105V1.36842H12.7126ZM4.34483 10.9474C4.15387 10.9474 3.96719 11.0076 3.80842 11.1203C3.64964 11.2331 3.52588 11.3934 3.45281 11.5809C3.37973 11.7685 3.36061 11.9748 3.39786 12.1739C3.43512 12.373 3.52707 12.5559 3.6621 12.6994C3.79713 12.8429 3.96917 12.9407 4.15646 12.9803C4.34376 13.0199 4.53789 12.9996 4.71432 12.9219C4.89074 12.8442 5.04153 12.7127 5.14763 12.5439C5.25372 12.3751 5.31035 12.1767 5.31035 11.9737C5.31035 11.7015 5.20862 11.4404 5.02755 11.248C4.84648 11.0555 4.6009 10.9474 4.34483 10.9474ZM12.069 10.9474C11.878 10.9474 11.6913 11.0076 11.5326 11.1203C11.3738 11.2331 11.25 11.3934 11.1769 11.5809C11.1039 11.7685 11.0847 11.9748 11.122 12.1739C11.1593 12.373 11.2512 12.5559 11.3862 12.6994C11.5213 12.8429 11.6933 12.9407 11.8806 12.9803C12.0679 13.0199 12.262 12.9996 12.4385 12.9219C12.6149 12.8442 12.7657 12.7127 12.8718 12.5439C12.9779 12.3751 13.0345 12.1767 13.0345 11.9737C13.0345 11.7015 12.9328 11.4404 12.7517 11.248C12.5706 11.0555 12.325 10.9474 12.069 10.9474Z"
                            className="fill-gray-400 group-hover/btn:fill-white transition-colors duration-300"
                          />
                        </svg>
                      </button>

                      {/* Favorite */}
                      <button
                        onClick={(e) => handleToggleFavorite(product.id, e)}
                        title={isFav ? "Remove from favorites" : "Add to favorites"}
                        className={`group/btn p-2.5 sm:p-3 ${
                          isFav ? "bg-red-600/20 border-red-500/40" : "bg-gray-800/50 border-gray-700/50"
                        } hover:bg-red-600/20 border hover:border-red-600/40 rounded-xl transition-all duration-300 hover:scale-110 flex-shrink-0`}
                      >
                        <svg width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 14 13" fill={isFav ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M6.99999 12.2644L1.47143 6.29809L1.47042 6.29701C0.191283 4.92477 0.163482 2.82443 1.46565 1.46582C2.10159 0.802359 2.94522 0.516261 3.81334 0.516261C4.67984 0.516261 5.52184 0.801315 6.15768 1.46234L6.63208 1.97782L6.99999 2.37758L7.36789 1.97782L7.83862 1.46634C9.13597 0.176775 11.2421 0.177886 12.538 1.46968C13.8364 2.82843 13.8076 4.92609 12.5296 6.29699L12.5285 6.29809L6.99999 12.2644Z"
                            className={isFav ? "stroke-red-400 text-red-400" : "stroke-gray-400 group-hover/btn:stroke-red-400"}
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-red-600/0 via-red-600/5 to-red-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Products Found</h3>
            <p className="text-gray-500">Try selecting a different category</p>
          </div>
        )}
      </div>

      {/* === CHECKOUT OVERLAY (menggantikan ProductPopup) === */}
      {showCheckout && selectedProductId && (
        <div className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm animate-fadeIn overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-8" aria-modal="true" role="dialog">
          {/* Card checkout tidak full-screen di mobile */}
          <div className="mx-auto w-full max-w-md sm:max-w-3xl my-2 sm:my-6 rounded-2xl shadow-2xl animate-slideUp">
            <Checkout
              items={[{ productId: String(selectedProductId), quantity: 1 }]}
              productById={productById}
              onClose={() => setShowCheckout(false)}
              onConfirmPay={handleConfirmPay}
              shippingAddress={hasAddress ? address : null}
              onEditAddress={() => setOpenAddressModal(true)}
            />
          </div>

          <style jsx>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            .animate-fadeIn {
              animation: fadeIn 0.2s ease-out;
            }

            @keyframes slideUp {
              from {
                transform: translateY(16px) scale(0.98);
                opacity: 0.92;
              }
              to {
                transform: translateY(0) scale(1);
                opacity: 1;
              }
            }
            .animate-slideUp {
              animation: slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
          `}</style>
        </div>
      )}

      {/* Address Menu (hanya render jika sudah ada UID string) */}
      {effectiveUid && (
        <AddressMenu open={openAddressModal} initial={hasAddress ? address : null} userUid={effectiveUid!} onClose={() => setOpenAddressModal(false)} onSaved={(addr) => setAddress(addr)} />
      )}

      {/* Success / Pending / Error Modals */}
      {showSuccess && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-black">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Pembayaran Berhasil</h3>
            {(paymentResult?.order_id || orderId) && (
              <div className="bg-gray-50 rounded-xl p-3 text-sm mb-4">
                <div className="flex justify-between">
                  <span>ID Pesanan</span>
                  <span className="font-medium">{paymentResult?.order_id || orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="font-medium capitalize">{paymentResult?.transaction_status || "success"}</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowSuccess(false)} className="w-full py-3 rounded-xl border border-gray-300 hover:bg-gray-50 font-medium">
                Tutup
              </button>
              <Link href="/orders" className="w-full py-3 rounded-xl bg-black text-white hover:bg-gray-800 font-semibold text-center">
                Lihat Pesanan
              </Link>
            </div>
          </div>
        </div>
      )}

      {showPending && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mx-auto mb-4">
              <span className="text-3xl">⏳</span>
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Menunggu Pembayaran</h3>
            {(paymentResult?.order_id || orderId) && (
              <div className="bg-gray-50 rounded-xl p-3 text-sm mb-4">
                <div className="flex justify-between">
                  <span>ID Pesanan</span>
                  <span className="font-medium">{paymentResult?.order_id || orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="font-medium capitalize">{paymentResult?.transaction_status || "pending"}</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowPending(false)} className="w-full py-3 rounded-xl border border-gray-300 hover:bg-gray-50 font-medium">
                Nanti Saja
              </button>
              <Link href="/orders" className="w-full py-3 rounded-xl bg-black text-white hover:bg-gray-800 font-semibold text-center">
                Lihat Pesanan
              </Link>
            </div>
          </div>
        </div>
      )}

      {showError.open && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Pembayaran Gagal</h3>
            <p className="text-gray-600 text-center mb-4">{showError.message || "Terjadi kesalahan saat memproses pembayaran."}</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowError({ open: false })} className="w-full py-3 rounded-xl border border-gray-300 hover:bg-gray-50 font-medium">
                Tutup
              </button>
              <button onClick={() => setShowCheckout(true)} className="w-full py-3 rounded-xl bg-black text-white hover:bg-gray-800 font-semibold">
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewProductComponent;
