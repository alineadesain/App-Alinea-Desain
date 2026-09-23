import { User, Product, Order, Expense, StoreData, ClientPartner, BannerSlide } from '../types';

export const DEFAULT_CLIENTS: ClientPartner[] = [
  {
    id: 'c1',
    nama: 'Universitas Gadjah Mada',
    logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=160&auto=format&fit=crop&q=80',
    keterangan: 'Cetak Buku Panduan, Banner Seminar & Sertifikat KKN',
    kategori: 'Pendidikan'
  },
  {
    id: 'c2',
    nama: 'Universitas Diponegoro',
    logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=160&auto=format&fit=crop&q=80',
    keterangan: 'Pencetakan Backdrop Wisuda & Souvenir Dies Natalis',
    kategori: 'Pendidikan'
  },
  {
    id: 'c3',
    nama: 'Rubytech Digital',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
    keterangan: 'Branding Booth Expo, X-Banner & ID Card Staff',
    kategori: 'Perusahaan'
  },
  {
    id: 'c4',
    nama: 'MyRepublic Internet',
    logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=160&auto=format&fit=crop&q=80',
    keterangan: 'Brosur Promosi 10.000 Lembar & Spanduk Jalan',
    kategori: 'Telekomunikasi'
  },
  {
    id: 'c5',
    nama: 'J&T Express Jogja',
    logo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=160&auto=format&fit=crop&q=80',
    keterangan: 'Sticker Thermal Label & Banner Promo Outlet',
    kategori: 'Logistik'
  },
  {
    id: 'c6',
    nama: 'Yayasan FKAM Indonesia',
    logo: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=160&auto=format&fit=crop&q=80',
    keterangan: 'Kalender Tahunan & Spanduk Program Sosial Ramadhan',
    kategori: 'Sosial & Dakwah'
  },
  {
    id: 'c7',
    nama: 'Dinas Kebudayaan DIY',
    logo: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=160&auto=format&fit=crop&q=80',
    keterangan: 'Buku Agenda Kebudayaan & Roll Up Banner Pameran Seni',
    kategori: 'Instansi Pemerintah'
  }
];

export const DEFAULT_BANNERS: BannerSlide[] = [
  {
    id: 'b1',
    tag: 'Promo Kilat Hari Ini',
    title: 'Cetak Cepat & Kualitas Tajam',
    description: 'Pesan banner MMT, stiker vinyl, dan kartu nama langsung tanpa antre dengan hasil presisi.',
    bgGradient: 'from-teal-700 via-teal-800 to-emerald-900',
    actionText: 'Pesan Sekarang',
    actionTarget: 'order',
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'b2',
    tag: 'Diskon Instansi & Mahasiswa',
    title: 'Paket Seminar & KKN Komplit',
    description: 'Dapatkan harga spesial untuk paket cetak spanduk, sertifikat, ID Card, dan merchandise kegiatan.',
    bgGradient: 'from-cyan-800 via-teal-800 to-slate-900',
    actionText: 'Konsultasi Desain',
    actionTarget: 'contact',
    imageUrl: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'b3',
    tag: 'Layanan Lengkap',
    title: 'Gratis Desain Ringkas & Finishing',
    description: 'Tersedia pilihan finishing MMT simkel, siming, kolong, dan laminasi glossy/doff untuk stiker.',
    bgGradient: 'from-emerald-800 via-teal-900 to-slate-900',
    actionText: 'Lihat Katalog Produk',
    actionTarget: 'products',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'
  }
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    ID: 'P1',
    Nama: 'Banner MMT 280gram (Outdoor / Indoor)',
    Kategori: 'meteran',
    Harga: 21000,
    Deskripsi: 'Bahan MMT 280gsm standar kuat untuk spanduk toko, warung, baliho, dan event outdoor. Tahan air dan panas cuaca.',
    Thumbnail: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&auto=format&fit=crop&q=80',
    Terjual: 142,
    HargaDesain: 15000,
    HargaCutting: 5000,
    HargaLaminating: 0
  },
  {
    ID: 'P2',
    Nama: 'Banner Korea MMT 440gram Tebal',
    Kategori: 'meteran',
    Harga: 38000,
    Deskripsi: 'Bahan tebal premium tidak mudah robek, warna pekat dan tahan lama untuk backdrop photobooth atau papan nama permanen.',
    Thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&auto=format&fit=crop&q=80',
    Terjual: 78,
    HargaDesain: 15000,
    HargaCutting: 5000,
    HargaLaminating: 0
  },
  {
    ID: 'P3',
    Nama: 'Sticker Vinyl A3+ Kiss Cut Anti Air',
    Kategori: 'satuan',
    Harga: 12000,
    Deskripsi: 'Stiker vinyl sheet A3+ tahan air, cocok untuk label kemasan makanan, botol minuman, dan produk UMKM. Sudah termasuk potong kiss-cut presisi.',
    Thumbnail: 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?w=400&auto=format&fit=crop&q=80',
    Terjual: 95,
    HargaDesain: 15000,
    HargaCutting: 3000,
    HargaLaminating: 4000
  },
  {
    ID: 'P4',
    Nama: 'Kartu Nama Eksklusif (1 Box / 100 Pcs)',
    Kategori: 'satuan',
    Harga: 35000,
    Deskripsi: 'Cetak 1 box isi 100 lembar kertas Art Carton 260gr dengan pilihan laminasi doff / glossy halus. Termasuk box plastik mika.',
    Thumbnail: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&auto=format&fit=crop&q=80',
    Terjual: 56,
    HargaDesain: 20000,
    HargaCutting: 0,
    HargaLaminating: 7000
  },
  {
    ID: 'P5',
    Nama: 'X-Banner 60x160 cm Komplit Rangka',
    Kategori: 'satuan',
    Harga: 65000,
    Deskripsi: 'Stand X-Banner display aluminium kokoh + cetak visual bahan MMT tajam. Praktis dibawa ke pameran atau diletakkan di depan toko.',
    Thumbnail: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=400&auto=format&fit=crop&q=80',
    Terjual: 41,
    HargaDesain: 15000,
    HargaCutting: 0,
    HargaLaminating: 10000
  },
  {
    ID: 'P6',
    Nama: 'Brosur Full Color A5 (Art Paper 120gr)',
    Kategori: 'satuan',
    Harga: 1500,
    Deskripsi: 'Brosur promosi ukuran A5 cetak tajam 2 sisi, minimal order 100 lembar. Kertas glossy cerah dan elegan.',
    Thumbnail: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&auto=format&fit=crop&q=80',
    Terjual: 230,
    HargaDesain: 25000,
    HargaCutting: 0,
    HargaLaminating: 0
  }
];

