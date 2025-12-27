const express = require('express');
const serverless = require('serverless-http');
const axios = require('axios');

const app = express();
const router = express.Router();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

let cache = { data: null, timestamp: null, ttl: 30000 };

async function fetchHaremAltin() {
  try {
    const response = await axios.post('https://www.haremaltin.com/kurgetir', {}, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://www.haremaltin.com',
        'Referer': 'https://www.haremaltin.com/'
      },
      timeout: 10000
    });

    if (response.data && Array.isArray(response.data)) {
      const altinlar = response.data.map(item => ({
        isim: item.BIRIM || item.birim || '',
        kod: item.KOD || item.kod || '',
        alis: parseFloat(item.ALIS || item.alis || 0),
        satis: parseFloat(item.SATIS || item.satis || 0),
        fark: parseFloat(item.FARK || item.fark || 0),
        yuzde: parseFloat(item.YUZDE || item.yuzde || 0),
        tarih: item.TARIH || item.tarih || new Date().toLocaleString('tr-TR')
      }));

      return {
        success: true,
        kaynak: 'Harem Altın',
        guncelleme: new Date().toLocaleString('tr-TR'),
        toplam: altinlar.length,
        data: altinlar
      };
    }
    throw new Error('Geçersiz veri formatı');
  } catch (err) {
    throw new Error('API hatası: ' + err.message);
  }
}

router.get('/', (req, res) => {
  res.json({
    mesaj: 'Harem Altın API',
    versiyon: '2.0.0',
    endpoints: {
      'GET /api/harem-altin': 'Tüm altın fiyatları',
      'GET /api/harem-altin/:kod': 'Spesifik altın (örn: KULCEALTIN)',
      'GET /api/harem-altin/kategori/:kategori': 'Kategori (altin, gumus, diger)',
      'GET /api/health': 'Sağlık kontrolü'
    }
  });
});

router.get('/harem-altin', async (req, res) => {
  try {
    const now = Date.now();
    if (cache.data && cache.timestamp && (now - cache.timestamp < cache.ttl)) {
      return res.json({ ...cache.data, cached: true });
    }
    const data = await fetchHaremAltin();
    cache = { data, timestamp: now, ttl: 30000 };
    res.json({ ...data, cached: false });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/harem-altin/:kod', async (req, res) => {
  try {
    const kod = req.params.kod.toUpperCase();
    const now = Date.now();
    let data;
    if (cache.data && cache.timestamp && (now - cache.timestamp < cache.ttl)) {
      data = cache.data;
    } else {
      data = await fetchHaremAltin();
      cache = { data, timestamp: now, ttl: 30000 };
    }
    const altin = data.data.find(item => 
      (item.kod && item.kod.toUpperCase() === kod) || 
      (item.isim && item.isim.toUpperCase().includes(kod))
    );
    if (altin) {
      res.json({ success: true, kaynak: data.kaynak, guncelleme: data.guncelleme, data: altin });
    } else {
      res.status(404).json({ success: false, error: 'Altın türü bulunamadı' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/harem-altin/kategori/:kategori', async (req, res) => {
  try {
    const kategori = req.params.kategori.toLowerCase();
    const now = Date.now();
    let data;
    if (cache.data && cache.timestamp && (now - cache.timestamp < cache.ttl)) {
      data = cache.data;
    } else {
      data = await fetchHaremAltin();
      cache = { data, timestamp: now, ttl: 30000 };
    }
    let filtrelenmis = [];
    if (kategori === 'altin') {
      filtrelenmis = data.data.filter(item => 
        item.isim && (item.isim.includes('ALTIN') || item.isim.includes('ÇEYREK') || 
        item.isim.includes('YARIM') || item.isim.includes('TAM') || item.isim.includes('ATA'))
      );
    } else if (kategori === 'gumus') {
      filtrelenmis = data.data.filter(item => item.isim && item.isim.includes('GÜMÜŞ'));
    } else if (kategori === 'diger') {
      filtrelenmis = data.data.filter(item => 
        item.isim && (item.isim.includes('PLATİN') || item.isim.includes('PALADYUM'))
      );
    } else {
      return res.status(400).json({ success: false, error: 'Geçersiz kategori' });
    }
    res.json({
      success: true,
      kaynak: data.kaynak,
      kategori: kategori,
      guncelleme: data.guncelleme,
      toplam: filtrelenmis.length,
      data: filtrelenmis
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/.netlify/functions/api', router);

module.exports.handler = serverless(app);