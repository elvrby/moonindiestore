"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { products, Product as ProductType } from "@/app/data/products";
import { db } from "@/libs/firebase/config";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

interface ProductPopupProps {
  productId: number;
  onClose: () => void;
}

type SnapCallbacks = {
  onSuccess?: (result: unknown) => void;
  onPending?: (result: unknown) => void;
  onError?: (result: unknown) => void;
  onClose?: () => void;
};

type SnapAPI = {
  pay: (token: string, callbacks?: SnapCallbacks) => void;
};

type SnapWindow = Window & { snap?: SnapAPI };

function parsePrice(price: string): number {
  const parts = price.split("-");
  const value = parts[parts.length - 1].trim().replace(/[^\d]/g, "");
  return parseInt(value, 10);
}

const cities = ["Jakarta", "Bogor", "Depok", "Tangerang", "Bekasi", "Bandung", "Surabaya", "Medan", "Semarang"];

const shippingServices = [
  { name: "JNE", cost: 20000, icon: "🚚" },
  { name: "SiCepat", cost: 15000, icon: "⚡" },
  { name: "Grab Instant", cost: 26000, icon: "🏍️" },
];

export default function ProductPopup({ productId, onClose }: ProductPopupProps) {
  const product: ProductType | undefined = products.find((p) => p.id === productId);
  const basePrice = product ? parsePrice(product.price) : 0;

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedShipping, setSelectedShipping] = useState<string>("JNE");
  const [selectedCity, setSelectedCity] = useState<string>("Jakarta");
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // UI modal states
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [showError, setShowError] = useState<{ open: boolean; message?: string }>({ open: false });
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const router = useRouter();

  // Load Snap (SANDBOX) once
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    if (typeof window === "undefined") return;
    const w = window as SnapWindow;

    // jika sudah ada, jangan muat lagi
    if (w.snap || !key) return;

    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", key);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // optional: tidak perlu remove, biarkan cache script
    };
  }, []);

  useEffect(() => {
    const shipping = shippingServices.find((s) => s.name === selectedShipping);
    const shippingCost = shipping ? shipping.cost * quantity : 0;
    const productsCost = basePrice * quantity;
    setTotalPrice(productsCost + shippingCost);
  }, [quantity, selectedShipping, basePrice]);

  const handleQuantityChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) setQuantity(val);
  };

  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () => setQuantity((prev) => Math.max(1, prev - 1));

  const handleShippingChange = (e: ChangeEvent<HTMLSelectElement>) => setSelectedShipping(e.target.value);

  const handleCityChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    setSelectedCity(city);
    const jabodetabek = ["Jakarta", "Bogor", "Depok", "Tangerang", "Bekasi"];
    if (!jabodetabek.includes(city) && selectedShipping === "Grab Instant") {
      setSelectedShipping("JNE");
    }
  };

  const handlePayment = async () => {
    setIsLoading(true);
    const newOrderId = `order-${Date.now()}`;
    setOrderId(newOrderId);

    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert("Silakan login terlebih dahulu untuk melakukan pembelian.");
      setIsLoading(false);
      return;
    }

    const userUid = currentUser.uid;
    const username = currentUser.displayName || "Tanpa Nama";
    const email = currentUser.email || "Tanpa Email";

    try {
      // Buat transaksi Midtrans (server harus mengembalikan { token })
      const response = await fetch("/api/midtrans/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalPrice, orderId: newOrderId }),
      });

      const data = await response.json();
      if (!response.ok || !data.token) {
        setShowError({ open: true, message: data?.error || "Gagal membuat transaksi." });
        setIsLoading(false);
        return;
      }

      // Simpan order awal
      await setDoc(doc(db, "orders", newOrderId), {
        orderId: newOrderId,
        userUid,
        username,
        email,
        productId,
        productTitle: product?.title || "",
        quantity,
        pricePerItem: basePrice,
        totalPrice,
        shipping: selectedShipping,
        city: selectedCity,
        createdAt: new Date(),
        status: "created",
      });

      const w = window as SnapWindow;
      if (w.snap) {
        w.snap.pay(data.token, {
          onSuccess: async (result) => {
            setPaymentResult(result);
            try {
              await updateDoc(doc(db, "orders", newOrderId), {
                status: "success",
                paidAt: new Date(),
                midtrans: result,
              });
            } catch {
              // no-op
            }
            setShowSuccess(true);
            setIsLoading(false);
          },
          onPending: async (result) => {
            setPaymentResult(result);
            try {
              await updateDoc(doc(db, "orders", newOrderId), {
                status: "pending",
                midtrans: result,
              });
            } catch {
              // no-op
            }
            setShowPending(true);
            setIsLoading(false);
          },
          onError: async (result) => {
            try {
              await updateDoc(doc(db, "orders", newOrderId), {
                status: "error",
                errorAt: new Date(),
                midtrans: result,
              });
            } catch {
              // no-op
            }
            setShowError({ open: true, message: "Terjadi kesalahan pembayaran." });
            setIsLoading(false);
          },
          onClose: () => {
            setIsLoading(false);
          },
        });
      } else {
        setShowError({ open: true, message: "Snap JS belum dimuat." });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error saat memproses pembayaran:", error);
      setShowError({ open: true, message: "Terjadi kesalahan. Silakan coba lagi." });
      setIsLoading(false);
    }
  };

  const selectedShippingService = shippingServices.find((s) => s.name === selectedShipping);
  const shippingCost = selectedShippingService ? selectedShippingService.cost * quantity : 0;
  const productsCost = basePrice * quantity;

  if (!product) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-fadeIn p-4">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md animate-slideUp">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl sm:text-2xl">❌</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Produk Tidak Ditemukan</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">Maaf, produk yang Anda cari tidak tersedia.</p>
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg w-full sm:w-auto"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-fadeIn p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-sm sm:max-w-md lg:max-w-lg shadow-2xl animate-slideUp overflow-hidden max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-black to-gray-800 p-4 sm:p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 pr-2">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 leading-tight">{product.title}</h2>
                <p className="text-gray-300 text-xs sm:text-sm opacity-90 line-clamp-2">{product.description}</p>
              </div>
              <button
                onClick={onClose}
                className="ml-2 w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200 flex-shrink-0"
              >
                <span className="text-white text-lg sm:text-xl">×</span>
              </button>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-300">Harga per item:</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold">Rp{basePrice.toLocaleString()}</p>
            </div>
          </div>
          <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-white/5 rounded-full"></div>
          <div className="absolute -bottom-2 -left-2 w-12 h-12 sm:w-16 sm:h-16 bg-white/5 rounded-full"></div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Quantity Section */}
          <div className="space-y-2 sm:space-y-3">
            <label className="block text-sm font-semibold text-gray-700">Jumlah Pembelian</label>
            <div className="flex items-center justify-center space-x-3 sm:space-x-4">
              <button
                onClick={decreaseQuantity}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-600 font-bold transition-colors duration-200 text-lg sm:text-xl"
              >
                −
              </button>
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 sm:px-6 py-2 sm:py-3 min-w-[70px] sm:min-w-[80px] text-center">
                <input type="number" min="1" value={quantity} onChange={handleQuantityChange} className="w-full bg-white text-center text-lg sm:text-xl font-semibold text-gray-800 outline-none" />
              </div>

              <button
                onClick={increaseQuantity}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-black hover:bg-gray-800 rounded-xl flex items-center justify-center text-white font-bold transition-colors duration-200 text-lg sm:text-xl"
              >
                +
              </button>
            </div>
          </div>

          {/* Shipping Section */}
          <div className="space-y-2 sm:space-y-3">
            <label className="block text-sm font-semibold text-gray-700">Jasa Pengiriman</label>
            <div className="relative">
              <select
                value={selectedShipping}
                onChange={handleShippingChange}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-3 text-gray-800 font-medium appearance-none cursor-pointer hover:border-gray-400 focus:border-black focus:outline-none transition-colors duration-200 text-sm sm:text-base"
              >
                {shippingServices.map((service) => {
                  const isGrabDisabled = service.name === "Grab Instant" && !["Jakarta", "Bogor", "Depok", "Tangerang", "Bekasi"].includes(selectedCity);
                  return (
                    <option key={service.name} value={service.name} disabled={isGrabDisabled}>
                      {service.icon} {service.name} - Rp{service.cost.toLocaleString()}/kg
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <span className="text-gray-400">▼</span>
              </div>
            </div>
          </div>

          {/* City Section */}
          <div className="space-y-2 sm:space-y-3">
            <label className="block text-sm font-semibold text-gray-700">Kota Tujuan</label>
            <div className="relative">
              <select
                value={selectedCity}
                onChange={handleCityChange}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-3 text-gray-800 font-medium appearance-none cursor-pointer hover:border-gray-400 focus:border-black focus:outline-none transition-colors duration-200 text-sm sm:text-base"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    📍 {city}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <span className="text-gray-400">▼</span>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-gray-50 rounded-2xl p-3 sm:p-4 space-y-2 sm:space-y-3">
            <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">Ringkasan Pesanan</h3>
            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Produk ({quantity}x)</span>
                <span className="font-medium">Rp{productsCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 truncate pr-2">
                  Pengiriman ({selectedShippingService?.icon} {selectedShipping})
                </span>
                <span className="font-medium flex-shrink-0">Rp{shippingCost.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2 sm:mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800 text-sm sm:text-base">Total</span>
                  <span className="font-bold text-lg sm:text-xl text-black">Rp{totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            disabled={isLoading}
            className={`w-full py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg ${
              isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white hover:shadow-xl"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="text-sm sm:text-base">Memproses...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <span>💳</span>
                <span>Bayar Sekarang</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-slideUp text-black">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Pembayaran Berhasil</h3>
            <p className="text-gray-600 text-center mb-4">Terima kasih! Pesanan kamu sedang diproses.</p>
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
              <button
                onClick={() => {
                  setShowSuccess(false);
                  onClose();
                }}
                className="w-full py-3 rounded-xl border border-gray-300 hover:bg-gray-50 font-medium"
              >
                Tutup
              </button>
              <button onClick={() => router.push("/")} className="w-full py-3 rounded-xl bg-black text-white hover:bg-gray-800 font-semibold">
                Ke Beranda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PENDING MODAL */}
      {showPending && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-slideUp">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mx-auto mb-4">
              <span className="text-3xl">⏳</span>
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Menunggu Pembayaran</h3>
            <p className="text-gray-600 text-center mb-4">Kami belum menerima konfirmasi pembayaran. Kamu bisa lanjutkan bayar dari halaman riwayat pesanan.</p>
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
              <button
                onClick={() => {
                  setShowPending(false);
                  onClose();
                }}
                className="w-full py-3 rounded-xl border border-gray-300 hover:bg-gray-50 font-medium"
              >
                Nanti Saja
              </button>
              <button onClick={() => router.push("/orders")} className="w-full py-3 rounded-xl bg-black text-white hover:bg-gray-800 font-semibold">
                Lihat Pesanan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ERROR MODAL */}
      {showError.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-slideUp">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Pembayaran Gagal</h3>
            <p className="text-gray-600 text-center mb-4">{showError.message || "Terjadi kesalahan saat memproses pembayaran."}</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowError({ open: false })} className="w-full py-3 rounded-xl border border-gray-300 hover:bg-gray-50 font-medium">
                Tutup
              </button>
              <button onClick={handlePayment} className="w-full py-3 rounded-xl bg-black text-white hover:bg-gray-800 font-semibold">
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}
