# 🏸 Racket Arena - Badminton & Padel Tournament Hub

Platform manajemen dan *live score* turnamen Bulutangkis (Badminton) dan Padel berbasis **Next.js (App Router)**, **TypeScript**, dan **Tailwind CSS**. Didesain ringan, minimalis, dan sangat efisien untuk di-deploy gratis di **Vercel Free Tier** dengan estimasi traffic hingga 500+ pengguna simultan saat jam puncak (*peak hour*).

---

## 🌟 Fitur Utama

### 1. Role: Penonton (Spectator - Public View)
* **Live Match Center**: Melihat pertandingan yang sedang berlangsung secara langsung (*real-time status*) di masing-masing lapangan (*Court 1, Court 2, dst.*).
* **Bagan Turnamen Interaktif (Knockout Bracket Tree)**:
  * Visualisasi bagan sistem gugur babak Perempat Final, Semifinal, hingga Final.
  * Dilengkapi **garis penghubung cabang (*bracket tree connectors*)** yang tegas dan simetris antar-babak.
  * Penobatan Juara 1 otomatis pada podium akhir (*Champion Banner*).
* **Jadwal & Hasil Pertandingan**:
  * Filter status: *Semua*, *🔴 LIVE*, *🕒 Akan Datang*, *✅ Selesai*.
  * Filter berdasarkan Lapangan (*Court*).
  * Pencarian instan teroptimasi (*Debounced Search 350ms*) untuk pemain dan pasangan.
* **Daftar Peserta & Seeding**: Menampilkan pemain/pasangan terdaftar, klub asal, dan nomor unggulan (*seed*).

### 2. Role: Admin & Wasit (Management & Live Scoring)
* 🔒 **Autentikasi Admin**: Akses khusus admin dengan PIN (Default: `admin123` / 1-Klik Demo Login).
* 🏆 **Pembuat Turnamen Otomatis**:
  * Pilihan cabang: **Badminton** (Format 21 poin) atau **Padel** (Format 6 game set).
  * Auto-generator bagan sistem gugur (*single elimination tree*) untuk 4, 8, atau 16 peserta.
  * Fitur 1-Klik Isi Data Sampel (*Quick Demo Filler*).
* ⚡ **Konsol Wasit / Live Scoring Touchpad**:
  * Tombol sentuh besar `+1` dan `-1` poin per set.
  * **Aturan Resmi Skor & Deuce BWF / Padel**:
    * Poin normal berhenti di 21 (Badminton).
    * Penambahan di atas 21 hanya diizinkan saat posisi *Deuce* (20-20) dengan batas maksimal 30 poin.
  * **Auto-Advancement Bracket**: Ketika tim meraih 2 set kemenangan, sistem secara otomatis meloloskan pemenang ke babak berikutnya di bagan.
  * Penugasan lapangan (*Court*) dan jadwal jam tanding.

---

## 🛠️ Tech Stack & Arsitektur

* **Full-Stack Framework**: Next.js 15+ (App Router, Server & Client Components)
* **Bahasa**: TypeScript (100% Type-Safe)
* **Styling**: Tailwind CSS v4 (Athletic Dark Theme, Slate & Lime Accents)
* **Ikon**: Lucide React
* **Efek Perayaan**: Canvas Confetti
* **State & Sync**: LocalStorage + `BroadcastChannel` (Sinkronisasi multi-tab instan tanpa lag)
* **Optimasi Performa**: Custom `useDebounce` hook untuk efisiensi input & database query

---

## 🚀 Cara Menjalankan di Komputer Lokal

1. **Clone / Buka Folder Project**:
   ```bash
   cd d:/prototype
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```

