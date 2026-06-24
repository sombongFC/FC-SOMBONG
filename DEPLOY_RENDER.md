# Cara Online-kan FC Sombong League

Versi ini sudah ditambahkan penyimpanan data bersama di server melalui endpoint:

- `GET /api/state`
- `POST /api/state`

Jadi data match, klasemen, roster, setting, dan user input tidak lagi hanya tersimpan di browser masing-masing.

## Deploy paling mudah: Render

1. Buat akun di Render.com.
2. Upload project ini ke GitHub.
3. Di Render pilih **New > Web Service**.
4. Connect repository GitHub project ini.
5. Setting:
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: free/paid sesuai kebutuhan
6. Tambahkan Persistent Disk agar data tidak hilang saat restart:
   - Mount Path: `/opt/render/project/src/data`
   - Size: 1 GB cukup
7. Deploy.
8. Setelah online, buka URL Render yang diberikan.

## Catatan penting

- Kalau pakai Render Free, website bisa sleep saat lama tidak dipakai.
- Untuk komunitas yang aktif, lebih baik pakai plan berbayar kecil agar selalu hidup.
- Login superadmin masih memakai password yang tersimpan di setting website, jadi jangan pakai password penting pribadi.
- Untuk versi production yang lebih aman, tahap berikutnya sebaiknya pindah ke Supabase/PostgreSQL + password hash.