export const DEFAULT_USERS: User[] = [
  {
    ID: 'U1',
    Role: 'admin',
    KodeKhusus: '-',
    Nama: 'Admin Alinea',
    NoWA: '085815950700',
    Alamat: 'Klaten',
    Password: 'admin123',
    TglDaftar: '2025-01-01T08:00:00.000Z',
    Email: 'admin@alineadesain.com',
    Avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'
  },
  {
    ID: 'U2',
    Role: 'admin',
    KodeKhusus: '-',
    Nama: 'Kasir & CS Alinea',
    NoWA: '081987654321',
    Alamat: 'Outlet Alinea Gondokusuman',
    Password: 'admin123',
    TglDaftar: '2025-01-15T08:00:00.000Z',
    Email: 'kasir.alinea@gmail.com',
    Avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
  },
  {
    ID: 'C1',
    Role: 'customer',
    KodeKhusus: '88392011',
    Nama: 'Budi Santoso',
    NoWA: '089876543210',
    Alamat: 'Condongcatur, Depok, Sleman',
    Password: 'budi12',
    TglDaftar: '2025-02-10T10:30:00.000Z',
    Email: 'budi.santoso@gmail.com',
    Avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
  },
  {
    ID: 'C2',
    Role: 'customer',
    KodeKhusus: '19482055',
    Nama: 'Siti Rahmawati',
    NoWA: '081392817263',
    Alamat: 'Terban, Gondokusuman, Yogyakarta',
    Password: 'siti12',
    TglDaftar: '2025-02-15T14:15:00.000Z',
    Email: 'siti.rahmawati@gmail.com',
    Avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
  }
];

