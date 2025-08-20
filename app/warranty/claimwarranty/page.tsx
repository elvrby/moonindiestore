"use client";

import React, { useState, useEffect } from "react";
import { collection, updateDoc, getDocs, query, where } from "firebase/firestore";
import { firebaseFirestore } from "@/libs/firebase/config";
import Link from "next/link";

const ClaimWarranty: React.FC = () => {
  const [warrantyCode, setWarranty] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleWarrantyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWarranty(e.target.value);
    if (status) setStatus(null); // Clear status when user starts typing
  };

  const handleSendWarranty = async () => {
    if (warrantyCode.trim() === "") {
      setStatus("Warranty cannot be empty");
      return;
    }

    setSubmitting(true);

    try {
      const q = query(collection(firebaseFirestore, "warranty"), where("warrantyCode", "==", warrantyCode));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setStatus("Warranty not found or you filled incorrectly");
        setSubmitting(false);
        return;
      }

      const docRef = snapshot.docs[0].ref;
      const warrantyData = snapshot.docs[0].data();

      if (warrantyData.claimed) {
        setStatus("Warranty claimed already");
        setSubmitting(false);
        return;
      }

      await updateDoc(docRef, { claimed: true });
      setWarranty("");
      setStatus("Warranty claimed successfully");
    } catch (error) {
      console.error("Error claiming warranty", error);
      setStatus("Warranty claiming failed");
    } finally {
      setSubmitting(false);
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

    setLoading(false);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          </div>
          <h2 className="text-gray-700 text-xl font-medium">Tunggu Sebentar...</h2>
        </div>
      </div>
    );
  }

  const getStatusStyles = () => {
    if (status === "Warranty claimed successfully") {
      return "bg-green-50 border-green-200 text-green-800 shadow-green-100";
    } else if (status === "Warranty claimed already") {
      return "bg-amber-50 border-amber-200 text-amber-800 shadow-amber-100";
    } else {
      return "bg-red-50 border-red-200 text-red-800 shadow-red-100";
    }
  };

  const getStatusIcon = () => {
    if (status === "Warranty claimed successfully") {
      return (
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    } else if (status === "Warranty claimed already") {
      return (
        <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
      </div>

      {/* Status Alert */}
      {status && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className={`relative p-4 rounded-2xl border-2 shadow-lg ${getStatusStyles()}`}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">{getStatusIcon()}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{status === "Warranty claimed successfully" ? "Success!" : status === "Warranty claimed already" ? "Information" : "Error"}</div>
                <div className="mt-1 text-sm">
                  {status === "Warranty claimed successfully" ? (
                    <>
                      Warranty claimed successfully.{" "}
                      <Link href="/warranty/mywarranty" className="font-semibold underline hover:no-underline text-blue-600">
                        View My Warranties →
                      </Link>
                    </>
                  ) : status === "Warranty claimed already" ? (
                    <>
                      This warranty has already been claimed.{" "}
                      <Link href="/warranty/mywarranty" className="font-semibold underline hover:no-underline text-blue-600">
                        View My Warranties →
                      </Link>
                    </>
                  ) : (
                    status
                  )}
                </div>
              </div>
              <button onClick={() => setStatus(null)} className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50">
          <div className=" w-12 h-12 flex items-center justify-center relative">
            <Link href="/warranty" className="flex items-center justify-center">
              <svg height="28px" width="28px" id="Layer_1" version="1.1" viewBox="0 0 512 512">
                <path d="M189.3,128.4L89,233.4c-6,5.8-9,13.7-9,22.4c0,8.7,3,16.5,9,22.4l100.3,105.4c11.9,12.5,31.3,12.5,43.2,0  c11.9-12.5,11.9-32.7,0-45.2L184.4,288h217c16.9,0,30.6-14.3,30.6-32c0-17.7-13.7-32-30.6-32h-217l48.2-50.4  c11.9-12.5,11.9-32.7,0-45.2C220.6,115.9,201.3,115.9,189.3,128.4z" />
              </svg>
            </Link>
          </div>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Claim Warranty</h1>
            <p className="text-gray-600 text-sm leading-relaxed">Enter your warranty code to claim your product warranty and activate protection</p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Warranty Code</label>
              <div className="relative">
                <input
                  type="text"
                  value={warrantyCode}
                  onChange={handleWarrantyChange}
                  placeholder="Enter your warranty code"
                  className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 shadow-sm"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <button
              onClick={handleSendWarranty}
              disabled={submitting || !warrantyCode.trim()}
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
            >
              {submitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Claim Warranty</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </button>
          </div>

          {/* Additional Actions */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-center space-x-1 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Your warranty information is secure</span>
            </div>

            <div className="text-center">
              <Link href="/support" className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                Need help? Contact Support
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-6 flex justify-center space-x-6">
          <Link
            href="/warranty/mywarranty"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors text-sm bg-white/60 px-4 py-2 rounded-xl backdrop-blur shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span>My Warranties</span>
          </Link>
        </div>
      </div>
    </main>
  );
};

export default ClaimWarranty;
