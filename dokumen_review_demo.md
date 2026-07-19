# Panduan Review Fungsionalitas & Skenario Video Demo
## EduClass AI — Platform Pembelajaran Pintar & Tutor AI Kontekstual

Dokumen ini disusun untuk membantu Anda melakukan review fungsionalitas menyeluruh pada project **EduClass AI** sekaligus berfungsi sebagai **panduan script / storyboard** dalam pembuatan video demonstrasi aplikasi.

---

## 1. Gambaran Umum Project & Teknologi

**EduClass AI** adalah platform *e-learning* berbasis web interaktif dengan desain UI modern (*glassmorphism*, dark/light mode transition, mikro-animasi) yang dirancang untuk mempertemukan Admin, Guru, dan Siswa dalam satu ekosistem pembelajaran digital. Platform ini menonjolkan fitur **Tutor AI Kontekstual** yang dapat mendampingi siswa belajar mandiri berdasarkan modul materi yang dibaca secara *real-time*.

### Kunci Implementasi Teknis:
- **Teknologi Core**: HTML5, Vanilla CSS3 (desain responsif, transisi halus, Glassmorphism), dan Javascript modern (ES6+).
- **State Management & Sinkronisasi**: Menggunakan `LocalStorage` terpusat yang bertindak sebagai database lokal (diatur melalui [state.js](js/state.js)).
- **Simulasi AI Tutor**: Menggunakan logika pencocokan kata kunci (*keyword matching* & heuristik) di [ai.js](js/ai.js) untuk menyajikan respons tutor AI kontekstual per halaman modul pelajaran, lengkap dengan kuis interaktif dan analisis materi otomatis.
- **Akun Simulasi Demo**:
  - **Siswa**: `siswa` / `password`
  - **Guru**: `guru` / `password` (ada juga `guru2`)
  - **Admin**: `admin` / `password`

---

## 2. Review Fungsionalitas Berdasarkan Role

### A. Fitur Siswa (Siswa Portal - [siswa.html](siswa.html))
1. **Dasbor Utama (Overview)**:
   - Tampilan statistik kehadiran secara langsung (*Total Mapel*, *Jumlah Hadir*, *Jumlah Bolos/Alfa*).
   - Daftar Tugas Aktif dengan *countdown* sisa waktu.
   - Jadwal pelajaran mingguan sesuai plotting kelas siswa.
   - Akses cepat materi pembelajaran terbaru.
   - **Banner Notifikasi Real-time**:
     - *Alert Presensi*: Muncul otomatis jika Guru membuka sesi presensi kelas (memungkinkan siswa mengetikkan kode 6-digit untuk hadir).
     - *Alert Materi Baru*: Muncul ketika ada pembaharuan materi dari Guru.
2. **Daftar Kelas & Detail Mapel**:
   - Direktori anggota kelas dan guru pengampu.
   - Detail per mata pelajaran: riwayat kehadiran per pertemuan dan daftar materi spesifik mapel tersebut.
3. **Mulai Belajar (AI Study Room)**:
   - **Subject & Material Gateway**: Pemilihan mata pelajaran dan modul materi dengan transisi visual yang mulus.
   - **Split Screen Workspace**:
     - *Panel Kiri (Modul/PDF)*: Siswa bisa beralih antara "Ringkasan" (AI summary poin-poin penting materi) dan "Asli (PDF)" (tampilan halaman per halaman modul orisinal).
     - *Panel Kanan (Tutor AI)*: Chatbot interaktif yang menjawab pertanyaan siswa secara spesifik sesuai halaman yang sedang dibuka.
   - **Quick Action Buttons AI**:
     - *Jelaskan Lebih Sederhana*: AI menyederhanakan rumus/teks menggunakan analogi visual (contoh: analogi kotak kado misterius untuk variabel aljabar).
     - *Berikan Contoh*: AI memberikan draf soal latihan beserta penyelesaian detail.
     - *Beri Saya Petunjuk*: AI memberikan tips atau *cheat sheet* cara cepat mengingat rumus.
     - *Uji Pemahaman Saya*: AI meluncurkan kuis pilihan ganda interaktif dengan penjelasan langsung saat opsi diklik (Benar/Salah).

