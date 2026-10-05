import { Order, OrderItem, User, StoreData } from '../types';

/**
 * Utilitas untuk membersihkan dan menstandarisasi nomor telepon WhatsApp ke format internasional (e.g. 6281234567890)
 */
export function cleanWhatsAppPhone(rawPhone?: any): string {
  if (rawPhone === undefined || rawPhone === null) return '';
  let digits = String(rawPhone).replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  } else if (!digits.startsWith('62') && digits.length >= 7) {
    digits = '62' + digits;
  }
  return digits;
}

/**
 * Helper format mata uang Rupiah
 */
export function formatRupiah(amount: number): string {
  return 'Rp ' + (amount || 0).toLocaleString('id-ID');
}

/**
 * Helper format tanggal & waktu pesanan yang ramah dibaca
 */
export function formatOrderDateTime(isoString?: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(isoString);
  }
}

/**
 * Mencari nomor telepon customer dari daftar pengguna (Spreadsheet Sheet Users)
 */
export function findCustomerPhone(order: Order, users?: User[]): string {
  if (users && users.length > 0) {
    const matchedUser = users.find((u) => {
      const uPhone = String(u.NoWA ?? '').replace(/\D/g, '');
      const ordPhone = String(order.NoCustomer ?? '').replace(/\D/g, '');
      const matchPhone = ordPhone && uPhone && (uPhone.endsWith(ordPhone) || ordPhone.endsWith(uPhone));
      const matchCode =
        u.KodeKhusus &&
        order.KodeCustomer &&
        String(u.KodeKhusus).trim() !== '-' &&
        String(u.KodeKhusus).trim() === String(order.KodeCustomer).trim();
      const matchName =
        u.Nama &&
        order.NamaCustomer &&
        String(u.Nama).trim().toLowerCase() === String(order.NamaCustomer).trim().toLowerCase();
      return matchPhone || matchCode || matchName;
    });

    if (matchedUser?.NoWA) {
      return String(matchedUser.NoWA);
    }
  }

  return String(order.NoCustomer || '');
}

/**
 * Utilitas untuk menguraikan dan menjamin ketersediaan daftar rincian item pesanan (OrderItem[]).
 * Mengambil dari:
 * 1. order.Items jika sudah ada (baik array murni maupun JSON string)
 * 2. Mengambil dari daftar allOrderItems (Sheet OrderItems) jika dicocokkan dengan order.ID
 * 3. Mengurai rincian teks multi-item di order.NamaProduk jika terdapat pemisah ';' atau penomoran
 * 4. Menghasilkan single item dari data kolom sheet Orders (IDProduk, NamaProduk, Kategori, Qty, Ukuran, Finishing, dll)
 */