export const DEFAULT_ORDERS: Order[] = [
  {
    ID: 'ORD-171201',
    Tgl: new Date(Date.now() - 3 * 86400000).toISOString(),
    KodeCustomer: '88392011',
    NamaCustomer: 'Budi Santoso',
    NoCustomer: '089876543210',
    IDProduk: 'P1',
    NamaProduk: 'Banner MMT 280gram (Outdoor / Indoor)',
    Kategori: 'meteran',
    Qty: 2,
    Panjang: 300,
    Lebar: 100,
    Finishing: 'Simkel',
    JasaCutting: 0,
    JasaLaminating: 0,
    JasaDesain: 15000,
    TotalHarga: 141000,
    StatusBayar: 'Lunas',
    StatusOrder: 'Selesai',
    Catatan: 'Tulisan warung makan "Soto Bu Slamet", mohon warna kuning cerah'
  },
  {
    ID: 'ORD-171202',
    Tgl: new Date(Date.now() - 1 * 86400000).toISOString(),
    KodeCustomer: '88392011',
    NamaCustomer: 'Budi Santoso',
    NoCustomer: '089876543210',
    IDProduk: 'P3',
    NamaProduk: 'Sticker Vinyl A3+ Kiss Cut Anti Air',
    Kategori: 'satuan',
    Qty: 5,
    Panjang: 0,
    Lebar: 0,
    Finishing: '-',
    JasaCutting: 15000,
    JasaLaminating: 20000,
    JasaDesain: 0,
    TotalHarga: 95000,
    StatusBayar: 'DP',
    StatusOrder: 'Proses',
    Catatan: 'Sticker logo bulat diameter 5cm untuk botol sambal'
  },
  {
    ID: 'ORD-171203',
    Tgl: new Date().toISOString(),
    KodeCustomer: '19482055',
    NamaCustomer: 'Siti Rahmawati',
    NoCustomer: '081392817263',
    IDProduk: 'P4',
    NamaProduk: 'Kartu Nama Eksklusif (1 Box / 100 Pcs)',
    Kategori: 'satuan',
    Qty: 2,
    Panjang: 0,
    Lebar: 0,
    Finishing: '-',
    JasaCutting: 0,
    JasaLaminating: 14000,
    JasaDesain: 20000,
    TotalHarga: 104000,
    StatusBayar: 'Belum Lunas',
    StatusOrder: 'Order Masuk',
    Catatan: 'Kartu nama florist & dekorasi'
  }
];

export const DEFAULT_EXPENSES: Expense[] = [
  {
    ID: 'EXP-101',
    Tgl: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    Total: 680000,
    Toko: 'CV Anugerah Media Bahan',
    Detail: 'Beli 1 Roll Bahan MMT 280g lebar 3.2m',
    NotaUrl: ''
  },
  {
    ID: 'EXP-102',
    Tgl: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    Total: 240000,
    Toko: 'Toko Tinta Mandiri',
    Detail: 'Tinta Solvent Cyan & Magenta',
    NotaUrl: ''
  }
];

export const DEFAULT_STORE_DATA: StoreData = {
  nama_toko: 'Alinea Desain',
  tagline: 'Solusi Desain & Cetak Anda',
  logo_url: '',
  running_text: 'Selamat datang di Alinea Desain! Dapatkan promo cetak kilat MMT & stiker presisi, konsultasi desain ramah, dan diskon instansi/kampus.',
  running_text_speed: 22,
  alamat: 'Jl K.A Perwito Teluk, RT.01/RW.03, Ngreden, Kec. Wonosari, Kabupaten Klaten, Jawa Tengah 57473',
  kontak: '085815950700',
  rekening: 'CIMB Niaga 763568966600 a.n Muhammad Rosyid Ridlo',
  clients_slider: DEFAULT_CLIENTS,
  banners: DEFAULT_BANNERS,
  spreadsheet_id: '1kxoXXgoB_eq1HiWbTbxZ1qzodvQs3ZdlAPqvzl5Jmqc',
  gas_web_app_url: 'https://script.google.com/macros/s/AKfycby7KyaG5TOrNK_6QwPuhNMe-VW_7dGuluKehrY1L68fmOXpbLrLttO4Q85S-PmVAhf4/exec',
  last_synced_at: '',
  wa_provider: 'fonnte',
  wa_api_key: '9JPQEQhViYsp7Q6njJQv',
  wa_api_url: 'https://api.fonnte.com/send',
  wa_sender_number: '085815950700',
  wa_auto_order: true,
  wa_auto_status: true
};

const STORAGE_KEY = 'alinea_desain_store_v5';

export interface AppStateData {
  users: User[];
  products: Product[];
  orders: Order[];
  expenses: Expense[];
  storeData: StoreData;
}

