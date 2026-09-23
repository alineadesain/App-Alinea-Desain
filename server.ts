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
      const fetchUrl = url.includes('?')
        ? `${url}&action=fetchAllData&_t=${Date.now()}`
        : `${url}?action=fetchAllData&_t=${Date.now()}`;

      const response = await fetch(fetchUrl);
      const text = await response.text();

      try {
        const json = JSON.parse(text);
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

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `postData=${encodeURIComponent(requestBody)}`
      });

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
  // 5. STATIC / VITE MIDDLEWARE
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
