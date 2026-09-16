import { Order, User, StoreData } from '../types';

/**
 * Utilitas untuk membersihkan dan menstandarisasi nomor telepon WhatsApp ke format internasional (e.g. 6281234567890)
 */
export function cleanWhatsAppPhone(rawPhone?: string): string {
  if (!rawPhone) return '';
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
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

/**
 * Mencari nomor telepon customer dari daftar pengguna (Spreadsheet Sheet Users)
 */
export function findCustomerPhone(order: Order, users?: User[]): string {
  if (users && users.length > 0) {
    const matchedUser = users.find((u) => {
      const uPhone = String(u.NoWA || '').replace(/\D/g, '');
      const ordPhone = String(order.NoCustomer || '').replace(/\D/g, '');
      const matchPhone = ordPhone && uPhone && (uPhone.endsWith(ordPhone) || ordPhone.endsWith(uPhone));
      const matchCode =
        u.KodeKhusus &&
        order.KodeCustomer &&
        u.KodeKhusus !== '-' &&
        String(u.KodeKhusus).trim() === String(order.KodeCustomer).trim();
      const matchName =
        u.Nama &&
        order.NamaCustomer &&
        u.Nama.trim().toLowerCase() === order.NamaCustomer.trim().toLowerCase();
      return matchPhone || matchCode || matchName;
    });

    if (matchedUser?.NoWA) {
      return matchedUser.NoWA;
    }
  }

  return order.NoCustomer || '';
}

export interface WhatsAppFormatOptions {
  storeName?: string;
  rekening?: string;
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
  if ('rekening' in options && options.rekening) return options.rekening;
  return '';
}

/**
 * Utilitas untuk memformat pesan WhatsApp konfirmasi pesanan / nota dari Toko/Admin ke Pelanggan.
 * Menyertakan:
 * - ID Order
 * - Tanggal & Info Pelanggan
 * - Rincian Order (Detail tiap item/produk, ukuran, finishing, layanan jasa)
 * - Total Biaya
 * - DP (Uang Muka) jika ada
 * - Sisa Tagihan
 * - Status Pembayaran & Pengerjaan
 */
export function formatOrderWhatsAppConfirmation(
  order: Order,
  options?: WhatsAppFormatOptions | StoreData
): string {
  const storeName = getStoreName(options);
  const rekening = getRekening(options);
  const dpAmount = order.NominalDP || order.DP || 0;
  const sisaTagihan =
    order.SisaTagihan !== undefined
      ? order.SisaTagihan
      : Math.max(0, order.TotalHarga - dpAmount);

  const lines: string[] = [];

  // Header Salam
  lines.push(`Halo Kak *${order.NamaCustomer}*,`);
  lines.push(`Berikut adalah konfirmasi & rincian nota pesanan Anda di *${storeName}*:`);
  lines.push('');

  // 1. Detail ID & Tanggal
  lines.push(`📄 *ID / No. Order:* ${order.ID}`);
  lines.push(`🗓️ *Tanggal:* ${formatOrderDateTime(order.Tgl)}`);
  lines.push(`👤 *Pelanggan:* ${order.NamaCustomer} ${order.KodeCustomer && order.KodeCustomer !== '-' ? `(ID: ${order.KodeCustomer})` : ''}`);
  lines.push('');

  // 2. Rincian Order
  lines.push(`📋 *RINCIAN ORDER:*`);
  if (order.Items && order.Items.length > 0) {
    order.Items.forEach((item, idx) => {
      lines.push(`${idx + 1}. *${item.namaProduk}* (${item.qty}x)`);
      if (item.kategori === 'meteran') {
        lines.push(`   📐 Ukuran: ${item.panjang || 0} x ${item.lebar || 0} cm (${item.finishing || 'Simkel'})`);
      }
      const jasaArr: string[] = [];
      if (item.withDesain && (item.jasaDesain || 0) > 0) {
        jasaArr.push(`Desain: ${formatRupiah(item.jasaDesain!)}`);
      }
      if (item.withCutting && (item.jasaCutting || 0) > 0) {
        jasaArr.push(`Cutting: ${formatRupiah(item.jasaCutting!)}`);
      }
      if (item.withLaminating && (item.jasaLaminating || 0) > 0) {
        jasaArr.push(`Laminasi: ${formatRupiah(item.jasaLaminating!)}`);
      }
      if (jasaArr.length > 0) {
        lines.push(`   ✨ Layanan: ${jasaArr.join(', ')}`);
      }
      lines.push(`   💵 Subtotal: *${formatRupiah(item.subtotal)}*`);
    });
  } else {
    // Single Product Order
    lines.push(`• *${order.NamaProduk}* (${order.Qty}x)`);
    if (order.Kategori === 'meteran') {
      lines.push(`  📐 Ukuran: ${order.Panjang || 0} x ${order.Lebar || 0} cm (${order.Finishing || 'Simkel'})`);
    }
    const jasaArr: string[] = [];
    if ((order.JasaDesain || 0) > 0) jasaArr.push(`Desain: ${formatRupiah(order.JasaDesain)}`);
    if ((order.JasaCutting || 0) > 0) jasaArr.push(`Cutting: ${formatRupiah(order.JasaCutting)}`);
    if ((order.JasaLaminating || 0) > 0) jasaArr.push(`Laminasi: ${formatRupiah(order.JasaLaminating)}`);
    if (jasaArr.length > 0) {
      lines.push(`  ✨ Layanan: ${jasaArr.join(', ')}`);
    }
  }

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
  lines.push(`• Status Bayar: *${order.StatusBayar}*`);
  lines.push(`• Status Pengerjaan: *${order.StatusOrder}*`);
  lines.push('');

  // 4. Informasi Tambahan Berdasarkan Status
  if (order.StatusOrder === 'Selesai') {
    lines.push(`🎉 *Hore! Pesanan Anda telah SELESAI dan siap diambil atau dikirim.*`);
  } else if (order.StatusOrder === 'Proses') {
    lines.push(`⚙️ *Pesanan Anda saat ini sedang dalam proses produksi / pengerjaan.*`);
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
  options?: WhatsAppFormatOptions | StoreData
): string {
  const storeName = getStoreName(options);
  const dpAmount = order.NominalDP || order.DP || 0;
  const sisaTagihan =
    order.SisaTagihan !== undefined
      ? order.SisaTagihan
      : Math.max(0, order.TotalHarga - dpAmount);

  const lines: string[] = [];
  lines.push(`Halo admin *${storeName}*, saya ingin konfirmasi pesanan saya:`);
  lines.push('');
  lines.push(`📌 *ID Pesanan:* ${order.ID}`);
  lines.push(`🗓️ *Tanggal:* ${formatOrderDateTime(order.Tgl)}`);
  lines.push(`👤 *Nama:* ${order.NamaCustomer} ${order.KodeCustomer && order.KodeCustomer !== '-' ? `(ID: ${order.KodeCustomer})` : ''}`);
  lines.push('');

  // Rincian Order
  lines.push(`📦 *Rincian Order:*`);
  if (order.Items && order.Items.length > 0) {
    order.Items.forEach((it, idx) => {
      lines.push(`${idx + 1}. ${it.namaProduk} (${it.qty}x)`);
      if (it.kategori === 'meteran') {
        lines.push(`   Ukuran: ${it.panjang || 0} x ${it.lebar || 0} cm (${it.finishing || 'Simkel'})`);
      }
    });
  } else {
    lines.push(`• ${order.NamaProduk} (${order.Qty}x)`);
    if (order.Kategori === 'meteran') {
      lines.push(`  Ukuran: ${order.Panjang || 0} x ${order.Lebar || 0} cm (${order.Finishing || 'Simkel'})`);
    }
  }
  lines.push('');

  // Tagihan & DP
  lines.push(`💰 *Total:* ${formatRupiah(order.TotalHarga)}`);
  if (dpAmount > 0) {
    lines.push(`💵 *DP:* ${formatRupiah(dpAmount)}`);
  }
  lines.push(`💳 *Sisa Tagihan:* ${formatRupiah(sisaTagihan)}`);
  lines.push(`🏷️ *Status Bayar:* ${order.StatusBayar}`);
  lines.push(`🚀 *Status Order:* ${order.StatusOrder}`);
  if (order.Catatan) {
    lines.push(`📝 *Catatan:* ${order.Catatan}`);
  }
  lines.push('');
  lines.push(`Mohon konfirmasi pesanan dan informasi pengerjaannya. Terima kasih!`);

  return lines.join('\n');
}

/**
 * Menghasilkan link WhatsApp lengkap wa.me dengan pesan terenkripsi URI
 */
export function createWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = cleanWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
