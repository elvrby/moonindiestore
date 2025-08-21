// data/locations.ts
export type CityName = string;
// CityData: { [kecamatan]: { [kelurahan]: postalCode } }
export type CityData = Record<string, Record<string, string>>;
export type CityDataMap = Record<CityName, CityData>;

export type ShippingAddress = {
  name: string;
  phone: string;
  addressLine: string;
  city: string; // ex: "Jakarta Barat"
  kecamatan: string; // dependent by city
  kelurahan: string; // dependent by kecamatan
  postalCode: string; // auto from kelurahan
};

/**
 * Kumpulan data lokasi Pulau Jawa dalam satu file.
 * Struktur: { [kota]: { [kecamatan]: { [kelurahan]: "kodepos" } } }
 * Tambahkan kota/kecamatan/kelurahan baru langsung di sini.
 */
export const LOCATION_DATA: CityDataMap = {
  /* =========================
   * D K I  J A K A R T A
   * ========================= */
  "Jakarta Barat": {
    Cengkareng: {
      "Cengkareng Barat": "11730",
      "Cengkareng Timur": "11730",
      "Duri Kosambi": "11750",
      "Kedaung Kali Angke": "11710",
      Kapuk: "11720",
      "Rawa Buaya": "11740",
    },
    "Grogol Petamburan": {
      Grogol: "11450",
      Jelambar: "11460",
      "Jelambar Baru": "11460",
      "Tanjung Duren Utara": "11470",
      "Tanjung Duren Selatan": "11470",
      Tomang: "11440",
    },
    "Kebon Jeruk": {
      "Duri Kepa": "11510",
      "Kedoya Selatan": "11520",
      "Kedoya Utara": "11520",
      "Kebon Jeruk": "11530",
      "Sukabumi Utara": "11540",
      "Sukabumi Selatan": "11560",
    },
    Kembangan: {
      "Kembangan Utara": "11610",
      "Kembangan Selatan": "11610",
      "Meruya Utara": "11620",
      "Meruya Selatan": "11650",
      Srengseng: "11630",
    },
    Palmerah: {
      Kemanggisan: "11480",
      Palmerah: "11480",
      Slipi: "11410",
      "Kota Bambu Utara": "11420",
      "Kota Bambu Selatan": "11420",
    },
    "Taman Sari": {
      Maphar: "11160",
      Tangki: "11170",
      Krukut: "11140",
      Pinangsia: "11110",
      Glodok: "11120",
      Keagungan: "11130",
    },
  },
  "Jakarta Pusat": {
    Gambir: { Gambir: "10110", Cideng: "10150", "Duri Pulo": "10140", "Petojo Utara": "10130", "Petojo Selatan": "10160" },
    Menteng: { Menteng: "10310", Pegangsaan: "10320", Cikini: "10330", Gondangdia: "10350", "Kebon Sirih": "10340" },
    "Tanah Abang": { "Bendungan Hilir": "10210", "Karet Tengsin": "10220", "Kebon Melati": "10230", "Kebon Kacang": "10240", Petamburan: "10260" },
  },
  "Jakarta Selatan": {
    "Kebayoran Baru": { "Gandaria Utara": "12140", Gunung: "12120", "Kramat Pela": "12130", Melawai: "12160", Pulo: "12160", Selong: "12110", "Rawa Barat": "12180", "Senen?": "12170" },
    "Pasar Minggu": { "Pejaten Barat": "12510", "Pejaten Timur": "12510", Ragunan: "12550", "Jati Padang": "12540", Kebagusan: "12520" },
  },
  "Jakarta Timur": {
    Matraman: { "Pal Meriam": "13140", "Kayu Manis": "13130", "Pisangan Baru": "13110" },
    "Duren Sawit": { "Duren Sawit": "13440", "Pondok Bambu": "13430", "Pondok Kelapa": "13450" },
  },
  "Jakarta Utara": {
    Penjaringan: { Pluit: "14440", Pejagalan: "14450", "Kamal Muara": "14470", "Kapuk Muara": "14460" },
    "Kelapa Gading": { "Kelapa Gading Barat": "14240", "Kelapa Gading Timur": "14240", "Pegangsaan Dua": "14250" },
  },

  /* =========================
   * B O D E T A B E K
   * ========================= */
  Bogor: {
    "Bogor Tengah": { Pabaton: "16121", Paledang: "16122", Suryakencana: "16123", Babakan: "16128" },
    "Bogor Utara": { Cimahpar: "16158", "Kedung Halang": "16158", "Tanah Baru": "16154" },
  },
  Depok: {
    Beji: { Beji: "16421", "Beji Timur": "16422", "Kemiri Muka": "16423", Kukusan: "16425", "Pondok Cina": "16424" },
    Sukmajaya: { Abadijaya: "16417", "Bakti Jaya": "16418", Cisalak: "16416", "Mekar Jaya": "16411" },
  },
  Tangerang: {
    Ciledug: { "Larangan Indah": "15154", Paninggilan: "15153", "Sudimara Barat": "15151" },
    Karawaci: { Karawaci: "15113", "Nusa Jaya": "15116", Bugel: "15115" },
  },
  Bekasi: {
    "Bekasi Selatan": { "Kayuringin Jaya": "17144", "Pekayon Jaya": "17148", "Jaka Mulya": "17146" },
    "Bekasi Barat": { Bintara: "17134", Kranji: "17135", "Jakarta?": "17131" },
  },

  /* =========================
   * J A W A  B A R A T
   * ========================= */
  Bandung: {
    Coblong: { Dago: "40135", Lebakgede: "40132", Sekeloa: "40134" },
    Sukajadi: { Pasteur: "40161", Sukagalih: "40163", Cipedes: "40162", Sukawarna: "40164" },
    Lengkong: { Burangrang: "40262", Malabar: "40262", Cijagra: "40265", Turangga: "40264" },
  },
  Cimahi: {
    "Cimahi Utara": { Cipageran: "40511", Citeureup: "40512", "Cimahi?": "40513" },
    "Cimahi Tengah": { Baros: "40521", "Karang Mekar": "40523", "Cigugur Tengah": "40522" },
    "Cimahi Selatan": { Cibeber: "40531", "Cigugur Tengah": "40533", Leuwigajah: "40532", Melong: "40534", Utama: "40535", Cibereum: "40535" },
  },
  Cirebon: {
    Kejaksan: { Kejaksan: "45121", Kebonbaru: "45123", Sukaasih: "45122" },
    Lemahwungkuk: { Panjunan: "45111", Pekalangan: "45112" },
  },

  /* =========================
   * J A W A  T E N G A H
   * ========================= */
  Semarang: {
    Candisari: { Jatingaleh: "50254", Tegalsari: "50256", Jomblang: "50249", "Karanganyar Gunung": "50253" },
    Banyumanik: { Sumurboto: "50269", Padangsari: "50266", "Srondol Wetan": "50263", Ngesrep: "50262" },
  },
  Surakarta: {
    Banjarsari: { Manahan: "57139", Mangkubumen: "57122", Keprabon: "57122" },
    Laweyan: { Pajang: "57146", Penumping: "57141", Bumi: "57144" },
  },
  Magelang: {
    "Magelang Tengah": { Cacaban: "56111", Gelangan: "56112", Kemirirejo: "56113" },
  },

  /* =========================
   * D I  Y O G Y A K A R T A
   * ========================= */
  Yogyakarta: {
    Gondokusuman: { Demangan: "55221", Klitren: "55222", Baciro: "55225" },
    Jetis: { Cokrodiningratan: "55232", Gowongan: "55231", Bumijo: "55231" },
  },

  /* =========================
   * J A W A  T I M U R
   * ========================= */
  Surabaya: {
    Wonokromo: { Darmo: "60241", Sawunggaling: "60242", Jagir: "60244", Ngagel: "60245" },
    Tegalsari: { Kedungdoro: "60251", Keputran: "60265", Tegalsari: "60261", "Dr. Soetomo": "60264" },
    Sukolilo: { Keputih: "60111", "Gebang Putih": "60117", "Medokan Semampir": "60119", "Klampis Ngasem": "60116" },
  },
  Malang: {
    Klojen: { Kauman: "65119", "Kadilangu?": "65115", Sukoharjo: "65118" },
    Lowokwaru: { Jatimulyo: "65141", Lowokwaru: "65141", Tlogomas: "65144" },
  },
  Kediri: {
    Kota: { Banjarmlati: "64117", Kemasan: "64121", Pojok: "64121" },
  },
};

/** daftar kota yang tersedia (urut alfabet) */
export const CITY_LIST: CityName[] = Object.keys(LOCATION_DATA).sort();

/** util kecil */
export const getKecamatanList = (city: CityName): string[] => (city && LOCATION_DATA[city] ? Object.keys(LOCATION_DATA[city]) : []);

export const getKelurahanList = (city: CityName, kecamatan: string): string[] => (city && kecamatan && LOCATION_DATA[city]?.[kecamatan] ? Object.keys(LOCATION_DATA[city][kecamatan]) : []);

export const getPostalCode = (city: CityName, kecamatan: string, kelurahan: string): string => LOCATION_DATA[city]?.[kecamatan]?.[kelurahan] ?? "";
