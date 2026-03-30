# MoM (Meeting of Minutes) Management App

Aplikasi CRUD sederhana untuk mengelola **MoM (Meeting of Minutes)** dengan fitur autentikasi dan dashboard.

---

## 🎯 Fitur Aplikasi
- Login
- Dashboard
- CRUD MoM (Create, Read, Update, Delete)
- Logout

---

## 🧱 Arsitektur Aplikasi

Aplikasi menggunakan arsitektur client–server dengan pemisahan frontend, backend, dan database.

```
[ React (Frontend) ]  --->  [ FastAPI (Backend) ]  --->  [ PostgreSQL (Database) ]
```

### Deployment VM
| Komponen | IP Address |
|--------|------------|
| App Server (FE + BE) | 10.100.33.70 |
| Database Server | 10.100.33.69 |

---

## ⚙️ Teknologi yang Digunakan

### Backend
- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT Authentication

### Frontend
- React
- TypeScript
- Axios

### Database
- PostgreSQL

---

## 📂 Struktur Project

```
mom-app/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   └── mom.py
│   │   ├── core/
│   │   │   └── security.py
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   └── session.py
│   │   ├── models/
│   │   │   └── mom.py
│   │   ├── schemas/
│   │   │   └── mom.py
│   │   └── main.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── App.tsx
│   └── package.json
│
└── README.md
```

---

## 🔐 Flow Aplikasi

1. User membuka aplikasi
2. User login
3. Jika autentikasi berhasil, user masuk ke dashboard
4. User dapat:
   - Menambahkan MoM
   - Melihat daftar MoM
   - Mengubah MoM
   - Menghapus MoM
5. User logout

---

## 🗄️ Desain Database

### Tabel `users`
| Field | Tipe |
|-----|------|
| id | SERIAL (PK) |
| username | VARCHAR |
| password_hash | VARCHAR |
| created_at | TIMESTAMP |

### Tabel `mom`
| Field | Tipe |
|------|------|
| id | SERIAL (PK) |
| title | VARCHAR |
| meeting_date | DATE |
| content | TEXT |
| created_by | INTEGER (FK → users.id) |
| created_at | TIMESTAMP |

---

## 🔧 Konfigurasi Backend

### File `.env`
```env
DATABASE_URL=postgresql://mom_user:password@10.100.33.71:5432/mom_db
SECRET_KEY=your_secret_key
```

### Menjalankan Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 🎨 Konfigurasi Frontend

### Menjalankan Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Frontend
```env
VITE_API_URL=http://10.100.33.70:8000
```

---

## 🚀 Deployment Notes
- Backend dan Frontend berjalan di VM App (`10.100.33.70`)
- PostgreSQL berjalan di VM DB (`10.100.33.69`)
- Pastikan port berikut terbuka:
  - `8000` (FastAPI)
  - `5432` (PostgreSQL)
- Untuk production disarankan menggunakan Nginx sebagai reverse proxy

---

## 📌 Pengembangan Selanjutnya
- Role-based access (Admin / User)
- Pagination & search MoM
- Export MoM ke PDF
- Docker & Docker Compose
- Migrasi ke Kubernetes

---

## 📄 Lisensi
Project ini dibuat untuk kebutuhan pembelajaran dan pengembangan internal.
