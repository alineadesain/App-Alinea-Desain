export interface User {
  ID: string;
  Role: 'admin' | 'customer';
  KodeKhusus: string;
  Nama: string;
  NoWA: string;
  Alamat: string;
  Password: string;
  TglDaftar: string;
  Email?: string;
  Avatar?: string;
}

export interface Product {
  ID: string;
  Nama: string;
  Kategori: 'satuan' | 'meteran';
  Harga: number;
  Deskripsi: string;
  Thumbnail: string;
  Terjual: number;
  HargaDesain: number;
  HargaCutting: number;
  HargaLaminating: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  namaProduk: string;
  kategori: 'satuan' | 'meteran';
  harga: number;
  qty: number;
  panjang?: number;
  lebar?: number;
  finishing?: string;
  withDesain?: boolean;
  withCutting?: boolean;
  withLaminating?: boolean;
  jasaDesain?: number;
  jasaCutting?: number;
  jasaLaminating?: number;
  subtotal: number;
}

export interface Order {
  ID: string;
  Tgl: string;
  KodeCustomer: string;
  NamaCustomer: string;
  NoCustomer: string;
  IDProduk: string;
  NamaProduk: string;
  Kategori: 'satuan' | 'meteran';
  Qty: number;
  Panjang: number; // cm
  Lebar: number; // cm
  Finishing: string; // 'Simkel' | 'Siming' | 'Sibah' | 'Kolong' | '-'
  JasaCutting: number;
  JasaLaminating: number;
  JasaDesain: number;
  TotalHarga: number;
  NominalDP?: number;
  DP?: number;
  SisaTagihan?: number;
  StatusBayar: 'Belum Lunas' | 'DP' | 'Lunas';
  StatusOrder: 'Order Masuk' | 'Proses' | 'Selesai';
  Catatan?: string;
  Items?: OrderItem[];
}

export interface Expense {
  ID: string;
  Tgl: string;
  Total: number;
  Toko: string;
  Detail: string;
  NotaUrl?: string;
}

export interface ClientPartner {
  id: string;
  nama: string;
  logo: string;
  keterangan: string;
  kategori?: string;
}

export interface BannerSlide {
  id: string;
  tag: string;
  title: string;
  description: string;
  bgGradient: string;
  actionText: string;
  actionTarget: 'order' | 'products' | 'contact';
  imageUrl?: string;
}

export interface StoreData {
  nama_toko?: string;
  tagline?: string;
  logo_url?: string;
  running_text: string;
  running_text_speed?: number;
  alamat: string;
  kontak: string;
  rekening: string;
  clients_slider: ClientPartner[];
  banners?: BannerSlide[];
  // Google Apps Script & Spreadsheet Integration
  spreadsheet_id?: string;
  gas_web_app_url?: string;
  last_synced_at?: string;
  // WhatsApp API Gateway Settings
  wa_provider?: 'fonnte' | 'fonte' | 'flowkirim' | 'starsender' | 'custom';
  wa_api_key?: string;
  wa_api_url?: string;
  wa_sender_number?: string;
  wa_auto_order?: boolean;
  wa_auto_status?: boolean;
}