4. **Buka di Browser**:
   * Halaman Publik Penonton: [`http://localhost:3000`](http://localhost:3000)
   * Login Admin: [`http://localhost:3000/admin/login`](http://localhost:3000/admin/login) (PIN: `admin123`)
   * Dashboard Admin: [`http://localhost:3000/admin`](http://localhost:3000/admin)

---

## 🌐 Panduan Deploy Gratis ke Vercel (Hobby Tier)

1. Upload / Push repository ini ke akun **GitHub** Anda.
2. Buka **[vercel.com](https://vercel.com)** dan masuk dengan GitHub.
3. Klik **"Add New Project"** dan pilih repository ini.
4. Framework Preset akan otomatis terdeteksi sebagai **Next.js**.
5. Klik **"Deploy"**.
6. Website langsung online dengan URL publik gratis (contoh: `https://turnamen-racket.vercel.app`).

---

## 📝 Catatan Pembaruan & Changelog

Setiap perubahan, perbaikan bug, dan penambahan fitur dicatat secara berkala di bawah ini:

### [v1.4.0] - 2026-08-20 (Terbaru — Production Ready)
* **🔴 Bug Fix Kritis — Crash pada Pencarian Jadwal**:
  * Memperbaiki `TypeError` saat mengetik pencarian di halaman jadwal ketika peserta belum terisi (*TBD*). Menambahkan *optional chaining* (`?.name?.toLowerCase()`).
* **🧹 Pembersihan Unused Imports (11 File)**:
  * Menghapus 20+ ikon Lucide React dan tipe TypeScript yang di-import tetapi tidak digunakan di seluruh *codebase*. Mengurangi ukuran *bundle* dan waktu evaluasi JavaScript.
* **⚡ Optimasi Bundle untuk Vercel Free Tier**:
  * Menambahkan `optimizePackageImports: ['lucide-react']` pada `next.config.ts` untuk *tree-shaking* ikon secara otomatis.
  * Menambahkan `poweredByHeader: false` untuk keamanan.
  * Menghapus *font* Google Geist yang di-download tetapi tidak dirender (~50KB *bandwidth* hemat per kunjungan).
* **🔒 Perbaikan Memory Leak (`BroadcastChannel`)**:
  * Mengganti `.onmessage` langsung dengan `addEventListener` / `removeEventListener` pada hook `useTournaments` dan `useTournament` agar *listener* dibersihkan saat komponen di-*unmount*.
* **🛡️ Penanganan Error `localStorage`**:
  * Menambahkan `try/catch` pada semua operasi `localStorage` di `authStore.ts` dan `tournamentStore.ts` (`resetDefaults`). Mencegah *crash* pada mode *Private Browsing* atau saat *storage* penuh.
* **🎨 Perbaikan CSS Tailwind**:
  * Mengganti class non-standar `border-slate-850` → `border-slate-800` dan `py-0.2` → `py-0.5`.
  * Menghapus 5 CSS custom property yang tidak digunakan dari `globals.css`.
* **🔗 Keamanan Link Eksternal**:
  * Menambahkan `rel="noopener noreferrer"` pada semua link `target="_blank"`.
* **📋 SEO & Social Sharing**:
  * Menambahkan `metadataBase` dan `openGraph` metadata pada `layout.tsx` agar *preview link* tampil rapi di WhatsApp, Telegram, dll.


### [v1.3.0] - 2026-08-17
* **Optimasi Search Bar (`useDebounce`)**:
  * Menambahkan custom hook `useDebounce` (350ms) pada kolom pencarian turnamen dan jadwal.
  * Menghindari spamming query saat user mengetik cepat, siap terhubung ke database besar tanpa membebani server.
* **Pembersihan Layout Hero**:
  * Menyederhanakan hero banner menjadi ringkas, minimalis, dan menghapus box metrik yang memakan ruang.
* **Perapian Tampilan Skor**:
  * Menghilangkan ikon piala di samping skor agar kolom angka skor rata sempurna dan tidak bergeser.

### [v1.2.0] - 2026-08-17
* **Desain Bagan Tegas & Garis Penghubung**:
  * Menambahkan garis cabang penghubung 2px simetris antar-babak (*Perempat Final -> Semifinal -> Final -> Juara*).
  * Meningkatkan kontras border kotak pertandingan (`border-2 border-slate-700`).
* **Pembersihan Indikator**:
  * Menghilangkan indikator titik hijau servis di sebelah nama pemain demi estetika yang bersih dan minimalis.
* **Perbaikan SSR Hydration Mismatch**:
  * Menyelaraskan initial state pada SSR dan Client di `useTournaments` & `useTournament` untuk mencegah hydration error.
  * Menambahkan `suppressHydrationWarning` pada tag HTML root.

### [v1.1.0] - 2026-08-17
* **Aturan Skor Resmi & Validasi Deuce**:
  * Pembatasan skor badminton maksimal 21 poin jika tanpa deuce.
  * Dukungan aturan Deuce (20-20) dengan batas *sudden death* 30 poin.
  * Aturan set Padel (6 game normal, 7 game deuce/tiebreak).
* **Otomatisasi Lolos ke Babak Selanjutnya (*Auto Bracket Advancement*)**:
  * Pemenang babak perempat final otomatis terisi ke babak semifinal saat pertandingan diselesaikan.
  * Penambahan opsi ubah slot pemain secara manual pada modal wasit.
* **Sinkronisasi Multi-Tab (`BroadcastChannel`)**:
  * Data yang diperbarui di tab admin langsung tampil di tab penonton tanpa perlu refresh.

### [v1.0.0] - 2026-08-17
* Inisialisasi MVP Project dengan Next.js App Router, TypeScript, dan Tailwind CSS.
* Pembuatan struktur data dasar Turnamen Badminton & Padel.
* Implementasi Match Center, Knockout Bracket Viewer, Match Schedule, dan Admin Dashboard.