export function getOrderDisplayItems(order: Order, allOrderItems?: any[]): OrderItem[] {
  if (!order) return [];

  // 1. Jika order.Items ada (baik array murni maupun JSON string)
  if (order.Items) {
    let itemsArr: any[] = [];
    if (Array.isArray(order.Items)) {
      itemsArr = order.Items;
    } else if (typeof order.Items === 'string') {
      try {
        const parsed = JSON.parse(order.Items);
        if (Array.isArray(parsed)) itemsArr = parsed;
      } catch {
        // Abaikan parse error, lanjutkan fallback
      }
    }

    if (itemsArr.length > 0) {
      return itemsArr.map((it, idx) => {
        const qty = Math.max(1, Number(it.qty || it.Qty || 1));
        const subtotal = Number(it.subtotal || it.Subtotal || 0);
        const harga = Number(it.harga || it.Harga || (qty > 0 && subtotal > 0 ? Math.round(subtotal / qty) : 0));
        const panjang = Number(it.panjang || it.Panjang || 0);
        const lebar = Number(it.lebar || it.Lebar || 0);
        const kategori = (it.kategori === 'meteran' || it.Kategori === 'meteran' || (panjang > 0 && lebar > 0)) ? 'meteran' : 'satuan';

        return {
          id: String(it.id || `${order.ID || 'ord'}_item_${idx + 1}`),
          productId: String(it.productId || it.IDProduk || `PROD-${idx + 1}`),
          namaProduk: String(it.namaProduk || it.NamaProduk || 'Produk Cetak'),
          kategori,
          harga,
          qty,
          panjang,
          lebar,
          finishing: String(it.finishing || it.Finishing || '-'),
          withDesain: !!(it.withDesain || it.jasaDesain || it.Desain),
          withCutting: !!(it.withCutting || it.jasaCutting || it.Cutting),
          withLaminating: !!(it.withLaminating || it.jasaLaminating || it.Laminating),
          jasaDesain: Number(it.jasaDesain || it.Desain || 0),
          jasaCutting: Number(it.jasaCutting || it.Cutting || 0),
          jasaLaminating: Number(it.jasaLaminating || it.Laminating || 0),
          subtotal: subtotal || (harga * qty)
        };
      });
    }
  }

  // 2. Jika ada allOrderItems (misal diambil dari Sheet OrderItems)
  if (allOrderItems && Array.isArray(allOrderItems) && allOrderItems.length > 0) {
    const orderIdStr = String(order.ID || '').trim().toLowerCase();
    const matched = allOrderItems.filter((it: any) => {
      const itOrdId = String(it.IDOrder || it.idorder || it.idOrder || it.ID || it.id || '').trim().toLowerCase();
      return itOrdId && itOrdId === orderIdStr;
    });

    if (matched.length > 0) {
      return matched.map((it: any, idx: number) => {
        const qty = Math.max(1, Number(it.qty || it.Qty || 1));
        const subtotal = Number(it.subtotal || it.Subtotal || 0);
        const harga = Number(it.harga || it.Harga || (qty > 0 && subtotal > 0 ? Math.round(subtotal / qty) : 0));
        const panjang = Number(it.panjang || it.Panjang || 0);
        const lebar = Number(it.lebar || it.Lebar || 0);
        const kategori = (it.kategori === 'meteran' || it.Kategori === 'meteran' || (panjang > 0 && lebar > 0)) ? 'meteran' : 'satuan';

        return {
          id: String(it.id || `${order.ID || 'ord'}_sheetitem_${idx + 1}`),
          productId: String(it.productId || it.IDProduk || it.idProduk || `PROD-${idx + 1}`),
          namaProduk: String(it.namaProduk || it.NamaProduk || 'Produk Cetak'),
          kategori,
          harga,
          qty,
          panjang,
          lebar,
          finishing: String(it.finishing || it.Finishing || '-'),
          withDesain: !!(it.withDesain || it.jasaDesain || it.Desain),
          withCutting: !!(it.withCutting || it.jasaCutting || it.Cutting),
          withLaminating: !!(it.withLaminating || it.jasaLaminating || it.Laminating),
          jasaDesain: Number(it.jasaDesain || it.Desain || 0),
          jasaCutting: Number(it.jasaCutting || it.Cutting || 0),
          jasaLaminating: Number(it.jasaLaminating || it.Laminating || 0),
          subtotal: subtotal || (harga * qty)
        };
      });
    }
  }

  // 2. Jika order.NamaProduk mengandung pemisah multi-item ';' atau penomoran '1. ...'
  const rawTitle = String(order.NamaProduk || '').trim();
  if (rawTitle.includes(';') || /^\s*1\.\s+/.test(rawTitle)) {
    const rawSegments = rawTitle.includes(';')
      ? rawTitle.split(';')
      : rawTitle.split(/\n+/);

    const parsedItems: OrderItem[] = [];
    rawSegments.forEach((seg, idx) => {
      const trimmed = seg.trim();
      if (!trimmed) return;

      // Bersihkan penomoran di depan: '1. ', '2. ', dsb
      const cleanSeg = trimmed.replace(/^\d+[\.\)]\s*/, '');

      // Deteksi Qty: e.g. (2x) atau 2 pcs atau (2)
      let detectedQty = 1;
      const qtyMatch = cleanSeg.match(/\((\d+)\s*x?\)/i) || cleanSeg.match(/\b(\d+)\s*(?:pcs|x)\b/i);
      if (qtyMatch) {
        detectedQty = Math.max(1, parseInt(qtyMatch[1], 10));
      }

      // Deteksi Ukuran: e.g. 200x100cm atau 200 x 100 cm
      let panjang = 0;
      let lebar = 0;
      const sizeMatch = cleanSeg.match(/(\d+)\s*[xX*]\s*(\d+)\s*(?:cm|m)?/);
      if (sizeMatch) {
        panjang = parseInt(sizeMatch[1], 10);
        lebar = parseInt(sizeMatch[2], 10);
      }

      // Deteksi Finishing: e.g. (Simkel) atau Finishing Simkel
      let finishing = '-';
      const finishMatch = cleanSeg.match(/(?:simkel|siming|sibah|kolong|mata\s*ayam)/i);
      if (finishMatch) {
        finishing = finishMatch[0].trim();
      }

      // Bersihkan nama produk dari penanda tanda kurung
      let cleanName = cleanSeg
        .replace(/\(\d+\s*x?\)/gi, '')
        .replace(/\d+\s*[xX*]\d+\s*(?:cm|m)?/gi, '')
        .replace(/\((?:simkel|siming|sibah|kolong)[^)]*\)/gi, '')
        .trim();

      if (!cleanName) cleanName = `Item ${idx + 1}`;

      parsedItems.push({
        id: `${order.ID || 'ord'}_parsed_${idx + 1}`,
        productId: `${order.IDProduk || 'MULTI'}_${idx + 1}`,
        namaProduk: cleanName,
        kategori: (panjang > 0 && lebar > 0) ? 'meteran' : (order.Kategori || 'satuan'),
        harga: 0,
        qty: detectedQty,
        panjang,
        lebar,
        finishing,
        subtotal: 0
      });
    });

    if (parsedItems.length > 0) {
      // Distribusikan total harga jika subtotal masih 0
      const totalPieces = parsedItems.reduce((acc, it) => acc + it.qty, 0) || 1;
      const unitPriceApprox = Math.round(Number(order.TotalHarga || 0) / totalPieces);
      return parsedItems.map((it) => ({
        ...it,
        harga: unitPriceApprox,
        subtotal: unitPriceApprox * it.qty
      }));
    }
  }

  // 3. Fallback: Bentuk 1 OrderItem resmi dari data kolom sheet Orders
  const singleQty = Math.max(1, Number(order.Qty || 1));
  const total = Number(order.TotalHarga || 0);
  const jasaTotal = Number(order.JasaDesain || 0) + Number(order.JasaCutting || 0) + Number(order.JasaLaminating || 0);
  const basePrice = singleQty > 0 ? Math.max(0, Math.round((total - jasaTotal) / singleQty)) : total;

  return [
    {
      id: String(order.IDProduk || `${order.ID}_single`),
      productId: String(order.IDProduk || 'P1'),
      namaProduk: String(order.NamaProduk || 'Produk Cetak'),
      kategori: (order.Kategori === 'meteran' ? 'meteran' : 'satuan'),
      harga: basePrice,
      qty: singleQty,
      panjang: Number(order.Panjang || 0),
      lebar: Number(order.Lebar || 0),
      finishing: String(order.Finishing || '-'),
      withDesain: Number(order.JasaDesain || 0) > 0,
      withCutting: Number(order.JasaCutting || 0) > 0,
      withLaminating: Number(order.JasaLaminating || 0) > 0,
      jasaDesain: Number(order.JasaDesain || 0),
      jasaCutting: Number(order.JasaCutting || 0),
      jasaLaminating: Number(order.JasaLaminating || 0),
      subtotal: total
    }
  ];
}