### B. Fitur Guru (Guru Portal - [guru.html](guru.html))
1. **Overview Dasbor**:
   - **Jadwal Mengajar Hari Ini**: Mengidentifikasi hari aktif dan menampilkan mata pelajaran terdekat.
   - **Radar Chart Performa Guru**: Visualisasi statistik operasional guru menggunakan radar chart dinamis (Jurnal Kelas, Pembuatan Modul, Kecepatan Koreksi, Persentase Kehadiran).
   - **Laporan Akademis Berbasis AI**: Ringkasan evaluasi kelas otomatis berbasis AI mengenai kemajuan materi dan siswa yang butuh bimbingan ekstra.
   - **Smart AI Insights (Pertanyaan Siswa)**: Mengelompokkan riwayat pertanyaan tersulit siswa menjadi topik agregasi berlabel tag keparahan (*Kritis*, *Bingung*, *Tuntas*).
2. **Manajemen Kelas & Siswa**:
   - Menampilkan direktori kelas dan siswa yang diampu, serta daftar mata pelajaran aktif di kelas tersebut.
3. **Kelola Sesi Presensi Mandiri**:
   - Pengaturan durasi aktif sesi presensi (5, 10, 15, atau 30 menit).
   - Pembuatan kode presensi acak 6-digit secara *real-time* disertai hitung mundur kedaluwarsa.
   - Tabel pemantauan presensi siswa hari ini beserta opsi koreksi manual instan (Hadir, Sakit, Izin, Alfa).
4. **Materi & PDF Hub**:
   - Daftar modul yang sudah dipublikasikan.
   - **Buat Materi (Simulasi PDF)**: Formulir pembuatan judul, deskripsi, isi per halaman dokumen (sebagai basis pengetahuan AI), serta area drag & drop file PDF.
   - **Tombol Template Instan**: Mengisi otomatis modul materi "Teorema Pythagoras" untuk memudahkan simulasi presentasi.

### C. Fitur Super Admin (Admin Portal - [admin.html](admin.html))
1. **Ringkasan Sistem**: Tampilan kuantitatif data master (*Total Guru*, *Siswa*, *Kelas*, *Mapel*, *Materi*, *Presensi Harian*).
2. **Kelola Guru**: CRUD data guru pengampu (sinkron ke subject).
3. **Kelola Siswa**: CRUD data siswa beserta pembagian plotting kelas.
4. **Kelola Kelas**: CRUD data kelas (misal: VIII-A, VIII-B).
5. **Kelola Mapel**: CRUD mata pelajaran lengkap dengan plotting guru pengampu, kode gabung, jadwal, serta plotting ke beberapa kelas sekaligus.

---

## 3. Skenario & Storyboard Alur Demo Video (Durasi ± 5 - 7 Menit)

Berikut draf skenario ideal untuk mendemonstrasikan keunggulan platform dalam satu alur cerita terintegrasi:

