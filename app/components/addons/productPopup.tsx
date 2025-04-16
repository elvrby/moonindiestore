// app/components/addons/productPopup.tsx

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { products, Product as ProductType } from '@/app/data/products'; // pastikan path-nya sesuai

// Props untuk menampilkan popup produk
interface ProductPopupProps {
  productId: number;
  onClose: () => void;
}

// Fungsi bantu untuk mem-parsing harga dari string menjadi number
// Misalnya, jika price = "135.000 - 95.000", kita ambil angka "95.000"
function parsePrice(price: string): number {
  // Pisahkan string berdasarkan tanda "-"
  const parts = price.split('-');
  // Ambil bagian paling akhir dan hilangkan karakter non-digit (misalnya titik, spasi, dll)
  const value = parts[parts.length - 1].trim().replace(/[^\d]/g, '');
  return parseInt(value, 10);
}

// Daftar kota di Indonesia untuk dropdown
const cities = [
  'Jakarta',
  'Bogor',
  'Depok',
  'Tangerang',
  'Bekasi',
  'Bandung',
  'Surabaya',
  'Medan',
  'Semarang',
];

// Daftar jasa pengiriman dengan harga per 1kg
const shippingServices = [
  { name: 'JNE', cost: 20000 },
  { name: 'SiCepat', cost: 15000 },
  { name: 'Grab Instant', cost: 26000 },
];

export default function ProductPopup({ productId, onClose }: ProductPopupProps) {
  // Ambil produk berdasarkan productId dari data yang di-import
  const product: ProductType | undefined = products.find((p) => p.id === productId);

  // Jika produk tidak ditemukan, tampilkan pesan error sederhana
  if (!product) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded-lg max-w-md">
          <p>Produk tidak ditemukan.</p>
          <button onClick={onClose} className="mt-4 border px-4 py-2">
            Tutup
          </button>
        </div>
      </div>
    );
  }

  // Parse harga produk dari string menjadi number untuk perhitungan
  const basePrice = parsePrice(product.price);

  // State untuk jumlah pembelian, jasa pengiriman, kota pengiriman, dan total harga
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedShipping, setSelectedShipping] = useState<string>('JNE');
  const [selectedCity, setSelectedCity] = useState<string>('Jakarta');
  const [totalPrice, setTotalPrice] = useState<number>(0);

  const router = useRouter();

  // Update total harga setiap ada perubahan quantity, jasa pengiriman, atau harga dasar produk
  useEffect(() => {
    const shipping = shippingServices.find(
      (s) => s.name === selectedShipping
    );
    // Asumsi berat 1kg per item
    const shippingCost = shipping ? shipping.cost * quantity : 0;
    const productsCost = basePrice * quantity;
    setTotalPrice(productsCost + shippingCost);
  }, [quantity, selectedShipping, basePrice]);

  // Handle perubahan input quantity
  const handleQuantityChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      setQuantity(val);
    }
  };

  // Handle perubahan pilihan jasa pengiriman
  const handleShippingChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedShipping(e.target.value);
  };

  // Handle perubahan pilihan kota
  const handleCityChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    setSelectedCity(city);
    // Daftar kota Jabodetabek
    const jabodetabek = ['Jakarta', 'Bogor', 'Depok', 'Tangerang', 'Bekasi'];
    // Jika kota yang dipilih bukan Jabodetabek dan opsi Grab Instant sedang dipilih, kembalikan ke default
    if (!jabodetabek.includes(city) && selectedShipping === 'Grab Instant') {
      setSelectedShipping('JNE');
    }
  };

  // Fungsi untuk proses pembayaran dengan memanggil API dan mengarahkan ke Midtrans Snap
  const handlePayment = async () => {
    const orderId = `order-${Date.now()}`; // <= aman dan pendek
    try {
      const response = await fetch('/api/midtrans/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totalPrice,
          orderId,
        }),
      });
  
      // Pastikan response dalam format JSON
      const data = await response.json();
      if (response.ok && data.token) {
        if (window.snap) {
          window.snap.pay(data.token, {
            onSuccess: function (result) {
              console.log('Payment success:', result);
              router.push('/');
            },
            onPending: function (result) {
              console.log('Payment pending:', result);
            },
            onError: function (result) {
              console.log('Payment error:', result);
            },
            onClose: function () {
              console.log('Popup ditutup tanpa menyelesaikan pembayaran.');
            },
          });
        } else {
          alert('Snap JS belum dimuat.');
        }
      } else {
        alert(`Gagal membuat transaksi: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saat memproses pembayaran:', error);
      alert('Terjadi kesalahan. Silahkan coba lagi.');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="box p-6 rounded-lg w-full max-w-md">
        {/* Tombol close */}
        <div className="flex justify-end">
          <button className="text-gray-500" onClick={onClose}>X</button>
        </div>

        {/* Detail Produk */}
        <h2 className="text-xl font-bold mb-2">{product.title}</h2>
        <p className="mb-4">{product.description}</p>
        <p className="mb-4">Harga per item: Rp{basePrice.toLocaleString()}</p>

        {/* Input Quantity */}
        <div className="mb-4">
          <label htmlFor="quantity" className="block mb-1">Quantity:</label>
          <input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={handleQuantityChange}
            className="border px-2 py-1 w-full"
          />
        </div>

        {/* Dropdown Jasa Pengiriman */}
        <div className="mb-4">
          <label htmlFor="shipping" className="block mb-1">Jasa Pengiriman:</label>
          <select
            id="shipping"
            value={selectedShipping}
            onChange={handleShippingChange}
            className="border border-zinc-700 px-2 py-1 w-full box"
          >
            {shippingServices.map((service) => {
              // Nonaktifkan Grab Instant jika kota bukan dari Jabodetabek
              const isGrabDisabled =
                service.name === 'Grab Instant' &&
                !['Jakarta', 'Bogor', 'Depok', 'Tangerang', 'Bekasi'].includes(selectedCity);
              return (
                <option key={service.name} value={service.name} disabled={isGrabDisabled}>
                  {service.name} (Rp{service.cost.toLocaleString()}/kg)
                </option>
              );
            })}
          </select>
        </div>

        {/* Dropdown Kota Pengiriman */}
        <div className="mb-4">
          <label htmlFor="city" className="block mb-1">Kota Pengiriman:</label>
          <select
            id="city"
            value={selectedCity}
            onChange={handleCityChange}
            className="border border-zinc-700 px-2 py-1 w-full box"
          >
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Tampilkan total harga */}
        <div className="mb-4">
          <p className="font-bold">Total Harga: Rp{totalPrice.toLocaleString()}</p>
        </div>

        {/* Tombol bayar */}
        <button
          onClick={handlePayment}
          className="w-full py-2 bg-green-500 text-white rounded"
        >
          Bayar
        </button>
      </div>
    </div>
  );
}
