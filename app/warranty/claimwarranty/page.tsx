"use client"; // Add this at the top of the file

import React, { useState, useEffect } from "react";
import { doc, setDoc, collection, updateDoc, getDocs, query, where } from "firebase/firestore";
import { firebaseFirestore } from "@/libs/firebase/config"; // Ensure this path matches your configuration
import ClipLoader from "react-spinners/ClipLoader";
import Link from "next/link";

const ClaimWarranty: React.FC = () => {
  const [warrantyCode, setWarranty] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleWarrantyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWarranty(e.target.value);
  };

  const handleSendWarranty = async () => {
    if (warrantyCode.trim() === "") {
      setStatus("Warranty cannot be empty");
      return;
    }

    try {
      // Check if the warrantyCode exists
      const q = query(collection(firebaseFirestore, "warranty"), where("warrantyCode", "==", warrantyCode));

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setStatus("Warranty not found or you filled incorrectly");
        return;
      }

      const docRef = snapshot.docs[0].ref;
      const warrantyData = snapshot.docs[0].data();

      if (warrantyData.claimed) {
        setStatus("Warranty claimed already");
        return;
      }

      await updateDoc(docRef, { claimed: true });

      setWarranty("");
      setStatus("Warranty claimed successfully");
    } catch (error) {
      console.error("Error claiming warranty", error);
      setStatus("Warranty claiming failed");
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
    }, 60000); // Check every 1 minute

    setLoading(false);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-center">
          <ClipLoader color="white" loading={loading} size={30} /> {/* Loading spinner */}
          <h2 className="text-white mt-4">Tunggu Sebentar....</h2>
        </div>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center h-screen bg-white text-black">
      {status && (
        <div
          className={`fixed top-0 left-0 right-0 border px-4 py-3 rounded relative mt-4 mx-4 w-auto max-w-4xl mb-5 ${
            status === "Warranty claimed successfully" ? "bg-green-100 border-green-400" : status === "Warranty claimed already" ? "bg-yellow-100 border-yellow-400" : "bg-red-100 border-red-400"
          }`}
        >
          <div className="flex items-start">
            <svg
              className={`fill-current h-6 w-6 ${status === "Warranty claimed successfully" ? "text-green-500" : status === "Warranty claimed already" ? "text-yellow-500" : "text-red-500"} mr-3`}
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              aria-labelledby="alert-title"
            >
              {status === "Warranty claimed successfully" ? <path d="M10 15l-5-5 1.41-1.41L10 12.17l4.59-4.58L16 8l-6 6z" /> : status === "Warranty claimed already" ? <path /> : <path />}
            </svg>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
              <svg
                className="fill-current h-6 w-6 cursor-pointer"
                role="button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                onClick={() => setStatus(null)} // Hide the alert when clicking the close icon
              >
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </span>
          </div>
          <div className="mt-2">
            <strong className="font-bold">{status === "Warranty claimed successfully" ? "Success:" : status === "Warranty claimed already" ? "Info:" : "Error:"}</strong>
            <span className="block sm:inline">
              {status === "Warranty claimed successfully" ? (
                <>
                  Warranty claimed successfully.{" "}
                  <Link href="/mywarranty" className="text-blue-600 underline">
                    Go to My Warranties
                  </Link>
                </>
              ) : status === "Warranty claimed already" ? (
                <>
                  Warranty claimed already.{" "}
                  <Link href="/mywarranty" className="text-blue-600 underline">
                    Go to My Warranties
                  </Link>
                </>
              ) : (
                status
              )}
            </span>
          </div>
        </div>
      )}
      <div className="flex flex-col items-center">
        <input type="text" value={warrantyCode} onChange={handleWarrantyChange} placeholder="Claim Warranty" className="p-2 border border-gray-300 text-black rounded" />
        <button onClick={handleSendWarranty} className="w-60  p-2 bg-blue-500 text-white rounded mt-2">
          Send
        </button>
      </div>
    </main>
  );
};

export default ClaimWarranty;
