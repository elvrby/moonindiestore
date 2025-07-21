"use client"; // Ensure this is at the top of the file

import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firebaseFirestore } from "@/libs/firebase/config";
import jsPDF from "jspdf";
import { onAuthStateChanged } from "@/libs/firebase/auth"; // Import the auth function
import { useRouter } from "next/navigation"; // Import useRouter for redirection

const MyWarranty: React.FC = () => {
  const [warrantyCode, setWarrantyCode] = useState("");
  const [warranty, setWarranty] = useState<any | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Initialize router

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((authUser) => {
      if (authUser) {
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleWarrantyCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWarrantyCode(e.target.value);
  };

  const handleSearchWarranty = async () => {
    if (warrantyCode.trim() === "") {
      setStatus("Warranty code cannot be empty");
      return;
    }

    try {
      const q = query(collection(firebaseFirestore, "warranty"), where("warrantyCode", "==", warrantyCode));

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setStatus("Warranty not found or you filled incorrectly");
        setWarranty(null);
        return;
      }

      const warrantyData = snapshot.docs[0].data();

      if (warrantyData.claimed) {
        setWarranty({ id: snapshot.docs[0].id, ...warrantyData });
        setStatus(null);
      } else {
        setStatus("Warranty not claimed yet. Redirecting to claim warranty...");
        setTimeout(() => {
          router.push("/claimwarranty"); // Redirect to /claimwarranty after a short delay
        }, 2000); // Delay for 2 seconds to show the error message
      }
    } catch (error) {
      console.error("Error fetching warranty", error);
      setStatus("Error fetching warranty");
    }
  };

  const handlePrint = (warranty: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    // Helper function to add gradient-like effect
    const addGradientBackground = () => {
      // Main background
      doc.setFillColor(248, 250, 252); // Light gray-blue
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Top gradient section
      doc.setFillColor(59, 130, 246); // Blue-500
      doc.rect(0, 0, pageWidth, 60, "F");

      // Lighter blue overlay
      doc.setFillColor(96, 165, 250); // Blue-400
      doc.rect(0, 0, pageWidth, 40, "F");
    };

    // Add background
    addGradientBackground();

    // Company Header Section
    doc.setFillColor(255, 255, 255);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("WARRANTY CERTIFICATE", pageWidth / 2, 25, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(219, 234, 254); // Blue-100
    doc.text("Official Warranty Documentation", pageWidth / 2, 35, { align: "center" });

    // Main content card
    const cardY = 70;
    const cardHeight = 140;

    // Card background with shadow effect
    doc.setFillColor(240, 240, 240); // Shadow
    doc.rect(margin + 2, cardY + 2, pageWidth - margin * 2, cardHeight, "F");

    doc.setFillColor(255, 255, 255); // Main card
    doc.rect(margin, cardY, pageWidth - margin * 2, cardHeight, "F");

    // Card border
    doc.setLineWidth(0.5);
    doc.setDrawColor(229, 231, 235); // Gray-200
    doc.rect(margin, cardY, pageWidth - margin * 2, cardHeight);

    // Status badge
    const badgeY = cardY + 15;
    doc.setFillColor(34, 197, 94); // Green-500
    doc.rect(margin + 15, badgeY, 50, 12, "F");

    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("ACTIVE", margin + 25, badgeY + 8);

    // Warranty details section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text("Warranty Information", margin + 15, cardY + 40);

    // Warranty code section
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.text("WARRANTY CODE", margin + 15, cardY + 55);

    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(warranty.warrantyCode, margin + 15, cardY + 65);

    // Expiration date section
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text("EXPIRATION DATE", margin + 15, cardY + 80);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    const expirationDate = new Date(warranty.expiration.seconds * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(expirationDate, margin + 15, cardY + 90);

    // Issue date section
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text("ISSUE DATE", margin + 15, cardY + 105);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    const issueDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(issueDate, margin + 15, cardY + 115);

    // Status section (right side)
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text("STATUS", pageWidth - margin - 60, cardY + 55);

    doc.setFontSize(14);
    doc.setTextColor(34, 197, 94); // Green-500
    doc.text("VALID & ACTIVE", pageWidth - margin - 60, cardY + 65);

    // Additional warranty info (right side)
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text("CERTIFICATE ID", pageWidth - margin - 60, cardY + 80);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`WRC-${warranty.warrantyCode}`, pageWidth - margin - 60, cardY + 90);

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text("VERIFIED", pageWidth - margin - 60, cardY + 105);

    doc.setFontSize(12);
    doc.setTextColor(34, 197, 94);
    doc.text("✓ AUTHENTIC", pageWidth - margin - 60, cardY + 115);

    // Bottom section with terms
    const termsY = cardY + cardHeight + 20;

    // Terms header
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Terms & Conditions", margin, termsY);

    // Terms content
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    const terms = [
      "• This warranty is valid only with the original purchase receipt",
      "• Coverage includes manufacturing defects and material failures",
      "• Warranty does not cover damage from misuse, accidents, or normal wear",
      "• For warranty claims, contact customer service with this certificate",
    ];

    let currentY = termsY + 10;
    terms.forEach((term) => {
      doc.text(term, margin, currentY);
      currentY += 6;
    });

    // Footer section
    const footerY = pageHeight - 40;

    // Footer background
    doc.setFillColor(249, 250, 251); // Gray-50
    doc.rect(0, footerY, pageWidth, 40, "F");

    // Footer border
    doc.setLineWidth(0.5);
    doc.setDrawColor(229, 231, 235);
    doc.line(0, footerY, pageWidth, footerY);

    // Company info
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99); // Gray-600
    doc.text("Akimania", margin, footerY + 15);
    doc.text("akimaniastore1@gmail.com | +1 (555) 123-4567", margin, footerY + 25);

    // Generated date
    const generatedDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.text(`Generated: ${generatedDate}`, pageWidth - margin - 60, footerY + 15);

    // Certificate ID
    doc.text(`Certificate ID: WRC-${warranty.warrantyCode}`, pageWidth - margin - 60, footerY + 25);

    // Save the PDF
    doc.save(`warranty_certificate_${warranty.warrantyCode}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Warranties</h1>
          <p className="text-gray-600">Search and manage your warranty information</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Warranty Code</label>
              <input
                type="text"
                value={warrantyCode}
                onChange={handleWarrantyCodeChange}
                placeholder="Enter your warranty code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearchWarranty}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Status Alert */}
        {status && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-800">{status}</p>
              </div>
              <div className="flex-shrink-0 ml-auto">
                <button onClick={() => setStatus(null)} className="text-red-500 hover:text-red-700 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
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

        {/* Warranty Card */}
        {warranty && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 rounded-full p-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Warranty Active</h2>
                    <p className="text-green-100 text-sm">Your warranty is valid and active</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1">
                    <span className="text-white text-sm font-medium">VERIFIED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Warranty Details */}
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Warranty Code</h3>
                    <p className="text-2xl font-bold text-gray-800 font-mono">{warranty.warrantyCode}</p>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Expiration Date</h3>
                    <p className="text-lg font-semibold text-gray-800">
                      {new Date(warranty.expiration.seconds * 1000).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Status</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-600 font-medium">Active & Valid</span>
                    </div>
                  </div>
                </div>

                {/* Visual Elements */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-600 text-center text-sm">Your warranty is protected and verified</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => handlePrint(warranty)}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  Print Warranty Receipt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyWarranty;