export interface WhatsAppFormatOptions {
  storeName?: string;
  rekening?: string;
  bank_accounts?: any[];
  alamat?: string;
  kontak?: string;
}

function getStoreName(options?: WhatsAppFormatOptions | StoreData): string {
  if (!options) return 'Alinea Desain';
  if ('nama_toko' in options && options.nama_toko) return options.nama_toko;
  if ('storeName' in options && options.storeName) return options.storeName;
  return 'Alinea Desain';
}

function getRekening(options?: WhatsAppFormatOptions | StoreData): string {
  if (!options) return '';
  let accounts: any[] = [];
  if ('bank_accounts' in options && options.bank_accounts) {
    if (Array.isArray(options.bank_accounts)) {
      accounts = options.bank_accounts;
    } else if (typeof options.bank_accounts === 'string') {
      try {
        const parsed = JSON.parse(options.bank_accounts);
        if (Array.isArray(parsed)) accounts = parsed;
      } catch {
        // ignore
      }
    }
  }

  if (accounts.length > 0) {
    return accounts.map((b: any) => `• ${b.bank}: *${b.nomor}* (a.n ${b.atasNama})`).join('\n');
  }

  if ('rekening' in options && options.rekening) return String(options.rekening);
  return '';
}

/**
 * Utilitas untuk memformat pesan WhatsApp konfirmasi pesanan / nota dari Toko/Admin ke Pelanggan.
 */
