"use client";

import React, { useState, useEffect } from "react";
import { doc, setDoc, collection, updateDoc, getDocs, query, where } from "firebase/firestore";
import { firebaseFirestore } from "@/libs/firebase/config";

interface SendWarrantyProps {
  username: string;
  uid: string;
  warrantyDuration?: number; // Durasi garansi dalam bulan
}

const SendWarranty: React.FC<SendWarrantyProps> = ({ username, uid, warrantyDuration = 12 }) => {
  const [warrantyCode, setWarrantyCode] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const calculateExpiryDate = (purchaseDate: string, durationInMonths: number): string => {
    const purchase = new Date(purchaseDate);
    const expiry = new Date(purchase);
    expiry.setMonth(expiry.getMonth() + durationInMonths);
    return expiry.toISOString().split("T")[0];
  };

  const createExpirationDate = (purchaseDate: string, durationInMonths: number): Date => {
    const purchase = new Date(purchaseDate);
    const expiry = new Date(purchase);
    expiry.setMonth(expiry.getMonth() + durationInMonths);
    return expiry;
  };

  const handleGenerateWarranty = async () => {
    if (!warrantyCode || !purchaseDate) {
      setStatus("Mohon lengkapi semua field yang diperlukan");
      return;
    }

    setIsGenerating(true);
    setStatus(null);

    try {
      const q = query(collection(firebaseFirestore, "warranty"), where("warrantyCode", "==", warrantyCode));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setStatus("Kode garansi sudah ada, gunakan kode yang berbeda");
        setIsGenerating(false);
        return;
      }

      const warrantyRef = doc(collection(firebaseFirestore, "warranty"));
      const expirationTime = createExpirationDate(purchaseDate, warrantyDuration);

      await setDoc(warrantyRef, {
        warrantyCode,
        purchaseDate: new Date(purchaseDate),
        timestamp: new Date(),
        expiration: expirationTime,
        warrantyDuration,
        status: "available",
        claimed: false,
        generatedBy: username,
        generatedById: uid,
      });

      setWarrantyCode("");
      setPurchaseDate("");
      setStatus("Garansi berhasil dibuat!");
    } catch (error) {
      console.error("Error creating warranty", error);
      setStatus("Gagal membuat garansi");
    } finally {
      setIsGenerating(false);
    }
  };

  const checkExpiredWarranties = async () => {
    const now = new Date();
    try {
      const q = query(collection(firebaseFirestore, "warranty"), where("expiration", "<=", now), where("status", "==", "available"));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log("No warranties to update.");
        return;
      }

      snapshot.forEach(async (doc) => {
        await updateDoc(doc.ref, { status: "expired" });
      });

      console.log("Warranties updated successfully.");
    } catch (error) {
      console.error("Error updating warranties", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      checkExpiredWarranties();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-blue-800 font-medium">Durasi garansi: {warrantyDuration} bulan</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Warranty Code Input (Manual) */}
        <div>
          <label htmlFor="warrantyCode" className="block text-sm font-medium text-gray-700 mb-2">
            Kode Garansi *
          </label>
          <input
            type="text"
            id="warrantyCode"
            value={warrantyCode}
            onChange={(e) => setWarrantyCode(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900"
            placeholder="Masukkan kode garansi"
          />
        </div>

        {/* Purchase Date */}
        <div>
          <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Pembelian *
          </label>
          <input
            type="date"
            id="purchaseDate"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900"
          />
        </div>

        {/* Expiry Date Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Expired</label>
          <div className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600">
            {purchaseDate ? calculateExpiryDate(purchaseDate, warrantyDuration) : "Pilih tanggal pembelian"}
          </div>
        </div>
      </div>

      {/* Status Message */}
      {status && (
        <div
          className={`p-4 rounded-lg ${
            status.includes("berhasil") || status.includes("successfully") ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center space-x-2">
            {status.includes("berhasil") || status.includes("successfully") ? (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            )}
            <span className="font-medium">{status}</span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleGenerateWarranty}
          disabled={isGenerating || !warrantyCode || !purchaseDate}
          className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
            isGenerating || !warrantyCode || !purchaseDate
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
          }`}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Membuat Garansi...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Buat Garansi</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SendWarranty;
