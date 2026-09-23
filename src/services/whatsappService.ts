/**
 * ALINEA DESAIN - WHATSAPP GATEWAY SERVICE
 * 
 * Terhubung langsung ke WhatsApp Gateway (Fonnte API)
 * Menggunakan kredensial terpusat dari Code.gs (CONFIG.WA_API_KEY)
 * Berfungsi di semua perangkat (browser baru, mobile, desktop) melalui proxy server & fallback.
 */

import { GAS_CONFIG } from '../config/gasConfig';
import { Order, User, StoreData } from '../types';

export interface WaResponse {
  success: boolean;
  message: string;
  detail?: any;
  device?: string;
  quota?: number | string;
}

export interface DeviceStatusResponse {
  success: boolean;
  device?: string;
  name?: string;
  device_status?: string;
  quota?: number | string;
  package?: string;
  message?: string;
}

/**
 * Normalisasi nomor HP ke format internasional WhatsApp (628...)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('+62')) {
    clean = '62' + clean.slice(3);
  } else if (!clean.startsWith('62') && clean.length >= 8) {
    clean = '62' + clean;
  }
  return clean;
}

/**
 * Format nominal Rupiah
 */
function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Cek status perangkat WhatsApp Gateway di Fonnte
 */
export async function checkWhatsAppDeviceStatus(apiKey?: string): Promise<DeviceStatusResponse> {
  const token = apiKey || GAS_CONFIG.WA_API_KEY;

  // 1. Coba melalui backend endpoint /api/wa-status
  try {
    const res = await fetch(`/api/wa-status?apiKey=${encodeURIComponent(token)}`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    // Backend offline / mode client langsung
  }

  // 2. Fallback direct call ke Fonnte
  try {
    const directRes = await fetch('https://api.fonnte.com/device', {
      method: 'POST',
      headers: {
        Authorization: token
      }
    });
    const data = await directRes.json();
    return {
      success: !!data.status,
      device: data.device || '62895622909299',
      name: data.name || 'Kasir Alinea Desain',
      device_status: data.device_status || (data.status ? 'connect' : 'disconnect'),
      quota: data.quota || '-',
      package: data.package || 'Free',
      message: data.reason || 'Status Fonnte dicek langsung'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal cek gateway: ${err?.message || 'Koneksi bermasalah'}`
    };
  }
}

/**
 * Kirim pesan WhatsApp ke nomor tujuan
 */
export async function sendWhatsAppMessage(
  targetPhone: string,
  message: string,
  apiKey?: string
): Promise<WaResponse> {
  const cleanPhone = normalizePhoneNumber(targetPhone);
  if (!cleanPhone || cleanPhone.length < 8) {
    return { success: false, message: 'Nomor WhatsApp tujuan tidak valid (minimal 8 digit)' };
  }

  const token = apiKey || GAS_CONFIG.WA_API_KEY;

  // 1. Jika berjalan di Google Apps Script runtime (google.script.run)
  if (typeof window !== 'undefined' && (window as any).google?.script?.run) {
    try {
      (window as any).google.script.run.sendWA(cleanPhone, message);
      return {
        success: true,
        message: 'Pesan dikirim melalui Google Apps Script Web App (sendWA)'
      };
    } catch (e: any) {
      console.warn('sendWA google.script.run error:', e);
    }
  }

  // 2. Coba melalui backend server /api/send-wa (bebas masalah CORS di semua perangkat)
  try {
    const res = await fetch('/api/send-wa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: cleanPhone,
        message: message,
        apiKey: token
      })
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend /api/send-wa tidak merespons, mencoba panggilan direct...', err);
  }

  // 3. Fallback direct call ke Fonnte menggunakan FormData
  try {
    const formData = new FormData();
    formData.append('target', cleanPhone);
    formData.append('message', message);

    const directRes = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: token
      },
      body: formData
    });

    const result = await directRes.json();
    if (result.status) {
      return {
        success: true,
        message: `Pesan berhasil dikirim ke ${cleanPhone}!`,
        detail: result
      };
    } else {
      return {
        success: false,
        message: result.reason || result.detail || 'Gagal mengirim pesan via Fonnte Gateway',
        detail: result
      };
    }
  } catch (fallbackErr: any) {
    return {
      success: false,
      message: `Kendala pengiriman WhatsApp: ${fallbackErr?.message || 'Koneksi terputus'}`
    };
  }
}

/**
 * Buat template & kirim notifikasi WhatsApp saat pesanan baru dibuat
 */
export async function sendOrderCreatedNotification(
  order: Order,
  customer: User | undefined,
  storeData: StoreData
): Promise<WaResponse> {
  const targetPhone = customer?.NoWA || order.NoCustomer;
  if (!targetPhone || targetPhone === '-') {
    return { success: false, message: 'Tidak ada nomor WhatsApp customer' };
  }

  const namaCust = customer?.Nama || order.NamaCustomer || 'Pelanggan';
  const namaToko = storeData.nama_toko || 'Alinea Desain';
  const totalRp = formatRupiah(order.TotalHarga || 0);
  const dpRp = order.DP ? formatRupiah(order.DP) : '0';
  const sisaRp = formatRupiah(Math.max(0, (order.TotalHarga || 0) - (order.DP || 0)));

  const itemsText = order.Items && order.Items.length > 0
    ? order.Items.map((it, idx) => `  ${idx + 1}. *${it.namaProduk}* (${it.qty}x) - Rp ${formatRupiah(it.subtotal)}`).join('\n')
    : `  • *${order.NamaProduk}* (${order.Qty}x)`;

  const formattedDate = order.Tgl
    ? new Date(order.Tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('id-ID');

  const message = `Halo Kak *${namaCust}*, terima kasih telah memesan di *${namaToko}*! ✨\n\n` +
    `📋 *RINCIAN NOTA PESANAN:*\n` +
    `• *No. Pesanan:* #${order.ID}\n` +
    `• *Tanggal:* ${formattedDate}\n` +
    `• *Status Pengerjaan:* ⏳ ${order.StatusOrder || 'Order Masuk'}\n\n` +
    `📦 *Item Pesanan:*\n${itemsText}\n\n` +
    `💰 *Rincian Pembayaran:*\n` +
    `• *Total Biaya:* Rp ${totalRp}\n` +
    `• *Status Bayar:* *${order.StatusBayar}*` + (order.DP && order.DP > 0 ? ` (DP: Rp ${dpRp})` : '') + `\n` +
    (order.StatusBayar !== 'Lunas' && order.DP ? `• *Sisa Bayar:* Rp ${sisaRp}\n` : '') +
    (order.Catatan ? `\n📝 *Catatan:* ${order.Catatan}\n` : '\n') +
    `Pesanan Anda segera kami proses dengan rapi dan presisi. Kami akan mengabari kembali saat cetakan telah selesai. 🙏\n\n` +
    `_${namaToko} - Solusi Desain & Cetak Anda_`;

  return sendWhatsAppMessage(targetPhone, message, storeData.wa_api_key);
}

/**
 * Buat template & kirim notifikasi WhatsApp saat status pesanan berubah
 */
export async function sendOrderStatusChangedNotification(
  order: Order,
  customer: User | undefined,
  newStatus: string,
  storeData: StoreData
): Promise<WaResponse> {
  const targetPhone = customer?.NoWA || order.NoCustomer;
  if (!targetPhone || targetPhone === '-') {
    return { success: false, message: 'Tidak ada nomor WhatsApp customer' };
  }

  const namaCust = customer?.Nama || order.NamaCustomer || 'Pelanggan';
  const namaToko = storeData.nama_toko || 'Alinea Desain';
  const totalRp = formatRupiah(order.TotalHarga || 0);

  let statusHeader = `Update Status Pesanan #${order.ID}`;
  let statusDetail = `Pesanan Anda sekarang berstatus: *${newStatus}*`;

  if (newStatus === 'Selesai' || newStatus === 'Siap Diambil') {
    statusHeader = `🎉 PESANAN ANDA TELAH SELESAI & SIAP DIAMBIL!`;
    statusDetail = `Kabar baik! Cetakan untuk pesanan *#${order.ID}* telah rampung dikerjakan dengan hasil terbaik dan siap Anda ambil di toko kami. 📦`;
  } else if (newStatus === 'Proses Produksi') {
    statusHeader = `⚙️ PESANAN SEDANG DIPRODUKSI`;
    statusDetail = `Pesanan *#${order.ID}* sedang dalam tahap proses cetak/finishing oleh tim produksi kami.`;
  } else if (newStatus === 'Desain Disetujui') {
    statusHeader = `🎨 DESAIN TELAH DISETUJUI`;
    statusDetail = `Desain pesanan *#${order.ID}* telah disetujui dan segera masuk ke antrean cetak.`;
  }

  const message = `Halo Kak *${namaCust}*,\n\n` +
    `*${statusHeader}*\n\n` +
    `${statusDetail}\n\n` +
    `📋 *Ringkasan Pesanan:*\n` +
    `• *No. Pesanan:* #${order.ID}\n` +
    `• *Produk:* ${order.NamaProduk} (${order.Qty}x)\n` +
    `• *Total:* Rp ${totalRp}\n` +
    `• *Status Pembayaran:* *${order.StatusBayar}*\n\n` +
    (newStatus === 'Selesai' || newStatus === 'Siap Diambil'
      ? `📍 *Lokasi Pengambilan Toko:*\n${storeData.alamat}\n📞 Kontak: ${storeData.kontak}\n\n`
      : '') +
    `Terima kasih telah mempercayakan cetakan Anda kepada *${namaToko}*! 🙏`;

  return sendWhatsAppMessage(targetPhone, message, storeData.wa_api_key);
}
