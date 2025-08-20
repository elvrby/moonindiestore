// app/cart/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useUserSession } from "@/hooks/use-user-session";
import { getAuth } from "firebase/auth";
import { db } from "@/libs/firebase/config";
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";

import { removeManyFromCart } from "@/libs/firebase/auth";
import { products, type Product } from "@/app/data/products";
import HeaderComponent from "@/app/components/layout/header";

type CartItem = { productId: string; quantity: number };

// Snap type (tanpa declare global)
type SnapCallbacks = {
  onSuccess?: (result: unknown) => void;
  onPending?: (result: unknown) => void;
  onError?: (result: unknown) => void;
  onClose?: () => void;
};
type SnapAPI = { pay: (token: string, callbacks?: SnapCallbacks) => void };
type SnapWindow = Window & { snap?: SnapAPI };

const parsePrice = (price: string): number => {
  const parts = price.split("-");
  const value = parts[parts.length - 1].trim().replace(/[^\d]/g, "");
  return parseInt(value, 10);
};

const cities = ["Jakarta", "Bogor", "Depok", "Tangerang", "Bekasi", "Bandung", "Surabaya", "Medan", "Semarang"];
const shippingServices = [
  { name: "JNE", cost: 20000, icon: "🚚" },
  { name: "SiCepat", cost: 15000, icon: "⚡" },
  { name: "Grab Instant", cost: 26000, icon: "🏍️" }, // hanya Jabodetabek
];

