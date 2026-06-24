# FC Sombong League Mobile App

Project export lengkap untuk hosting pihak ketiga.

## Isi Project

- `index.html` - file utama website mobile
- `index_mobile_app.html` - backup versi mobile
- `server.js` - server Node/Express untuk hosting yang butuh backend ringan
- `package.json` - konfigurasi Node.js
- `database/schema.sql` - struktur tabel Supabase/PostgreSQL
- `api/health.js` - health endpoint untuk Vercel/serverless
- `assets/`, `images/`, `css/`, `js/` - folder cadangan untuk pengembangan lanjutan

## Cara Deploy Paling Mudah

### Netlify
Upload seluruh ZIP ini ke Netlify Drop. Pastikan `index.html` berada di root folder.

### Vercel
Import project/folder ini ke Vercel. Vercel akan membaca `index.html` sebagai static site.

### Hosting cPanel
Upload semua isi folder ke `public_html`.

### VPS/Node Hosting
Jalankan:

```bash
npm install
npm start
```

Website berjalan di port `3000` atau port dari environment hosting.

## Database Supabase
Buka Supabase > SQL Editor, lalu jalankan isi file:

`database/schema.sql`

Catatan: versi HTML saat ini masih bisa berjalan mandiri. Integrasi penuh Supabase perlu tahap berikutnya, yaitu mengganti penyimpanan localStorage menjadi database online.
