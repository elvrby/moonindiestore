// app/cart/page.tsx
"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useUserSession } from "@/hooks/use-user-session";
import { getAuth } from "firebase/auth";
import { db } from "@/libs/firebase/config";
import { doc, getDoc, onSnapshot, setDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";

import { removeManyFromCart } from "@/libs/firebase/auth";
import { products, type Product } from "@/app/data/products";
import HeaderComponent from "@/app/components/layout/header";

// Komponen & tipe alamat
import AddressMenu from "@/app/components/addons/addressmenu";
import type { ShippingAddress } from "@/app/data/locations";

// Halaman Checkout (baru)
import Checkout from "@/app/components/addons/checkout";

/* ============================
 * Types
 * ============================ */
type CartItem = { productId: string; quantity: number };

// Snap type
type SnapCallbacks = {
  onSuccess?: (result: unknown) => void;
  onPending?: (result: unknown) => void;
  onError?: (result: unknown) => void;
  onClose?: () => void;
};
type SnapAPI = { pay: (token: string, callbacks?: SnapCallbacks) => void };
type SnapWindow = Window & { snap?: SnapAPI };

/* ============================
 * UI: Confirm Delete Modal (responsive)
 * ============================ */
function ConfirmModal({ open, title, onConfirm, onCancel }: { open: boolean; title?: string; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="w-full h-64 m-5 sm:h-auto sm:max-w-sm rounded-2xl bg-zinc-900 border border-white/10 p-6 sm:p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white text-center sm:text-left">Hapus dari cart?</h3>
          <p className="text-sm text-gray-300 mt-2 text-center sm:text-left">
            Apakah anda yakin ingin menghapus <span className="font-medium text-white">{title ?? "produk ini"}</span> dari cart anda?
          </p>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:flex sm:justify-end gap-2">
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

/* ============================
 * Page: Cart (mobile-first)
 * ============================ */
const CartPage: React.FC = () => {
  const router = useRouter();
  const rawUid = useUserSession(null);
  const userUid: string | null = rawUid ?? null;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmPid, setConfirmPid] = useState<string | null>(null);

  const [showCheckout, setShowCheckout] = useState<boolean>(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [showError, setShowError] = useState<{ open: boolean; message?: string }>({
    open: false,
  });
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [address, setAddress] = useState<ShippingAddress | null>(null);
  const [openAddressModal, setOpenAddressModal] = useState(false);

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) map.set(String(p.id), p);
    return map;
  }, []);

  const hasAddress = !!(address && address.city && address.kecamatan && address.kelurahan && address.postalCode);

  // load Snap
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

  // realtime cart + alamat
  useEffect(() => {
    if (!userUid) {
      setCart([]);
      setSelected(new Set());
      setAddress(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = doc(db, "users", userUid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data() as { cart?: CartItem[]; shippingAddress?: ShippingAddress | null } | undefined;
        const items = Array.isArray(data?.cart) ? data!.cart! : [];
        const normalized = items.map((it) => ({
          productId: String(it.productId),
          quantity: Math.max(1, Number(it.quantity) || 1),
        }));
        setCart(normalized);
        setSelected((prev) => new Set([...prev].filter((id) => normalized.some((i) => i.productId === id))));
        setAddress(data?.shippingAddress ?? null);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [userUid]);

  // fetch alamat awal fallback
  useEffect(() => {
    const run = async () => {
      if (!userUid) return;
      try {
        const ref = doc(db, "users", userUid);
        const snap = await getDoc(ref);
        const data = snap.data() as any;
        if (data?.shippingAddress) setAddress(data.shippingAddress as ShippingAddress);
        else setAddress(null);
      } catch {
        // ignore
      }
    };
    run();
  }, [userUid]);

  const toggleSelect = (pid: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });

  const allIds = useMemo(() => cart.map((c) => c.productId), [cart]);
  const toggleSelectAll = () => setSelected((prev) => (prev.size === allIds.length ? new Set() : new Set(allIds)));

  const selectedItems = useMemo(() => cart.filter((c) => selected.has(c.productId)), [cart, selected]);

  const openConfirm = (pid: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmPid(pid);
  };
  const handleConfirmRemove = async () => {
    if (!confirmPid || !userUid) return;
    try {
      await removeManyFromCart(userUid, [confirmPid]);
    } catch (err) {
      console.error("Failed to remove from cart", err);
    } finally {
      setConfirmPid(null);
    }
  };

  const handleCheckoutClick = () => {
    if (selectedItems.length === 0) return;
    setShowCheckout(true);
  };

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
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setShowError({ open: true, message: "Silakan login terlebih dahulu untuk melakukan pembelian." });
        return;
      }

      if (!hasAddress) {
        setShowError({ open: true, message: "Alamat penerima belum diisi. Silakan isi alamat penerima." });
        return;
      }

      const uid = currentUser.uid;
      const username = currentUser.displayName || "Tanpa Nama";
      const email = currentUser.email || "Tanpa Email";

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

      // Build items + simpan image ke order
      const itemsPayload = selectedIds.map((pid) => {
        const p = productById.get(pid);
        return {
          productId: pid,
          productTitle: p?.title || "",
          quantity: quantities[pid] ?? 1,
          pricePerItem: p
            ? (() => {
                const parts = p.price.split("-");
                const value = parts[parts.length - 1].trim().replace(/[^\d]/g, "");
                return parseInt(value, 10);
              })()
            : 0,
          image: p?.image || "/placeholder.png",
        };
      });

      // Simpan order awal
      await setDoc(doc(db, "orders", newOrderId), {
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
        // ✅ simpan info Snap & Midtrans
        snapToken: data.token,
        midtransOrderId: newOrderId, // order_id yang dipakai saat charge
        midtransOrderIds: [newOrderId], // mulai array riwayat
      });

      // Tambah orderId ke user profile
      await setDoc(doc(db, "users", uid), { orderIds: arrayUnion(newOrderId), lastOrderAt: serverTimestamp() }, { merge: true });

      // === HAPUS ITEM CART SEKARANG (STATUS APA PUN NANTI) ===
      await removeManyFromCart(uid, selectedIds);
      setSelected(new Set()); // reset pilihan, UI akan sinkron dari onSnapshot

      // Lanjutkan ke Snap
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
            await updateDoc(doc(db, "orders", newOrderId), {
              status: "success",
              paidAt: new Date(),
              midtrans: result,
            });
            await updateDoc(doc(db, "users", uid), {
              [`ordersStatus.${newOrderId}`]: "success",
              lastOrderAt: serverTimestamp(),
            });
          } catch {}
          setShowSuccess(true);
        },
        onPending: async (result) => {
          setPaymentResult(result);
          try {
            await updateDoc(doc(db, "orders", newOrderId), { status: "pending", midtrans: result });
            await updateDoc(doc(db, "users", uid), {
              [`ordersStatus.${newOrderId}`]: "pending",
              lastOrderAt: serverTimestamp(),
            });
          } catch {}
          setShowPending(true);
        },
        onError: async (result) => {
          try {
            await updateDoc(doc(db, "orders", newOrderId), {
              status: "error",
              errorAt: new Date(),
              midtrans: result,
            });
            await updateDoc(doc(db, "users", uid), {
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

  // LOGIN GUARD — gaya Favorites
  if (!userUid) {
    return (
      <main className="min-h-screen px-3 sm:px-4 py-10 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Cart</h1>
          <p className="text-gray-400 mb-6">Silakan login terlebih dahulu untuk melihat cart kamu.</p>
          <Link href="/" className="inline-block bg-red-600 hover:bg-red-700 transition-colors px-5 py-2 rounded-xl font-semibold">
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-3 sm:px-4 py-8 sm:py-10 text-white">
      <HeaderComponent />

      {/* === KONTEN CART SELALU DIRENDER (akan terlihat di belakang overlay) === */}
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">Cart</h1>
            <p className="text-gray-400 mt-2">Pilih item yang ingin kamu checkout</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
              <input type="checkbox" checked={selected.size > 0 && selected.size === cart.length} onChange={toggleSelectAll} className="h-4 w-4 rounded border-white/30 bg-transparent" />
              Select All
            </label>
            <button
              onClick={handleCheckoutClick}
              disabled={selectedItems.length === 0}
              className={`px-4 py-2 rounded-xl font-semibold transition w-full sm:w-auto ${
                selectedItems.length === 0 ? "bg-gray-700 text-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              Checkout ({selectedItems.length})
            </button>
          </div>
        </header>

        {/* Alamat Penerima */}
        <section className="mb-6">
          <div className="rounded-2xl border border-gray-800/50 bg-gray-900/40 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Alamat Penerima</h3>
              <button onClick={() => setOpenAddressModal(true)} className="text-sm px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10">
                {hasAddress ? "Edit Alamat" : "Tambah Alamat"}
              </button>
            </div>
            {hasAddress ? (
              <div className="mt-3 text-sm text-gray-300 space-y-1">
                <div className="font-medium">
                  {address!.name} — {address!.phone}
                </div>
                <div>{address!.addressLine}</div>
                <div>
                  {address!.kelurahan}, {address!.kecamatan}, {address!.city} {address!.postalCode}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-400">Belum ada alamat tersimpan. Klik “Tambah Alamat”.</p>
            )}
          </div>
        </section>

        {loading ? (
          <ul className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-center gap-4 rounded-2xl border border-gray-800/50 bg-gray-900/40 p-4">
                <div className="w-5 h-5 bg-gray-800/60 rounded animate-pulse" />
                <div className="w-20 h-20 bg-gray-800/60 rounded-xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-1/2 bg-gray-800/60 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-800/60 rounded animate-pulse" />
                </div>
                <div className="w-10 h-10 bg-gray-800/60 rounded-full animate-pulse" />
              </li>
            ))}
          </ul>
        ) : cart.length === 0 ? (
          <div className="text-center py-16 sm:py-24">
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Belum ada produk di cart</h3>
            <p className="text-gray-500">Yuk telusuri produk dan tambahkan ke cart kamu!</p>
            <Link href="/products" className="inline-block mt-6 bg-red-600 hover:bg-red-700 transition-colors px-5 py-2 rounded-xl font-semibold">
              Lihat Produk
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {cart.map((item) => {
              const p = productById.get(item.productId);
              const title = p?.title ?? `Produk ${item.productId}`;
              const img = p?.image ?? "/placeholder.png";
              const slug = p?.slug ?? "";
              const subtitle = p?.subtitle ?? "";
              const category = p?.category ?? "-";
              const priceHasRange = p?.price ? p.price.includes(" - ") : false;
              const [oldPrice, newPrice] = priceHasRange && p ? p.price.split(" - ") : [null, p?.price ?? "RP. 0"];
              return (
                <li key={item.productId}>
                  <Link
                    href={slug ? `/product/${slug}` : "#"}
                    className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-gray-800/50 bg-gray-900/40 hover:border-gray-700/60 transition p-4"
                  >
                    <div className="flex items-start gap-4 w-full">
                      <input
                        type="checkbox"
                        checked={selected.has(item.productId)}
                        onChange={() => toggleSelect(item.productId)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-5 w-5 mt-1 rounded border-white/30 bg-transparent flex-shrink-0"
                        aria-label="Pilih item"
                      />
                      <Image src={img} alt={`Gambar ${title}`} width={96} height={96} className="rounded-xl object-cover aspect-square flex-shrink-0 w-24 h-24" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-lg leading-tight truncate group-hover:text-red-400 transition-colors">{title}</h3>
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">{subtitle}</p>
                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                          <span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">{category}</span>
                          <div className="text-sm">
                            {priceHasRange ? (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 line-through">RP. {oldPrice?.replace("RP.", "").trim()}</span>
                                <span className="text-red-400 font-semibold">{newPrice}</span>
                              </div>
                            ) : (
                              <span className="text-red-400 font-semibold">{newPrice}</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            Qty: <b className="text-gray-200">{item.quantity}</b>
                          </span>
                        </div>
                      </div>
                      <button aria-label="Hapus dari cart" onClick={(e) => openConfirm(item.productId, e)} className="ml-2 p-2 rounded-full hover:bg-white/10 transition self-start" title="Hapus item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-300">
                          <path strokeWidth="2" d="M3 6h18" />
                          <path strokeWidth="2" d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
                          <path strokeWidth="2" d="M10 11v6M14 11v6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* === OVERLAY CHECKOUT DENGAN BACKDROP BLUR === */}
      {showCheckout && (
        <div className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm p-0 sm:p-6 animate-fadeIn" aria-modal="true" role="dialog">
          <div className="mx-auto w-full h-[100dvh] sm:h-auto sm:max-w-3xl sm:rounded-2xl sm:shadow-2xl sm:overflow-hidden animate-slideUp">
            <Checkout
              items={selectedItems}
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

      {/* Modals */}
      <ConfirmModal open={!!confirmPid} title={confirmPid ? productById.get(confirmPid)?.title : undefined} onConfirm={handleConfirmRemove} onCancel={() => setConfirmPid(null)} />

      {/* Address Menu */}
      <AddressMenu open={openAddressModal} initial={hasAddress ? address : null} userUid={userUid} onClose={() => setOpenAddressModal(false)} onSaved={(addr) => setAddress(addr)} />

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
              <button onClick={() => router.push("/orders")} className="w-full py-3 rounded-xl bg-black text-white hover:bg-gray-800 font-semibold">
                Lihat Pesanan
              </button>
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
              <button onClick={() => router.push("/orders")} className="w-full py-3 rounded-xl bg-black text-white hover:bg-gray-800 font-semibold">
                Lihat Pesanan
              </button>
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
    </main>
  );
};

export default CartPage;
