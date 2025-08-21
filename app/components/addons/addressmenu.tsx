// components/addressmenu.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/libs/firebase/config";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { CITY_LIST, getKecamatanList, getKelurahanList, getPostalCode, type ShippingAddress } from "../../data/locations";

type Props = {
  open: boolean;
  userUid: string;
  initial?: ShippingAddress | null;
  onClose: () => void;
  onSaved: (addr: ShippingAddress | null) => void; // bisa null jika dihapus
};

const EMPTY_ADDR: ShippingAddress = {
  name: "",
  phone: "",
  addressLine: "",
  city: "",
  kecamatan: "",
  kelurahan: "",
  postalCode: "",
};

export default function AddressMenu({ open, userUid, initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState<ShippingAddress>(initial ?? EMPTY_ADDR);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // state untuk modal konfirmasi hapus
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Hydrate form ketika modal dibuka / initial berubah
  useEffect(() => {
    if (!open) return;
    setForm(initial ?? EMPTY_ADDR);
    setSaving(false);
    setError(null);
    setConfirmOpen(false);
  }, [open, initial]);

  const kecamatanOptions = useMemo(() => getKecamatanList(form.city), [form.city]);
  const kelurahanOptions = useMemo(() => getKelurahanList(form.city, form.kecamatan), [form.city, form.kecamatan]);

  // Isi kode pos otomatis ketika kelurahan dipilih
  useEffect(() => {
    if (!form.city || !form.kecamatan || !form.kelurahan) return;
    const code = getPostalCode(form.city, form.kecamatan, form.kelurahan);
    setForm((prev) => (prev.postalCode === code ? prev : { ...prev, postalCode: code }));
  }, [form.city, form.kecamatan, form.kelurahan]);

  // Reset turunan hanya saat user mengganti select
  const onChange = (key: keyof ShippingAddress, val: string) => {
    setForm((prev) => {
      if (key === "city") {
        return { ...prev, city: val, kecamatan: "", kelurahan: "", postalCode: "" };
      }
      if (key === "kecamatan") {
        return { ...prev, kecamatan: val, kelurahan: "", postalCode: "" };
      }
      if (key === "kelurahan") {
        return { ...prev, kelurahan: val }; // postalCode diisi otomatis oleh effect
      }
      return { ...prev, [key]: val } as ShippingAddress;
    });
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return "Nama pembeli wajib diisi.";
    if (!form.phone.trim()) return "Nomor telepon wajib diisi.";
    if (!form.addressLine.trim()) return "Alamat rumah/jalan wajib diisi.";
    if (!form.city) return "Kota wajib dipilih.";
    if (!form.kecamatan) return "Kecamatan wajib dipilih.";
    if (!form.kelurahan) return "Kelurahan wajib dipilih.";
    if (!form.postalCode) return "Kode pos tidak ditemukan.";
    return null;
  };

  const save = async () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    try {
      setSaving(true);
      await setDoc(doc(db, "users", userUid), { shippingAddress: { ...form, updatedAt: new Date() } }, { merge: true });
      onSaved(form);
      onClose();
    } catch (e) {
      console.error(e);
      setError("Gagal menyimpan alamat. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      setSaving(true);
      await updateDoc(doc(db, "users", userUid), { shippingAddress: null });
      onSaved(null);
      setConfirmOpen(false);
      onClose();
    } catch (e) {
      console.error(e);
      setError("Gagal menghapus alamat. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[92] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      {/* Container modal: fullscreen di mobile, card di sm+ */}
      <div className="bg-white w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl shadow-2xl overflow-hidden animate-slideUp flex flex-col">
        {/* Header (sticky di mobile) */}
        <div className="bg-gradient-to-r from-black to-gray-800 p-4 sm:p-5 text-white relative sticky top-0 z-10">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-bold">Alamat Penerima</h2>
            <button onClick={onClose} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition shrink-0" aria-label="Tutup">
              <span className="text-xl">×</span>
            </button>
          </div>
          <p className="text-gray-300 text-xs sm:text-sm mt-1">Pilih Kota → Kecamatan → Kelurahan. Kode pos otomatis.</p>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-black">
          {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

          {/* nama / telp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Pembeli</label>
              <input
                type="text"
                inputMode="text"
                autoComplete="name"
                value={form.name}
                onChange={(e) => onChange("name", e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nomor Telepon</label>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => onChange("phone", e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-black"
              />
            </div>
          </div>

          {/* alamat baris */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat (Jalan, RT/RW, No. Rumah)</label>
            <textarea
              value={form.addressLine}
              onChange={(e) => onChange("addressLine", e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-black min-h-[84px]"
            />
          </div>

          {/* kota / kec / kel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Kota</label>
              <select value={form.city} onChange={(e) => onChange("city", e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-black bg-gray-50">
                <option value="" disabled>
                  Pilih kota
                </option>
                {CITY_LIST.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Kecamatan</label>
              <select
                value={form.kecamatan}
                onChange={(e) => onChange("kecamatan", e.target.value)}
                disabled={!form.city}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-black bg-gray-50 disabled:opacity-60"
              >
                <option value="" disabled>
                  {form.city ? "Pilih kecamatan" : "Pilih kota dahulu"}
                </option>
                {kecamatanOptions.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Kelurahan</label>
              <select
                value={form.kelurahan}
                onChange={(e) => onChange("kelurahan", e.target.value)}
                disabled={!form.kecamatan}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-black bg-gray-50 disabled:opacity-60"
              >
                <option value="" disabled>
                  {form.kecamatan ? "Pilih kelurahan" : "Pilih kecamatan dahulu"}
                </option>
                {kelurahanOptions.map((kel) => (
                  <option key={kel} value={kel}>
                    {kel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* kode pos (auto) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Kode Pos</label>
              <input type="text" value={form.postalCode} readOnly className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 bg-gray-100 text-gray-700" />
              <p className="text-xs text-gray-500 mt-1">Otomatis dari kelurahan</p>
            </div>
          </div>
        </div>

        {/* Footer actions (sticky di mobile) */}
        <div className="p-4 sm:p-5 border-t bg-white sticky bottom-0 z-10">
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between sm:items-center">
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={saving || !initial}
              className={`w-full sm:w-auto px-4 py-2 rounded-xl font-semibold border ${
                saving || !initial ? "text-gray-400 border-gray-300 cursor-not-allowed" : "text-red-600 border-red-600 hover:bg-red-50"
              }`}
            >
              Hapus
            </button>
            <div className="flex gap-3">
              <button onClick={onClose} className="w-full sm:w-auto px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 font-medium text-black">
                Batal
              </button>
              <button
                onClick={save}
                disabled={saving}
                className={`w-full sm:w-auto px-4 py-2 rounded-xl font-semibold text-white ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"}`}
              >
                {saving ? "Menyimpan..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal konfirmasi hapus */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[93] flex items-center justify-center bg-black/70 p-0 sm:p-4 animate-fadeIn">
          <div className="w-full h-[100dvh] sm:h-auto sm:max-w-sm bg-white text-black shadow-2xl overflow-hidden animate-scaleIn rounded-none sm:rounded-2xl flex flex-col">
            {/* Header konfirmasi (sticky di mobile) */}
            <div className="p-4 sm:p-5 border-b">
              <h3 className="text-lg sm:text-xl font-bold text-center">Hapus Alamat?</h3>
            </div>

            <div className="p-5 flex-1 flex flex-col items-center justify-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <span className="text-3xl">⚠️</span>
              </div>
              <p className="mt-1 text-center text-gray-600">Apakah Anda yakin ingin menghapus alamat ini? Tindakan ini tidak bisa dibatalkan.</p>
            </div>

            {/* Footer konfirmasi (sticky di mobile) */}
            <div className="p-4 sm:p-5 border-t bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={() => setConfirmOpen(false)} className="w-full py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 font-medium">
                  Batal
                </button>
                <button onClick={remove} disabled={saving} className={`w-full py-2.5 rounded-xl font-semibold text-white ${saving ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}>
                  {saving ? "Menghapus..." : "Hapus"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
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
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scaleIn {
          animation: scaleIn 0.18s ease-out;
        }
      `}</style>
    </div>
  );
}
