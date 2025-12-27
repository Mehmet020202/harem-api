# Harem Altın API - Netlify

Canlı altın fiyatları için ücretsiz REST API

## 🚀 Kurulum

```bash
npm install
npx netlify login
npx netlify deploy --prod
```

## 📡 Endpoints

- `GET /api/harem-altin` - Tüm fiyatlar
- `GET /api/harem-altin/KULCEALTIN` - Gram altın
- `GET /api/harem-altin/kategori/altin` - Kategori
- `GET /api/health` - Sağlık kontrolü

## 🔧 Özellikler

- ✅ 30 saniye cache
- ✅ CORS açık
- ✅ OPTIONS desteği
- ✅ Error handling
- ✅ Health check

## 📦 Bağımlılıklar

- express: Web framework
- axios: HTTP client
- serverless-http: Netlify adapter
- querystring: Form encoding

## ⚡ Deploy

```bash
npx netlify deploy --prod
```

URL: `https://sizin-site.netlify.app/api/harem-altin`