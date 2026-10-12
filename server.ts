import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'server-db.json');

// Pastikan folder data tersedia
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_WA_API_KEY = '9JPQEQhViYsp7Q6njJQv';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // ==========================================
  // 1. ENDPOINT STATUS GATEWAY WHATSAPP (FONNTE)
  // ==========================================
  app.get('/api/wa-status', async (req, res) => {
    const apiKey = (req.query.apiKey as string) || DEFAULT_WA_API_KEY;
    try {
      const response = await fetch('https://api.fonnte.com/device', {
        method: 'POST',
        headers: {
          Authorization: apiKey
        }
      });
      const data = await response.json();
      return res.json({
        success: !!data.status,
        device: data.device || '62895622909299',
        name: data.name || 'Kasir Alinea Desain',
        device_status: data.device_status || (data.status ? 'connect' : 'disconnect'),
        quota: data.quota ?? 999,
        package: data.package || 'Free',
        message: data.reason || 'Koneksi Fonnte aktif'
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: `Gagal menghubungi server WhatsApp Fonnte: ${err?.message || 'Koneksi error'}`
      });
    }
  });

  // ==========================================
  // 2. ENDPOINT KIRIM PESAN WHATSAPP (FONNTE)
  // ==========================================
  app.post('/api/send-wa', async (req, res) => {
    const { target, message, apiKey } = req.body;

    if (!target || !message) {
      return res.status(400).json({
        success: false,
        message: 'Nomor target dan isi pesan wajib diisi'
      });
    }

    const token = apiKey || DEFAULT_WA_API_KEY;
    let cleanTarget = String(target).replace(/[^0-9]/g, '');
    if (cleanTarget.startsWith('0')) {
      cleanTarget = '62' + cleanTarget.slice(1);
    }

    try {
      // Kirim via Fonnte API dengan URLSearchParams
      const params = new URLSearchParams();
      params.append('target', cleanTarget);
      params.append('message', message);

      const fonnteRes = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const result = await fonnteRes.json();

      if (result.status) {
        return res.json({
          success: true,
          message: `WhatsApp berhasil dikirim ke ${cleanTarget}`,
          detail: result
        });
      } else {
        return res.json({
          success: false,
          message: result.reason || result.detail || 'Gagal mengirim pesan melalui Fonnte',
          detail: result
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: `Kendala jaringan gateway WhatsApp: ${err?.message || 'Error'}`
      });
    }
  });

  // ==========================================
  // 3. SERVER DATABASE PERSISTENCE (MULTI-DEVICE SYNC)
  // ==========================================
  // Mengembalikan data server saat dibuka di perangkat baru
  app.get('/api/server-data', (req, res) => {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return res.json({ exists: true, data: parsed });
      }
      return res.json({ exists: false, data: null });
    } catch (err: any) {
      return res.status(500).json({ exists: false, error: err?.message });
    }
  });

  // Menyimpan sinkronisasi data dari perangkat apapun ke server
  app.post('/api/server-data', (req, res) => {
    try {
      const payload = req.body;
      if (!payload) {
        return res.status(400).json({ success: false, message: 'Payload data kosong' });
      }

      fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf-8');
      return res.json({
        success: true,
        message: 'Data toko berhasil disimpan ke server sinkronisasi',
        updatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: `Gagal menyimpan data ke server: ${err?.message}`
      });
    }
  });

  // ==========================================
  // 4. PROXY GOOGLE APPS SCRIPT (TANPA CORS BLOCK)
  // ==========================================
  app.get('/api/gas-fetch', async (req, res) => {
    const url = (req.query.url as string) || '';
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({
        success: false,
        message: 'URL Google Apps Script Web App belum disetel'
      });
    }

    try {
      // 1. Coba via POST fetchAllData (karena doPost selalu mengembalikan JSON murni)
      let postResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'fetchAllData', timestamp: new Date().toISOString() }),
        redirect: 'manual'
      });

      let redirectHops = 0;
      while ((postResponse.status === 301 || postResponse.status === 302 || postResponse.status === 307 || postResponse.status === 308) && redirectHops < 5) {
        const redirectUrl = postResponse.headers.get('location');
        if (!redirectUrl) break;
        postResponse = await fetch(redirectUrl, { method: 'GET' });
        redirectHops++;
      }

      const text = await postResponse.text();
      try {
        const json = JSON.parse(text);
        if (json && (json.users || json.products || json.orders || json.success !== undefined)) {
          return res.json(json);
        }
      } catch {
        // Abaikan parse error, coba fallback GET
      }

      // 2. Fallback via GET jika diperlukan
      const fetchUrl = url.includes('?')
        ? `${url}&action=fetchAllData&_t=${Date.now()}`
        : `${url}?action=fetchAllData&_t=${Date.now()}`;

      const getResponse = await fetch(fetchUrl);
      const getText = await getResponse.text();

      try {
        const json = JSON.parse(getText);
        return res.json(json);
      } catch {
        return res.json({
          success: false,
          message: 'Format respon dari Google Apps Script bukan JSON yang valid',
          rawText: text.slice(0, 300)
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: `Gagal menghubungi Google Apps Script: ${err?.message}`
      });
    }
  });

  app.post('/api/gas-proxy', async (req, res) => {
    const { url, action, payload } = req.body;
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({
        success: false,
        message: 'URL Google Apps Script Web App belum disetel'
      });
    }

    try {
      const requestBody = JSON.stringify({
        action,
        ...(payload || {}),
        timestamp: new Date().toISOString()
      });

      // Mengirim POST ke Google Apps Script dengan text/plain;charset=utf-8
      // Google Apps Script merespon POST dengan HTTP 302 Redirect ke googleusercontent.com.
      // Kita ikuti redirect secara manual menggunakan method GET agar mendapatkan konten JSON yang sesungguhnya.
      let response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: requestBody,
        redirect: 'manual'
      });

      // Jika GAS mengembalikan 301/302 Redirect, ikuti via GET
      let redirectHops = 0;
      while ((response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) && redirectHops < 5) {
        const redirectUrl = response.headers.get('location');
        if (!redirectUrl) break;
        response = await fetch(redirectUrl, { method: 'GET' });
        redirectHops++;
      }

      const text = await response.text();
      try {
        const json = JSON.parse(text);
        return res.json(json);
      } catch {
        return res.json({
          success: true,
          message: 'Perintah terkirim ke Google Spreadsheet',
          rawText: text.slice(0, 200)
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: `Gagal kirim ke Google Apps Script: ${err?.message}`
      });
    }
  });

  // ==========================================
  // 5. ENDPOINT PENYIMPANAN GAMBAR GOOGLE DRIVE (PNG, JPG, WEBP) & AUTO FOLDER
  // ==========================================
  const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  app.use('/uploads', express.static(UPLOADS_DIR));

  app.post('/api/upload-drive', async (req, res) => {
    const { url, base64, dataUrl, fileName, mimeType, category, subfolder, storeName } = req.body;

    const rawData = base64 || dataUrl;
    if (!rawData) {
      return res.status(400).json({ success: false, message: 'Data gambar base64 tidak ditemukan' });
    }

    const targetCategory = category || 'umum';
    const cleanFileName = (fileName || `image_${Date.now()}.jpg`).replace(/[^a-zA-Z0-9_.-]/g, '_');

    // 1. Coba upload langsung ke Google Drive melalui Google Apps Script Web App jika URL tersedia
    if (url && typeof url === 'string' && url.startsWith('http')) {
      try {
        const gasPayload = {
          action: 'uploadFileToDrive',
          base64: rawData,
          fileName: cleanFileName,
          mimeType: mimeType || 'image/jpeg',
          category: targetCategory,
          subfolder: subfolder || '',
          storeName: storeName || 'Alinea Desain'
        };

        let response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(gasPayload),
          redirect: 'manual'
        });

        let redirectHops = 0;
        while ((response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) && redirectHops < 5) {
          const redirectUrl = response.headers.get('location');
          if (!redirectUrl) break;
          response = await fetch(redirectUrl, { method: 'GET' });
          redirectHops++;
        }

        const text = await response.text();
        try {
          const gasResult = JSON.parse(text);
          if (gasResult && gasResult.success) {
            return res.json({
              ...gasResult,
              source: 'google-drive'
            });
          }
        } catch {
          // Fallback ke penyimpanan lokal jika parsing respon GAS gagal
        }
      } catch (err: any) {
        console.warn('Gagal upload ke Google Drive via GAS, menggunakan fallback server penyimpanan lokal:', err?.message);
      }
    }

    // 2. Fallback penyimpanan lokal dengan struktur folder otomatis yang tersinkron
    try {
      const catFolder = path.join(UPLOADS_DIR, targetCategory);
      if (!fs.existsSync(catFolder)) {
        fs.mkdirSync(catFolder, { recursive: true });
      }

      // Bersihkan base64 data URL
      let base64Pure = rawData;
      let detectedExt = '.jpg';
      if (rawData.includes(';base64,')) {
        const parts = rawData.split(';base64,');
        if (parts[0].includes('image/png')) detectedExt = '.png';
        else if (parts[0].includes('image/webp')) detectedExt = '.webp';
        base64Pure = parts[1];
      }

      const safeName = cleanFileName.includes('.') ? cleanFileName : `${cleanFileName}${detectedExt}`;
      const filePath = path.join(catFolder, safeName);
      const buffer = Buffer.from(base64Pure, 'base64');
      fs.writeFileSync(filePath, buffer);

      const localUrl = `/uploads/${targetCategory}/${safeName}`;
      return res.json({
        success: true,
        message: 'Gambar berhasil disimpan (Lokal & Terorganisir)',
        url: localUrl,
        driveUrl: localUrl,
        viewUrl: localUrl,
        fileName: safeName,
        folderName: `📁 ${targetCategory.charAt(0).toUpperCase() + targetCategory.slice(1)}`,
        category: targetCategory,
        source: 'server-local'
      });
    } catch (localErr: any) {
      return res.status(500).json({
        success: false,
        message: `Gagal menyimpan gambar: ${localErr?.message}`
      });
    }
  });

  // ==========================================
  // 6. STATIC / VITE MIDDLEWARE
  // ==========================================
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true'
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Alinea Desain Full-Stack Server berjalan di http://0.0.0.0:${PORT}`);
  });
}

startServer();