export function formatOrderWhatsAppConfirmation(
  order: Order,
  options?: WhatsAppFormatOptions | StoreData,
  allOrderItems?: any[]
): string {
  const storeName = getStoreName(options);
  const rekening = getRekening(options);
  const dpAmount = Number(order.NominalDP || order.DP || 0);
  const sisaTagihan =
    order.SisaTagihan !== undefined
      ? Number(order.SisaTagihan)
      : Math.max(0, Number(order.TotalHarga || 0) - dpAmount);

  const lines: string[] = [];

  // Header Salam
  lines.push(`Halo Kak *${order.NamaCustomer || 'Customer'}*,`);
  lines.push(`Berikut adalah konfirmasi & rincian nota pesanan Anda di *${storeName}*:`);
  lines.push('');

  // 1. Detail ID & Tanggal
  lines.push(`📄 *ID / No. Order:* ${order.ID}`);
  lines.push(`🗓️ *Tanggal:* ${formatOrderDateTime(order.Tgl)}`);
  lines.push(`👤 *Pelanggan:* ${order.NamaCustomer} ${order.KodeCustomer && order.KodeCustomer !== '-' ? `(ID: ${order.KodeCustomer})` : ''}`);
  lines.push('');

  // 2. Rincian Order (Mendukung Satuan maupun Multi-Item dengan getOrderDisplayItems)
  const displayItems = getOrderDisplayItems(order, allOrderItems);
  lines.push(`📋 *RINCIAN PRODUK PESANAN (${displayItems.length} Item):*`);

  displayItems.forEach((item, idx) => {
    lines.push(`${idx + 1}. *${item.namaProduk}*`);
    lines.push(`   • Qty: *${item.qty} pcs* (${formatRupiah(item.harga)}/item)`);
    if (item.kategori === 'meteran' && item.panjang && item.lebar) {
      const p = item.panjang || 0;
      const l = item.lebar || 0;
      const luas = Math.max(1, (p / 100) * (l / 100));
      lines.push(`   • Ukuran: ${p} x ${l} cm (${luas.toFixed(2)} m²) • Finishing: ${item.finishing || 'Simkel'}`);
    }
    const jasaArr: string[] = [];
    if (item.withDesain && (item.jasaDesain || 0) > 0) {
      jasaArr.push(`Desain: +${formatRupiah(item.jasaDesain!)}`);
    }
    if (item.withCutting && (item.jasaCutting || 0) > 0) {
      jasaArr.push(`Cutting: +${formatRupiah(item.jasaCutting!)}`);
    }
    if (item.withLaminating && (item.jasaLaminating || 0) > 0) {
      jasaArr.push(`Laminasi: +${formatRupiah(item.jasaLaminating!)}`);
    }
    if (jasaArr.length > 0) {
      lines.push(`   • Layanan: ${jasaArr.join(', ')}`);
    }
    lines.push(`   • Subtotal Produk: *${formatRupiah(item.subtotal)}*`);
    lines.push('');
  });

  if (order.Catatan) {
    lines.push(`📝 *Catatan Khusus:* ${order.Catatan}`);
  }
  lines.push('');

  // 3. Ringkasan Keuangan (Total, DP, Sisa Tagihan)
  lines.push(`💰 *RINGKASAN PEMBAYARAN:*`);
  lines.push(`• Total Biaya: *${formatRupiah(order.TotalHarga)}*`);
  if (dpAmount > 0) {
    lines.push(`• Uang Muka (DP): *${formatRupiah(dpAmount)}*`);
  }
  lines.push(`• Sisa Tagihan: *${formatRupiah(sisaTagihan)}*`);
  lines.push(`• Status Bayar: *${order.StatusBayar || 'Belum Lunas'}*`);
  lines.push(`• Status Produksi: *${order.StatusOrder || 'Order Masuk'}*`);
  lines.push('');

  // Catatan Status Pengerjaan
  if (order.StatusOrder === 'Selesai') {
    lines.push(`✅ *Pesanan Anda telah selesai diproduksi dan siap diambil/dikirim.*`);
  } else if (order.StatusOrder === 'Proses') {
    lines.push(`⚙️ *Pesanan Anda sedang dalam proses pengerjaan produksi.*`);
  } else {
    lines.push(`⏳ *Pesanan Anda telah diterima dalam antrean sistem.*`);
  }

  // Jika masih ada sisa tagihan, cantumkan rekening pembayaran
  if (sisaTagihan > 0 && rekening) {
    lines.push('');
    lines.push(`💳 *Rekening Pembayaran / Pelunasan:*`);
    lines.push(`${rekening}`);
  }

  lines.push('');
  lines.push(`Terima kasih telah mempercayakan cetakan Anda kepada *${storeName}*! 🙏`);

  return lines.join('\n');
}