| Bagian | Visual / Halaman | Tindakan Narator / Aktor | Poin Penting yang Ditonjolkan |
| :--- | :--- | :--- | :--- |
| **01. Pembuka & Login** | `index.html` | 1. Tunjukkan halaman Login dengan visual Glassmorphism gelap/terang.<br>2. Pilih role **Siswa** dan klik tombol "Masuk ke Kelas" menggunakan akun demo `siswa` / `password`. | Kemudahan akses, desain estetik responsif, opsi pemilihan role yang praktis. |
| **02. Eksplorasi Siswa & Belajar AI** | `siswa.html` | 1. Tunjukkan statistik dasbor siswa.<br>2. Masuk ke tab **Mulai Belajar (AI)**, pilih mapel **Matematika**, dan klik materi **Aljabar Dasar**.<br>3. Di ruang belajar: Beralih dari tab **Ringkasan** ke **Asli (PDF)** dan navigasikan ke halaman 2.<br>4. Di kolom Chatbot AI, ketik: *"apa itu suku sejenis?"* lalu klik kirim.<br>5. Klik tombol cepat **💡 Jelaskan lebih sederhana** dan **✏️ Uji pemahaman saya** (lalu klik opsi kuis untuk menunjukkan umpan balik instan). | - Ringkasan materi otomatis oleh AI.<br>- Kemampuan AI melacak halaman aktif PDF.<br>- Penjelasan cerdas menggunakan analogi buah.<br>- Kuis interaktif dengan *feedback explanation*. |
| **03. Guru: Membuka Presensi & AI Insights** | Logout dari Siswa, Login ke `guru.html` | 1. Sorot Radar Chart dan Laporan Akademis AI.<br>2. Sorot bagian **Smart AI Insights** yang memetakan kebingungan siswa secara otomatis.<br>3. Masuk ke tab **Kelola Presensi**, pilih durasi 10 menit, lalu klik **Buka Sesi Baru**.<br>4. Tunjukkan kode 6-digit yang muncul (misal: `123456`) dan hitung mundur aktif. | - Analisis performa operasional guru.<br>- Insight kesulitan belajar siswa berbasis AI.<br>- Pembuatan sesi presensi pintar & dinamis. |
| **04. Siswa: Presensi Real-time** | Logout dari Guru, Login ke `siswa.html` | 1. Tunjukkan banner ungu berkedip: *"Sesi presensi Matematika sedang berlangsung..."* yang terdeteksi otomatis.<br>2. Klik tombol masukkan kode, masukkan kode 6-digit yang dibuat guru, dan kirim.<br>3. Tunjukkan bahwa status kehadiran langsung berubah dan banner menghilang. | - Deteksi sesi presensi secara instan tanpa perlu memuat ulang halaman (Background monitoring). |
| **05. Guru: Koreksi Kehadiran & Upload Materi** | Logout dari Siswa, Login ke `guru.html` | 1. Buka tab **Kelola Presensi**, tunjukkan nama siswa Andi Wijaya sudah otomatis berstatus "Hadir".<br>2. Lakukan koreksi manual untuk siswa lain (misal ubah "Siti" menjadi "Izin").<br>3. Buka tab **Materi & PDF**, klik **Buat & Unggah Materi**.<br>4. Klik tombol **Gunakan Template Pythagoras** untuk mengisi formulir otomatis, lalu klik **Simpan & Publikasikan**. | - Kemudahan manajemen kehadiran kelas.<br>- Pengunggahan materi instan dengan bantuan template demo. |
| **06. Admin: Data Master** | Logout dari Guru, Login ke `admin.html` | 1. Tunjukkan ringkasan sistem dasbor Admin.<br>2. Klik tab **Kelola Mapel**, perlihatkan pemetaan guru dan kelas.<br>3. Coba lakukan edit atau tambah data sederhana untuk memperlihatkan proses CRUD yang lancar. | - Kontrol penuh data akademik sekolah.<br>- Relasi terpusat antara data siswa, guru, kelas, dan mapel. |
| **07. Penutup** | Tampilan Dashboard / Landing Page | Sampaikan kesimpulan penutup tentang bagaimana EduClass AI memodernisasi cara belajar mandiri siswa dengan bantuan asisten AI kontekstual. | EduClass AI: Pembelajaran Cerdas, Masa Depan Cerah. |

---

## 4. Tips Tambahan Untuk Perekaman Video Demo

1. **Gunakan Mode Gelap (Dark Mode)**: Tampilan visual default (dark mode) memberikan kesan estetika premium yang sangat baik. Coba ganti ke *light mode* satu kali di awal video menggunakan tombol toggle ikon matahari/bulan di pojok kanan atas untuk menunjukkan fleksibilitas tema aplikasi.
2. **Demonstrasikan Responsivitas Mobile**: Anda dapat memperkecil jendela browser hingga ukuran mobile saat merekam. Aplikasi memiliki transisi tata letak *bottom-navigation* dan *slide-drawer hamburger* yang rapi untuk perangkat seluler.
3. **Persiapkan Kode Presensi**: Saat merekam alur transisi dari Guru ke Siswa (Scene 3 ke Scene 4), pastikan untuk mencatat kode 6 digit yang digenerate oleh guru agar saat berpindah ke akun siswa, kode tersebut langsung valid digunakan.
