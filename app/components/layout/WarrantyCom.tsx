"use client";
import Link from "next/link";
import { Inter } from "next/font/google";
import React, { useState } from "react";

const inter = Inter({ subsets: ["latin"] });

const IndexMain: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", content: "" });

  const openModal = (title: string, content: string) => {
    setModalContent({ title, content });
    setIsModalOpen(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent({ title: "", content: "" });
    // Restore body scroll
    document.body.style.overflow = "unset";
  };

  // Close modal when clicking outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const modalContents = {
    about: {
      title: "About Us",
      content: `
        <div class="space-y-4">
          <p class="text-gray-700 text-sm sm:text-base">Akimania adalah platform garansi terdepan yang berkomitmen memberikan solusi terbaik dalam mengelola garansi produk elektronik Anda.</p>
          
          <h4 class="font-semibold text-gray-900 mt-6 text-base sm:text-lg">Visi Kami</h4>
          <p class="text-gray-700 text-sm sm:text-base">Menjadi platform garansi nomor satu di Indonesia yang memberikan kemudahan dan kepercayaan dalam setiap transaksi garansi.</p>
          
          <h4 class="font-semibold text-gray-900 mt-6 text-base sm:text-lg">Misi Kami</h4>
          <ul class="list-disc pl-5 space-y-2 text-gray-700 text-sm sm:text-base">
            <li>Memberikan layanan garansi yang cepat dan terpercaya</li>
            <li>Membangun ekosistem garansi digital yang mudah diakses</li>
            <li>Menjamin kepuasan pelanggan dengan layanan 24/7</li>
          </ul>
        </div>
      `,
    },
    privacy: {
      title: "Privacy Policy",
      content: `
        <div class="space-y-4">
          <p class="text-gray-700 text-sm sm:text-base">Kebijakan Privasi ini menjelaskan bagaimana Akimania mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda.</p>
          
          <h4 class="font-semibold text-gray-900 mt-6 text-base sm:text-lg">Informasi yang Kami Kumpulkan</h4>
          <ul class="list-disc pl-5 space-y-2 text-gray-700 text-sm sm:text-base">
            <li>Informasi identitas pribadi (nama, email, nomor telepon)</li>
            <li>Informasi produk dan garansi</li>
            <li>Data penggunaan aplikasi</li>
          </ul>
          
          <h4 class="font-semibold text-gray-900 mt-6 text-base sm:text-lg">Bagaimana Kami Menggunakan Informasi</h4>
          <ul class="list-disc pl-5 space-y-2 text-gray-700 text-sm sm:text-base">
            <li>Memproses klaim garansi Anda</li>
            <li>Memberikan layanan customer support</li>
            <li>Meningkatkan kualitas layanan kami</li>
          </ul>
          
          <h4 class="font-semibold text-gray-900 mt-6 text-base sm:text-lg">Keamanan Data</h4>
          <p class="text-gray-700 text-sm sm:text-base">Kami menggunakan enkripsi tingkat enterprise untuk melindungi data pribadi Anda.</p>
        </div>
      `,
    },
    terms: {
      title: "Terms of Service",
      content: `
        <div class="space-y-4">
          <p class="text-gray-700 text-sm sm:text-base">Syarat dan Ketentuan penggunaan platform Akimania yang berlaku efektif sejak 1 Januari 2024.</p>
          
          <h4 class="font-semibold text-gray-900 mt-6 text-base sm:text-lg">Penggunaan Layanan</h4>
          <ul class="list-disc pl-5 space-y-2 text-gray-700 text-sm sm:text-base">
            <li>Pengguna wajib memberikan informasi yang akurat dan lengkap</li>
            <li>Satu akun hanya boleh digunakan oleh satu orang</li>
            <li>Dilarang menggunakan layanan untuk tujuan ilegal</li>
          </ul>
          
          <h4 class="font-semibold text-gray-900 mt-6 text-base sm:text-lg">Garansi dan Klaim</h4>
          <ul class="list-disc pl-5 space-y-2 text-gray-700 text-sm sm:text-base">
            <li>Klaim garansi harus disertai bukti pembelian yang valid</li>
            <li>Proses verifikasi dapat memakan waktu 1-3 hari kerja</li>
            <li>Keputusan persetujuan klaim bersifat final</li>
          </ul>
          
          <h4 class="font-semibold text-gray-900 mt-6 text-base sm:text-lg">Pembatasan Tanggung Jawab</h4>
          <p class="text-gray-700 text-sm sm:text-base">Akimania tidak bertanggung jawab atas kerusakan yang terjadi akibat penyalahgunaan produk.</p>
        </div>
      `,
    },
    contact: {
      title: "Contact",
      content: `
        <div class="space-y-4">
          <p class="text-gray-700 text-sm sm:text-base">Hubungi tim kami untuk pertanyaan, saran, atau bantuan terkait layanan Akimania.</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6">
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Informasi Kontak</h4>
              <div class="space-y-2 text-gray-700 text-xs sm:text-sm">
                <p><strong>Email:</strong> support@akimania.com</p>
                <p><strong>Telepon:</strong> +62 21 1234 5678</p>
                <p><strong>WhatsApp:</strong> +62 812 3456 7890</p>
              </div>
            </div>
            
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Alamat Kantor</h4>
              <p class="text-gray-700 text-xs sm:text-sm">
                Jl. Sudirman No. 123<br>
                Jakarta Pusat 10220<br>
                Indonesia
              </p>
            </div>
          </div>
          
          <div class="mt-6">
            <h4 class="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Jam Operasional</h4>
            <div class="text-gray-700 text-xs sm:text-sm">
              <p><strong>Senin - Jumat:</strong> 08:00 - 17:00 WIB</p>
              <p><strong>Sabtu:</strong> 09:00 - 15:00 WIB</p>
              <p><strong>Minggu:</strong> Tutup</p>
              <p class="mt-2 text-xs sm:text-sm text-purple-600"><strong>Support Online 24/7 melalui chat</strong></p>
            </div>
          </div>
        </div>
      `,
    },
    help: {
      title: "Help Center",
      content: `
        <div class="space-y-4">
          <p class="text-gray-700 text-sm sm:text-base">Pusat bantuan Akimania dengan panduan lengkap penggunaan platform garansi.</p>
          
          <h4 class="font-semibold text-gray-900 mt-6 text-base sm:text-lg">Panduan Umum</h4>
          <div class="space-y-3">
            <div class="border-l-4 border-purple-500 pl-4">
              <h5 class="font-medium text-gray-900 text-sm sm:text-base">Cara Mendaftar Akun</h5>
              <p class="text-gray-700 text-xs sm:text-sm">Langkah-langkah membuat akun baru di platform Akimania</p>
            </div>
            <div class="border-l-4 border-blue-500 pl-4">
              <h5 class="font-medium text-gray-900 text-sm sm:text-base">Cara Mengajukan Klaim Garansi</h5>
              <p class="text-gray-700 text-xs sm:text-sm">Tutorial lengkap proses pengajuan klaim garansi produk</p>
            </div>
            <div class="border-l-4 border-green-500 pl-4">
              <h5 class="font-medium text-gray-900 text-sm sm:text-base">Memantau Status Garansi</h5>
              <p class="text-gray-700 text-xs sm:text-sm">Cara melihat dan melacak status garansi produk Anda</p>
            </div>
          </div>
          
          <h4 class="font-semibold text-gray-900 mt-6 text-base sm:text-lg">Troubleshooting</h4>
          <ul class="list-disc pl-5 space-y-1 text-gray-700 text-sm sm:text-base">
            <li>Lupa password akun</li>
            <li>Gagal upload dokumen</li>
            <li>Klaim ditolak</li>
            <li>Masalah pembayaran</li>
          </ul>
          
          <div class="mt-6 p-4 bg-blue-50 rounded-lg">
            <p class="text-blue-800 text-sm sm:text-base"><strong>Butuh bantuan lebih lanjut?</strong></p>
            <p class="text-blue-700 text-xs sm:text-sm">Hubungi customer service kami di support@akimania.com atau chat langsung melalui website.</p>
          </div>
        </div>
      `,
    },
    faq: {
      title: "FAQ",
      content: `
        <div class="space-y-4">
          <p class="text-gray-700 text-sm sm:text-base">Pertanyaan yang sering diajukan tentang layanan Akimania.</p>
          
          <div class="space-y-4 mt-6">
            <div class="border border-gray-200 rounded-lg p-4">
              <h5 class="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Bagaimana cara klaim garansi?</h5>
              <p class="text-gray-700 text-xs sm:text-sm">Klik Button Klaim Garansi dan masukan order id pesanan di E-Commerce</p>
            </div>
            
            <div class="border border-gray-200 rounded-lg p-4">
              <h5 class="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Bagaimana cara lihat garansi?</h5>
              <p class="text-gray-700 text-xs sm:text-sm">Masuk ke halaman Lihat Garansi dan masukan order id pesanan anda di E-Commerce</p>
            </div>
            
            <div class="border border-gray-200 rounded-lg p-4">
              <h5 class="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Apakah ada biaya untuk menggunakan layanan ini?</h5>
              <p class="text-gray-700 text-xs sm:text-sm">Layanan Akimania gratis untuk konsumen. Biaya ditanggung oleh kami yang terdaftar dalam sistem kami.</p>
            </div>
            
            <div class="border border-gray-200 rounded-lg p-4">
              <h5 class="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Bagaimana jika klaim saya ditolak?</h5>
              <p class="text-gray-700 text-xs sm:text-sm">Anda akan menerima email dengan alasan penolakan. Anda dapat mengajukan banding dengan melengkapi dokumen yang diperlukan.</p>
            </div>
            
            <div class="border border-gray-200 rounded-lg p-4">
              <h5 class="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Apakah bisa klaim garansi untuk produk lama?</h5>
              <p class="text-gray-700 text-xs sm:text-sm">Ya, selama produk masih dalam masa garansi resmi dan memiliki bukti pembelian yang valid.</p>
            </div>
          </div>
          
          <div class="mt-6 p-4 bg-gray-50 rounded-lg">
            <p class="text-gray-800 text-sm sm:text-base"><strong>Tidak menemukan jawaban yang Anda cari?</strong></p>
            <p class="text-gray-600 text-xs sm:text-sm">Hubungi tim support kami untuk bantuan personal.</p>
          </div>
        </div>
      `,
    },
  };

  return (
    <main className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 ${inter.className}`}>
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Akimania</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="/" className="text-gray-600 hover:text-purple-600 transition-colors">
                Home
              </a>
              <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">
                Support
              </a>
              <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 text-purple-800 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
              Warranty Management System
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Kelola Garansi Anda
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">Dengan Mudah</span>
            </h1>

            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Sistem garansi terpadu yang memungkinkan Anda untuk mengklaim dan memantau status garansi produk dengan cepat dan efisien.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Link href="/warranty/claimwarranty" passHref>
                <button className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 min-w-[200px]">
                  <span className="relative z-10 flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Klaim Garansi
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-purple-800 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </Link>

              <Link href="/warranty/mywarranty" passHref>
                <button className="group relative px-8 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 min-w-[200px]">
                  <span className="relative z-10 flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Lihat Garansi
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-purple-200 rounded-full opacity-60 animate-bounce"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-blue-200 rounded-full opacity-40 animate-pulse"></div>
        <div className="absolute bottom-40 left-20 w-12 h-12 bg-yellow-200 rounded-full opacity-50 animate-bounce delay-1000"></div>
      </div>

      {/* Features Section */}
      <div className="bg-white/60 backdrop-blur-sm py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Mengapa Memilih Kami?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Solusi garansi yang komprehensif dengan teknologi terkini</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Proses Cepat</h3>
              <p className="text-gray-600">Klaim garansi Anda hanya dalam hitungan menit dengan sistem otomatis kami</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Aman & Terpercaya</h3>
              <p className="text-gray-600">Data Anda dilindungi dengan enkripsi tingkat enterprise yang aman</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.944l1.732 1 1.732-1L12 2.944zM12 21.056l-1.732-1-1.732 1L12 21.056z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Support 24/7</h3>
              <p className="text-gray-600">Tim customer service kami siap membantu Anda kapan saja</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">10K+</div>
              <div className="text-gray-600">Garansi Diproses</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">5K+</div>
              <div className="text-gray-600">Customer Puas</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-yellow-600 mb-2">24/7</div>
              <div className="text-gray-600">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Akimania</span>
              </div>
              <p className="text-gray-600 mb-4 max-w-md">Platform garansi terdepan yang memberikan pengalaman terbaik dalam mengelola garansi produk Anda.</p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-purple-100 transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-purple-100 transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => openModal(modalContents.about.title, modalContents.about.content)} className="text-gray-600 hover:text-purple-600 transition-colors text-left">
                    About Us
                  </button>
                </li>
                <li>
                  <button onClick={() => openModal(modalContents.privacy.title, modalContents.privacy.content)} className="text-gray-600 hover:text-purple-600 transition-colors text-left">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button onClick={() => openModal(modalContents.terms.title, modalContents.terms.content)} className="text-gray-600 hover:text-purple-600 transition-colors text-left">
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button onClick={() => openModal(modalContents.contact.title, modalContents.contact.content)} className="text-gray-600 hover:text-purple-600 transition-colors text-left">
                    Contact
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => openModal(modalContents.help.title, modalContents.help.content)} className="text-gray-600 hover:text-purple-600 transition-colors text-left">
                    Help Center
                  </button>
                </li>
                <li>
                  <button onClick={() => openModal(modalContents.faq.title, modalContents.faq.content)} className="text-gray-600 hover:text-purple-600 transition-colors text-left">
                    FAQ
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-gray-600">
              © 2024 <span className="font-semibold">Akimania™</span>. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Enhanced Responsive Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50" onClick={handleOverlayClick}>
          <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate pr-4">{modalContent.title}</h2>
              <button onClick={closeModal} className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors" aria-label="Close modal">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-160px)]">
              <div dangerouslySetInnerHTML={{ __html: modalContent.content }} className="prose prose-sm sm:prose max-w-none" />
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeModal}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default IndexMain;