function ConfirmModal({ open, title, onConfirm, onCancel }: { open: boolean; title?: string; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white">Hapus dari cart?</h3>
        <p className="text-sm text-gray-300 mt-2">
          Apakah anda yakin ingin menghapus <span className="font-medium text-white">{title ?? "produk ini"}</span> dari cart anda?
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

/** Modal Checkout seperti ProductPopup, mengembalikan city, shipping, quantities, totalPrice, dan selectedIds (dibekukan saat klik Bayar) */
function CheckoutModal({
  open,
  items,
  productById,
  onClose,
  onConfirmPay,
}: {
  open: boolean;
  items: CartItem[];
  productById: Map<string, Product>;
  onClose: () => void;
  onConfirmPay: (payload: {
    city: string;
    shipping: string;
    quantities: Record<string, number>;
    totalPrice: number;
    selectedIds: string[]; // ⬅️ freeze daftar id yang dibayar
  }) => void;
}) {
  const [selectedCity, setSelectedCity] = useState<string>("Jakarta");
  const [selectedShipping, setSelectedShipping] = useState<string>("JNE");
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const init: Record<string, number> = {};
    for (const it of items) init[it.productId] = it.quantity;
    setQtyMap(init);
    setSelectedCity("Jakarta");
    setSelectedShipping("JNE");
    setIsLoading(false);
  }, [open, items]);

  useEffect(() => {
    const jabodetabek = ["Jakarta", "Bogor", "Depok", "Tangerang", "Bekasi"];
    if (!jabodetabek.includes(selectedCity) && selectedShipping === "Grab Instant") {
      setSelectedShipping("JNE");
    }
  }, [selectedCity, selectedShipping]);

  const increase = (pid: string) => setQtyMap((prev) => ({ ...prev, [pid]: Math.max(1, (prev[pid] || 1) + 1) }));
  const decrease = (pid: string) => setQtyMap((prev) => ({ ...prev, [pid]: Math.max(1, (prev[pid] || 1) - 1) }));
  const changeQty = (pid: string, val: number) => setQtyMap((prev) => ({ ...prev, [pid]: Number.isFinite(val) && val > 0 ? Math.floor(val) : prev[pid] || 1 }));

  const productsCost = useMemo(() => {
    return items.reduce((sum, it) => {
      const p = productById.get(it.productId);
      const qty = qtyMap[it.productId] ?? it.quantity;
      const unit = p ? parsePrice(p.price) : 0;
      return sum + unit * qty;
    }, 0);
  }, [items, qtyMap, productById]);

  const shippingUnitCost = useMemo(() => {
    const svc = shippingServices.find((s) => s.name === selectedShipping);
    return svc ? svc.cost : 0;
  }, [selectedShipping]);

  const totalQty = useMemo(() => items.reduce((acc, it) => acc + (qtyMap[it.productId] ?? it.quantity), 0), [items, qtyMap]);

  const shippingCost = shippingUnitCost * totalQty;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const grandTotal = productsCost + shippingCost;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slideUp max-h-[95vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-black to-gray-800 p-5 text-white relative">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">Checkout</h2>
              <p className="text-gray-300 text-sm mt-1">Atur pengiriman & kuantitas sebelum bayar</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition">
              <span className="text-xl">×</span>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Items */}
          <div className="space-y-3">
            {items.map((it) => {
              const p = productById.get(it.productId);
              if (!p) return null;
              const unit = parsePrice(p.price);
              const qty = qtyMap[it.productId] ?? it.quantity;
              const line = unit * qty;
              return (
                <div key={it.productId} className="flex items-center gap-3 border border-gray-200 rounded-xl p-3">
                  <Image src={p.image} alt={p.title} width={64} height={64} className="rounded-lg object-cover aspect-square" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{p.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{p.category}</p>
                    <div className="mt-1 text-sm text-gray-700">Rp{unit.toLocaleString("id-ID")} / item</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => decrease(it.productId)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">
                      −
                    </button>
                    <input type="number" min={1} value={qty} onChange={(e) => changeQty(it.productId, parseInt(e.target.value, 10))} className="w-14 text-center border rounded-lg py-1 text-black" />
                    <button onClick={() => increase(it.productId)} className="w-8 h-8 rounded-lg bg-black hover:bg-gray-800 text-white">
                      +
                    </button>
                  </div>
                  <div className="w-28 text-right font-semibold text-gray-900">Rp{line.toLocaleString("id-ID")}</div>
                </div>
              );
            })}
          </div>

          {/* Pengiriman */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Jasa Pengiriman</label>
              <select
                value={selectedShipping}
                onChange={(e) => setSelectedShipping(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-3 text-gray-800 font-medium hover:border-gray-400 focus:border-black outline-none transition text-sm"
              >
                {shippingServices.map((svc) => {
                  const jabodetabek = ["Jakarta", "Bogor", "Depok", "Tangerang", "Bekasi"];
                  const disabled = svc.name === "Grab Instant" && !jabodetabek.includes(selectedCity);
                  return (
                    <option key={svc.name} value={svc.name} disabled={disabled}>
                      {svc.icon} {svc.name} - Rp{svc.cost.toLocaleString("id-ID")}/kg
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Kota Tujuan</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-3 text-gray-800 font-medium hover:border-gray-400 focus:border-black outline-none transition text-sm"
              >
                {cities.map((c) => (
                  <option key={c} value={c}>
                    📍 {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ringkasan */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <h3 className="font-semibold text-gray-800 mb-2">Ringkasan Pesanan</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal Produk</span>
              <span className="font-medium">Rp{productsCost.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Pengiriman ({selectedShipping}) × {items.reduce((acc, i) => acc + (qtyMap[i.productId] ?? i.quantity), 0)} kg
              </span>
              <span className="font-medium">Rp{(shippingUnitCost * items.reduce((acc, i) => acc + (qtyMap[i.productId] ?? i.quantity), 0)).toLocaleString("id-ID")}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
              <span className="font-bold text-gray-800">Total</span>
              <span className="font-bold text-lg text-black">
                Rp{(productsCost + shippingUnitCost * items.reduce((acc, i) => acc + (qtyMap[i.productId] ?? i.quantity), 0)).toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 font-medium text-black">
              Batal
            </button>
            <button
              onClick={() => {
                if (isLoading) return;
                setIsLoading(true);
                onConfirmPay({
                  city: selectedCity,
                  shipping: selectedShipping,
                  quantities: qtyMap,
                  totalPrice: productsCost + shippingUnitCost * items.reduce((acc, i) => acc + (qtyMap[i.productId] ?? i.quantity), 0),
                  selectedIds: items.map((i) => i.productId), // ⬅️ freeze id yang akan dihapus
                });
                setTimeout(() => setIsLoading(false), 400);
              }}
              className={`flex-1 py-3 rounded-xl font-semibold text-white ${isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"}`}
            >
              {isLoading ? "Memproses..." : "Bayar Sekarang"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [showError, setShowError] = useState<{ open: boolean; message?: string }>({ open: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) map.set(String(p.id), p);
    return map;
  }, []);

  // load Snap sekali
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

  // realtime cart
  useEffect(() => {
    if (!userUid) {
      setCart([]);
      setSelected(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = doc(db, "users", userUid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data() as { cart?: CartItem[] } | undefined;
        const items = Array.isArray(data?.cart) ? data!.cart! : [];
        const normalized = items.map((it) => ({
          productId: String(it.productId),
          quantity: Math.max(1, Number(it.quantity) || 1),
        }));
        setCart(normalized);
        setSelected((prev) => new Set([...prev].filter((id) => normalized.some((i) => i.productId === id))));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [userUid]);

  const toggleSelect = (pid: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });

  const allIds = useMemo(() => cart.map((c) => c.productId), [cart]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const allSelected = selected.size > 0 && selected.size === allIds.length;
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
      await removeManyFromCart(userUid, [confirmPid]); // aman kalau single
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
    selectedIds, // ⬅️ freeze ids yang harus dihapus setelah sukses
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

      const uid = currentUser.uid;
      const username = currentUser.displayName || "Tanpa Nama";
      const email = currentUser.email || "Tanpa Email";

      const newOrderId = `order-${Date.now()}`;
      setOrderId(newOrderId);

      // minta token (TANPA redirect url dari server)
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

      const itemsPayload = selectedIds.map((pid) => {
        const p = productById.get(pid);
        return {
          productId: pid,
          productTitle: p?.title || "",
          quantity: quantities[pid] ?? 1,
          pricePerItem: p ? parsePrice(p.price) : 0,
        };
      });

      await setDoc(doc(db, "orders", newOrderId), {
        orderId: newOrderId,
        userUid: uid,
        username,
        email,
        items: itemsPayload,
        totalPrice,
        shipping,
        city,
        createdAt: new Date(),
        status: "created",
      });

      const w = window as SnapWindow;
      if (!w.snap) {
        setShowError({ open: true, message: "Snap JS belum dimuat." });
        return;
      }

      // tutup modal checkout saat mulai bayar
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
            // ✅ HAPUS SEMUA item terpilih SEKALIGUS (atomik)
            await removeManyFromCart(uid, selectedIds);
            // kosongkan pilihan di UI
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            setSelected((_) => new Set());
          } catch {
            // ignore
          }
          setShowSuccess(true);
        },
        onPending: async (result) => {
          setPaymentResult(result);
          try {
            await updateDoc(doc(db, "orders", newOrderId), { status: "pending", midtrans: result });
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
          } catch {}
          setShowError({ open: true, message: "Terjadi kesalahan pembayaran." });
        },
        onClose: () => {
          // user menutup snap tanpa bayar
        },
      });
    } catch (err) {
      console.error("Error saat memulai pembayaran:", err);
      setShowError({ open: true, message: "Terjadi kesalahan. Silakan coba lagi." });
    }
  };

  if (!userUid) {
    return (
      <main className="min-h-screen px-4 py-12 text-white">
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
    <main className="min-h-screen px-4 py-10 text-white">
      <HeaderComponent></HeaderComponent>
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-4xl font-bold">Cart</h1>
            <p className="text-gray-400 mt-2">Pilih item yang ingin kamu checkout</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
              <input type="checkbox" checked={selected.size > 0 && selected.size === cart.length} onChange={toggleSelectAll} className="h-4 w-4 rounded border-white/30 bg-transparent" />
              Select All
            </label>
            <button
              onClick={handleCheckoutClick}
              disabled={selectedItems.length === 0}
              className={`px-4 py-2 rounded-xl font-semibold transition ${selectedItems.length === 0 ? "bg-gray-700 text-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white"}`}
            >
              Checkout ({selectedItems.length})
            </button>
          </div>
        </header>

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
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">belum ada product di cart</h3>
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
                  <Link href={slug ? `/product/${slug}` : "#"} className="group flex items-center gap-4 rounded-2xl border border-gray-800/50 bg-gray-900/40 hover:border-gray-700/60 transition p-4">
                    <input
                      type="checkbox"
                      checked={selected.has(item.productId)}
                      onChange={() => toggleSelect(item.productId)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-5 w-5 rounded border-white/30 bg-transparent"
                      aria-label="Pilih item"
                    />
                    <Image src={img} alt={`Gambar ${title}`} width={96} height={96} className="rounded-xl object-cover aspect-square flex-shrink-0" />
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
                    <button aria-label="Hapus dari cart" onClick={(e) => openConfirm(item.productId, e)} className="ml-2 p-2 rounded-full hover:bg-white/10 transition" title="Hapus item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-300">
                        <path strokeWidth="2" d="M3 6h18" />
                        <path strokeWidth="2" d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
                        <path strokeWidth="2" d="M10 11v6M14 11v6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmModal open={!!confirmPid} title={confirmPid ? productById.get(confirmPid)?.title : undefined} onConfirm={handleConfirmRemove} onCancel={() => setConfirmPid(null)} />

      <CheckoutModal open={showCheckout} items={selectedItems} productById={productById} onClose={() => setShowCheckout(false)} onConfirmPay={handleConfirmPay} />

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