/**
 * Utilitas untuk memformat pesan konfirmasi pesanan dari Customer ke CS Toko
 */
export function formatCustomerToAdminWhatsAppConfirmation(
  order: Order,
  options?: WhatsAppFormatOptions | StoreData,
  allOrderItems?: any[]
): string {
  const storeName = getStoreName(options);
  const dpAmount = Number(order.NominalDP || order.DP || 0);
  const sisaTagihan =
    order.SisaTagihan !== undefined
      ? Number(order.SisaTagihan)
      : Math.max(0, Number(order.TotalHarga || 0) - dpAmount);

  const lines: string[] = [];

  lines.push(`Halo Admin *${storeName}*,`);
  lines.push(`Saya ingin mengonfirmasi pesanan saya dengan rincian berikut:`);
  lines.push('');
  lines.push(`📄 *ID Order:* ${order.ID}`);
  lines.push(`🗓️ *Tanggal:* ${formatOrderDateTime(order.Tgl)}`);
  lines.push(`👤 *Nama Customer:* ${order.NamaCustomer} ${order.KodeCustomer && order.KodeCustomer !== '-' ? `(${order.KodeCustomer})` : ''}`);
  lines.push('');

  const displayItems = getOrderDisplayItems(order, allOrderItems);
  lines.push(`📋 *Rincian Produk (${displayItems.length} Item):*`);
  displayItems.forEach((it, idx) => {
    lines.push(`${idx + 1}. *${it.namaProduk}* (${it.qty} pcs)`);
    if (it.kategori === 'meteran' && it.panjang && it.lebar) {
      lines.push(`   Ukuran: ${it.panjang}x${it.lebar} cm - Finishing: ${it.finishing || 'Simkel'}`);
    }
  });

  lines.push('');
  lines.push(`💰 *Total Biaya:* ${formatRupiah(order.TotalHarga)}`);
  if (dpAmount > 0) {
    lines.push(`💵 *DP:* ${formatRupiah(dpAmount)} (Sisa: ${formatRupiah(sisaTagihan)})`);
  }
  lines.push(`📌 *Status Bayar:* ${order.StatusBayar || 'Belum Lunas'}`);

  if (order.Catatan) {
    lines.push(`📝 *Catatan:* ${order.Catatan}`);
  }

  lines.push('');
  lines.push(`Mohon info lebih lanjut terkait proses dan estimasi selesai. Terima kasih! 🙏`);

  return lines.join('\n');
}

/**
 * Membentuk URL wa.me yang aman untuk diklik
 */
export function createWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = cleanWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
