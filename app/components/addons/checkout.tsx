// app/components/addons/checkout.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { Product } from "@/app/data/products";
import type { ShippingAddress } from "@/app/data/locations";

/* ============================
 * Types & Utils
 * ============================ */
type CartItem = { productId: string; quantity: number };

const parsePrice = (price: string): number => {
  const parts = price.split("-");
  const value = parts[parts.length - 1].trim().replace(/[^\d]/g, "");
  return parseInt(value, 10);
};

/** Tarif jasa pengiriman dalam Rp per KG */
const shippingServices = [
  { name: "JNE", cost: 20000, icon: "🚚" },
  { name: "SiCepat", cost: 2500, icon: "⚡" },
  { name: "Grab Instant", cost: 26000, icon: "🏍️" }, // hanya Jabodetabek
];

interface CheckoutProps {
  items: CartItem[];
  productById: Map<string, Product>;
  onClose: () => void;
  onConfirmPay: (payload: { city: string; shipping: string; quantities: Record<string, number>; totalPrice: number; selectedIds: string[] }) => void;
  shippingAddress: ShippingAddress | null;
  onEditAddress: () => void;
}

/**
 * Halaman Checkout (bukan modal). Sekarang body dapat di-scroll.
 */
const Checkout: React.FC<CheckoutProps> = ({ items, productById, onClose, onConfirmPay, shippingAddress, onEditAddress }) => {
  const [selectedShipping, setSelectedShipping] = useState<string>("JNE");
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  const cityFromAddress = shippingAddress?.city ?? "";

  useEffect(() => {
    const init: Record<string, number> = {};
    for (const it of items) init[it.productId] = it.quantity;
    setQtyMap(init);
    setSelectedShipping("JNE");
  }, [items]);

  // Bila bukan Jabodetabek, matikan Grab Instant
  useEffect(() => {
    const isJabodetabek = /Jakarta/i.test(cityFromAddress) || ["Bogor", "Depok", "Tangerang", "Bekasi"].some((k) => cityFromAddress.toLowerCase().includes(k.toLowerCase()));
    if (!isJabodetabek && selectedShipping === "Grab Instant") {
      setSelectedShipping("JNE");
    }
  }, [cityFromAddress, selectedShipping]);

  const increase = (pid: string) => setQtyMap((prev) => ({ ...prev, [pid]: Math.max(1, (prev[pid] || 1) + 1) }));
  const decrease = (pid: string) => setQtyMap((prev) => ({ ...prev, [pid]: Math.max(1, (prev[pid] || 1) - 1) }));
  const changeQty = (pid: string, val: number) =>
    setQtyMap((prev) => ({
      ...prev,
      [pid]: Number.isFinite(val) && val > 0 ? Math.floor(val) : prev[pid] || 1,
    }));

  /** Subtotal harga produk */
  const productsCost = useMemo(() => {
    return items.reduce((sum, it) => {
      const p = productById.get(it.productId);
      const qty = qtyMap[it.productId] ?? it.quantity;
      const unit = p ? parsePrice(p.price) : 0;
      return sum + unit * qty;
    }, 0);
  }, [items, qtyMap, productById]);

  /** Tarif per kg dari jasa yang dipilih */
  const shippingUnitCost = useMemo(() => {
    const svc = shippingServices.find((s) => s.name === selectedShipping);
    return svc ? svc.cost : 0;
  }, [selectedShipping]);

  /** Berat total (gram) */
  const totalWeightGram = useMemo(() => {
    return items.reduce((acc, it) => {
      const p = productById.get(it.productId);
      const qty = qtyMap[it.productId] ?? it.quantity;
      const berat = (p as any)?.beratGram ?? 0;
      return acc + berat * qty;
    }, 0);
  }, [items, qtyMap, productById]);

  const totalWeightKg = useMemo(() => totalWeightGram / 1000, [totalWeightGram]);

  /** Penagihan berat */
  const billedWeightKg = useMemo(() => {
    const kg = totalWeightKg;
    if (kg <= 0) return 0;
    return kg < 2 ? 1 : Math.ceil(kg);
  }, [totalWeightKg]);

  const shippingCost = useMemo(() => shippingUnitCost * billedWeightKg, [shippingUnitCost, billedWeightKg]);

  /** Admin 2% */
  const adminFee = useMemo(() => Math.round((productsCost + shippingCost) * 0.02), [productsCost, shippingCost]);

  /** Grand total */
  const grandTotal = useMemo(() => productsCost + shippingCost + adminFee, [productsCost, shippingCost, adminFee]);

  const handlePay = () => {
    if (isLoading) return;
    if (!shippingAddress) {
      alert("Lengkapi alamat penerima terlebih dahulu.");
      return;
    }
    setIsLoading(true);
    onConfirmPay({
      city: shippingAddress.city || "-",
      shipping: selectedShipping,
      quantities: qtyMap,
      totalPrice: grandTotal,
      selectedIds: items.map((i) => i.productId),
    });
    setTimeout(() => setIsLoading(false), 400);
  };

  return (
    <section className="max-w-4xl mx-auto w-full bg-white text-black rounded-none sm:rounded-2xl shadow-none sm:shadow-2xl p-0 sm:p-6 max-h-[100dvh] sm:max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-black to-gray-800 text-white p-4 sm:rounded-xl flex items-center justify-between sticky top-0 z-10">
        <div>
          <h2 className="text-lg sm:text-xl font-bold">Checkout</h2>
          <p className="text-gray-300 text-xs sm:text-sm mt-1">Alamat & ringkasan pesanan</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition" aria-label="Tutup" title="Kembali ke Cart">
          <span className="text-xl">×</span>
        </button>
      </div>

      {/* Body scrollable */}
      <div className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto scroll-y">
        {/* Alamat Penerima */}
        <div className="border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Alamat Penerima</h3>
            <button onClick={onEditAddress} className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">
              {shippingAddress ? "Edit" : "Tambah"}
            </button>
          </div>
          {shippingAddress ? (
            <div className="text-sm text-gray-700 space-y-1">
              <div className="font-medium">
                {shippingAddress.name} — {shippingAddress.phone}
              </div>
              <div>{shippingAddress.addressLine}</div>
              <div>
                {shippingAddress.kelurahan}, {shippingAddress.kecamatan}, {shippingAddress.city} {shippingAddress.postalCode}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Belum ada alamat. Klik <b>Tambah</b> untuk mengisi data penerima.
            </div>
          )}
        </div>

        {/* Items */}
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center text-gray-600 py-8">
              Tidak ada item terpilih.{" "}
              <button onClick={onClose} className="underline">
                Kembali ke Cart
              </button>
            </div>
          ) : (
            items.map((it) => {
              const p = productById.get(it.productId);
              if (!p) return null;
              const unit = parsePrice(p.price);
              const qty = qtyMap[it.productId] ?? it.quantity;
              const line = unit * qty;
              return (
                <div key={it.productId} className="flex flex-col sm:flex-row sm:items-center gap-3 border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <Image src={p.image} alt={p.title} width={72} height={72} className="rounded-lg object-cover aspect-square w-[72px] h-[72px] sm:w-[64px] sm:h-[64px]" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{p.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{p.category}</p>
                      <div className="mt-1 text-sm text-gray-700">Rp{unit.toLocaleString("id-ID")} / item</div>
                      {typeof (p as any).beratGram === "number" && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          Berat: {(((p as any).beratGram ?? 0) / 1000).toFixed(2)} kg × {qty}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => decrease(it.productId)} className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">
                        −
                      </button>
                      <input type="number" min={1} value={qty} onChange={(e) => changeQty(it.productId, parseInt(e.target.value, 10))} className="w-16 text-center border rounded-lg py-2 text-black" />
                      <button onClick={() => increase(it.productId)} className="w-9 h-9 rounded-lg bg-black hover:bg-gray-800 text-white">
                        +
                      </button>
                    </div>
                    <div className="text-right font-semibold text-gray-900">Rp{line.toLocaleString("id-ID")}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pengiriman */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Jasa Pengiriman</label>
          <select
            value={selectedShipping}
            onChange={(e) => setSelectedShipping(e.target.value)}
            className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-3 text-gray-800 font-medium hover:border-gray-400 focus:border-black outline-none transition text-sm"
          >
            {shippingServices.map((svc) => {
              const isJabodetabek = /Jakarta/i.test(cityFromAddress) || ["Bogor", "Depok", "Tangerang", "Bekasi"].some((k) => cityFromAddress.toLowerCase().includes(k.toLowerCase()));
              const disabled = svc.name === "Grab Instant" && !isJabodetabek;
              return (
                <option key={svc.name} value={svc.name} disabled={disabled}>
                  {svc.icon} {svc.name} - Rp{svc.cost.toLocaleString("id-ID")}/kg
                </option>
              );
            })}
          </select>
        </div>

        {/* Ringkasan */}
        <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
          <h3 className="font-semibold text-gray-800 mb-2">Ringkasan Pesanan</h3>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal Produk</span>
            <span className="font-medium">Rp{productsCost.toLocaleString("id-ID")}</span>
          </div>

          <div className="flex justify-between text-xs text-gray-500">
            <span>Tujuan</span>
            <span>{shippingAddress ? `${shippingAddress.kelurahan}, ${shippingAddress.kecamatan}, ${shippingAddress.city} ${shippingAddress.postalCode}` : "-"}</span>
          </div>

          <div className="flex justify-between text-xs text-gray-500">
            <span>Berat total</span>
            <span>
              {totalWeightKg.toFixed(2)} kg {billedWeightKg > 0 && <> (ditagih {billedWeightKg} kg)</>}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Pengiriman ({selectedShipping}) × {billedWeightKg} kg
            </span>
            <span className="font-medium">Rp{shippingCost.toLocaleString("id-ID")}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Biaya Admin (2%)</span>
            <span className="font-medium">Rp{adminFee.toLocaleString("id-ID")}</span>
          </div>

          <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
            <span className="font-bold text-gray-800">Total</span>
            <span className="font-bold text-lg text-black">Rp{grandTotal.toLocaleString("id-ID")}</span>
          </div>
        </div>

        {/* Aksi */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={onClose} className="w-full py-3 rounded-xl border border-gray-300 hover:bg-gray-50 font-medium">
            Batal
          </button>
          <button onClick={handlePay} className={`w-full py-3 rounded-xl font-semibold text-white ${isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"}`}>
            {isLoading ? "Memproses..." : "Bayar Sekarang"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .scroll-y {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </section>
  );
};

export default Checkout;