export function loadStoredData(): AppStateData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: AppStateData = {
        users: DEFAULT_USERS,
        products: DEFAULT_PRODUCTS,
        orders: DEFAULT_ORDERS,
        expenses: DEFAULT_EXPENSES,
        storeData: DEFAULT_STORE_DATA
      };
      saveStoredData(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    let loadedUsers: User[] = (parsed.users && parsed.users.length > 0) ? parsed.users : DEFAULT_USERS;
    
    // Ensure default admin user Admin Alinea has password admin123 & normalize user strings
    let adminFound = false;
    loadedUsers = loadedUsers.map(u => {
      const normalized: User = {
        ...u,
        ID: String(u.ID || ''),
        Role: (u.Role === 'admin' ? 'admin' : 'customer') as 'admin' | 'customer',
        KodeKhusus: String(u.KodeKhusus ?? '-'),
        Nama: String(u.Nama ?? ''),
        NoWA: String(u.NoWA ?? ''),
        Alamat: String(u.Alamat ?? ''),
        Password: String(u.Password ?? ''),
        Email: u.Email ? String(u.Email) : undefined,
        TglDaftar: u.TglDaftar ? String(u.TglDaftar) : new Date().toISOString()
      };
      if (normalized.Role === 'admin') {
        adminFound = true;
        if (normalized.Nama.toLowerCase() === 'admin alinea' || normalized.ID === 'U1') {
          return {
            ...normalized,
            Nama: 'Admin Alinea',
            NoWA: normalized.NoWA && normalized.NoWA !== '081234567890' ? normalized.NoWA : '085815950700',
            Alamat: normalized.Alamat && !normalized.Alamat.includes('Sardjito') ? normalized.Alamat : 'Klaten',
            Password: 'admin123'
          };
        }
      }
      return normalized;
    });

    if (!adminFound) {
      loadedUsers.unshift(DEFAULT_USERS[0]);
    }

    // Merge storeData with default storeData, ensuring spreadsheet_id and new store contact details are synced
    const storedStore = parsed.storeData || {};
    const mergedStoreData: StoreData = {
      ...DEFAULT_STORE_DATA,
      ...storedStore,
      nama_toko: storedStore.nama_toko || DEFAULT_STORE_DATA.nama_toko,
      tagline: (storedStore.tagline && storedStore.tagline !== 'Percetakan & Digital Printing Cepat Berkualitas') ? storedStore.tagline : DEFAULT_STORE_DATA.tagline,
      alamat: (storedStore.alamat && !storedStore.alamat.includes('Sardjito')) ? storedStore.alamat : DEFAULT_STORE_DATA.alamat,
      kontak: (storedStore.kontak && storedStore.kontak !== '081234567890') ? storedStore.kontak : DEFAULT_STORE_DATA.kontak,
      rekening: (storedStore.rekening && !storedStore.rekening.includes('BCA 1234567890')) ? storedStore.rekening : DEFAULT_STORE_DATA.rekening,
      spreadsheet_id: storedStore.spreadsheet_id || DEFAULT_STORE_DATA.spreadsheet_id,
      wa_api_key: storedStore.wa_api_key || DEFAULT_STORE_DATA.wa_api_key,
      wa_sender_number: (storedStore.wa_sender_number && storedStore.wa_sender_number !== '081234567890') ? storedStore.wa_sender_number : DEFAULT_STORE_DATA.wa_sender_number,
      gas_web_app_url: (storedStore.gas_web_app_url && storedStore.gas_web_app_url.trim() !== '') ? storedStore.gas_web_app_url : DEFAULT_STORE_DATA.gas_web_app_url,
      logo_url: storedStore.logo_url || DEFAULT_STORE_DATA.logo_url,
      clients_slider: storedStore.clients_slider || DEFAULT_CLIENTS,
      banners: storedStore.banners || DEFAULT_BANNERS
    };

    // Ensure all arrays and nested objects are present
    const rawProducts = (parsed.products && parsed.products.length > 0) ? parsed.products : DEFAULT_PRODUCTS;
    const seenPIds = new Set<string>();
    const uniqueProducts: Product[] = [];
    for (const p of rawProducts) {
      if (!p) continue;
      const pid = String(p.ID || '');
      if (pid && !seenPIds.has(pid)) {
        seenPIds.add(pid);
        uniqueProducts.push(p);
      }
    }

    return {
      users: loadedUsers,
      products: uniqueProducts.length > 0 ? uniqueProducts : DEFAULT_PRODUCTS,
      orders: parsed.orders || DEFAULT_ORDERS,
      expenses: parsed.expenses || DEFAULT_EXPENSES,
      storeData: mergedStoreData
    };
  } catch (e) {
    console.error('Error loading stored data:', e);
    return {
      users: DEFAULT_USERS,
      products: DEFAULT_PRODUCTS,
      orders: DEFAULT_ORDERS,
      expenses: DEFAULT_EXPENSES,
      storeData: DEFAULT_STORE_DATA
    };
  }
}

export function saveStoredData(data: AppStateData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving data to localStorage:', e);
  }
}

const AUTH_SESSION_KEY = 'alinea_active_auth_user_id';

export function loadSavedAuthUserId(): string | null {
  try {
    return localStorage.getItem(AUTH_SESSION_KEY);
  } catch {
    return null;
  }
}

export function saveAuthUserId(userId: string | null): void {
  try {
    if (userId) {
      localStorage.setItem(AUTH_SESSION_KEY, userId);
    } else {
      localStorage.removeItem(AUTH_SESSION_KEY);
    }
  } catch (e) {
    console.error('Error saving auth user session:', e);
  }
}
