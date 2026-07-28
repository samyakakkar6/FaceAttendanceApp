# FaceAttendanceApp

---

## 👨‍💻 Author

Developed and maintained by **Samya Kakkar**.

If you have any questions, suggestions, or encounter an issue, please open an issue in this repository.

---

## Features

### Employee Flow
```
Register → Verify OTP → Register Face → (Daily) Check Geofence → Face Scan → Punch In
                                                                  Face Scan → Punch Out
```

| Step | Description |
|---|---|
| **Registration** | Name, email, phone, password → account created |
| **OTP Verification** | 6-digit code sent to email (10-min expiry) |
| **Face Registration** | Front camera captures 128-dimension face descriptor via `face-api.js` |
| **Geofencing** | Device GPS checked against office coordinates + radius (server-side Haversine formula) |
| **Punch In** | Face scan matches registered descriptor → punch-in photo + timestamp saved |
| **Punch Out** | Same face scan → shift duration automatically calculated |

### Admin Dashboard
- Real-time stats: Total / Present / Absent / Punched-Out counts
- Full attendance table filterable by date or employee
- **Punch-in & punch-out photos** viewable inline
- **Shift duration** shown per record (time between first punch-in and last punch-out)
- Employee roster with face-registration status

---

## Architecture

```
┌──────────────────────────────────────────┐
│           Mobile App (Cordova)           │
│   Vue 3 + Quasar + face-api.js           │
│                                          │
│  ┌────────┐  ┌──────────┐  ┌─────────┐  │
│  │ Camera │  │   GPS    │  │ Storage │  │
│  │(WebRTC)│  │ Geofence │  │  (JWT)  │  │
│  └────────┘  └──────────┘  └─────────┘  │
└──────────────────┬───────────────────────┘
                   │ HTTPS / REST API
┌──────────────────▼───────────────────────┐
│           Node.js + Express              │
│                                          │
│  /api/auth      ← OTP, JWT              │
│  /api/face      ← descriptor storage    │
│  /api/attendance← punch in/out + geo    │
│  /api/admin     ← reports & photos      │
│                                          │
│  SQLite (better-sqlite3)                 │
│  Multer uploads (punch photos)           │
└──────────────────────────────────────────┘
```

### Face Recognition Pipeline
```
Video Frame → TinyFaceDetector → FaceLandmark68TinyNet → FaceRecognitionNet
                                                              ↓
                                              128-dim Float32Array descriptor
                                                              ↓
                                          Euclidean distance < 0.5 → ✅ Match
```

All inference runs **on-device** inside the WebView. No face data is sent to external servers.

### Geofence Algorithm
```
Server-side Haversine distance:
  d = 2R · arctan(√a / √(1−a))
  where a = sin²(Δlat/2) + cos(lat₁)·cos(lat₂)·sin²(Δlng/2)

Employee must be within OFFICE_RADIUS_METERS of (OFFICE_LAT, OFFICE_LNG)
```

---

## System Design

### Layered architecture (separation of concerns)

**Backend** — every layer has a single responsibility, so any one can change without touching the others:

```
Routes  →  Services  →  Repositories  →  Database
(HTTP)     (business)    (SQL only)       (SQLite)
```

- **Routes** are thin: `validate → call service → respond`. No business logic.
- **Services** own the rules — OTP issuance, geofence enforcement, shift calculation, liveness policy.
- **Repositories** are the *only* place SQL lives. Swap SQLite for Postgres and services stay unchanged.
- **Config** (`config/index.js`) is the single source of truth for env; nothing else reads `process.env`.
- **Cross-cutting**: central `AppError` + error handler, Joi validation middleware, Winston logging, rate limiting, singleton DB and email transporter.

**Frontend** mirrors this: `Pages → Composables → API layer → Pinia stores`. Pages never call Axios directly; a single Axios instance injects the JWT and handles 401 redirects.

### Key design decisions & trade-offs

| Decision | Why | Trade-off |
|---|---|---|
| **On-device face recognition** (face-api.js) | Privacy — only a 128-number descriptor leaves the device, never the photo; also offloads compute from the server | Client is untrusted; mitigated with server-side geofence + liveness |
| **Server-side geofence** (Haversine) | The client UI can be spoofed; the punch endpoint re-verifies GPS | Slightly more coupling client↔server |
| **Stateless JWT auth** | Horizontal scale with no shared session store | Can't revoke a token before expiry (short 7d TTL mitigates) |
| **SQLite + better-sqlite3** | Zero-ops, fast synchronous reads, perfect for this scale | Single-writer; would move to Postgres for multi-tenant load |
| **SQLite → S3 via Litestream** | Durable persistence on an ephemeral free host with *no code change* | Not multi-region; point-in-time restore only |
| **Brevo HTTP email API** | Host blocks SMTP ports; HTTPS API works anywhere | External dependency; graceful in-app OTP fallback |
| **One codebase → SPA + PWA + APK** (Quasar) | Ship three targets without rewriting | Cordova WebView quirks (camera permissions) |

### Reliability & data integrity
- `UNIQUE(user_id, date)` prevents double punch-in per day; foreign keys + WAL mode on.
- **Idempotent admin seeding** — the bootstrap admin syncs to env on every boot, so restarts on the persisted DB never crash or duplicate.
- **Liveness (blink) check** and a **&lt;1-minute shift = "Not completed"** rule guard against spoofing and mis-punches.

### Frequently asked (interview) questions

**Q: How does the face match actually work?**
Each video frame runs a 3-model pipeline: **TinyFaceDetector** finds the face, **FaceLandmark68** aligns it (68 points), and **FaceRecognitionNet** encodes it into a **128-dimensional descriptor** (a Float32 vector). At registration we store that vector. At punch time we compute the **Euclidean distance** between the live descriptor and the stored one; if it's below a threshold (~0.45) for several consecutive frames, it's a match. Same person ≈ 0.3–0.45; different people ≈ 0.6+. All of this runs **in the browser** — the server only ever sees the vector, never the image (the punch *photo* is stored separately, only as audit evidence).

**Q: How do you prevent punch spoofing (e.g. holding up a photo, or faking location)?**
Layered defenses:
1. **Liveness detection** — the scanner tracks the **eye-aspect-ratio** across frames and requires a real **blink** before accepting a face. A static photo on a phone can't blink, so it's rejected.
2. **Server-side geofence** — GPS is re-checked with the Haversine formula on the punch endpoint; faking the client UI doesn't help because the server independently rejects out-of-radius coordinates.
3. **Single-face rule** — the frame must contain exactly one face.
4. **Match margin + multi-frame confirmation** — a match must hold for several frames under a strict distance threshold, not a single lucky frame.
5. **Mis-punch guard** — a shift under 1 minute is marked "Not completed."
6. **Auth** — JWT-scoped identity + email-OTP 2FA, so you can only punch as yourself.
*(A production system would add depth/IR liveness or a challenge-response head turn; blink liveness is the pragmatic on-device layer.)*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile Framework | [Quasar v2](https://quasar.dev) (Vue 3) + [Cordova](https://cordova.apache.org) |
| Face Recognition | [face-api.js](https://github.com/justadudewhohacks/face-api.js) (TensorFlow.js) |
| State Management | [Pinia](https://pinia.vuejs.org) |
| HTTP Client | [Axios](https://axios-http.com) |
| Backend | Node.js + [Express 4](https://expressjs.com) |
| Database | SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| Auth | JWT + Nodemailer OTP |
| File Storage | Local filesystem (Multer) |
| Hosting | Render (backend) + GitHub Pages (SPA) |
| CI/CD | GitHub Actions |

---

## Project Structure

```
Attendance/
├── backend/
│   ├── routes/
│   │   ├── auth.js          # Register, Login, OTP verify/resend
│   │   ├── face.js          # Face descriptor register & verify
│   │   ├── attendance.js    # Punch in/out with geofence check
│   │   └── admin.js         # Admin reports, photos, stats
│   ├── middleware/
│   │   └── auth.js          # JWT + admin guard
│   ├── uploads/             # Punch-in/out photos (gitignored)
│   ├── db.js                # SQLite schema + connection
│   ├── server.js            # Express app entry point
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── boot/
│   │   │   ├── axios.js     # Axios instance + JWT interceptor
│   │   │   └── face-api.js  # Load face-api.js models on app start
│   │   ├── components/
│   │   │   └── FaceScanner.vue  # Reusable camera + face detection component
│   │   ├── layouts/
│   │   │   ├── AuthLayout.vue   # Login/Register/OTP wrapper
│   │   │   └── AppLayout.vue    # Sidebar nav + geofence indicator
│   │   ├── pages/
│   │   │   ├── LoginPage.vue
│   │   │   ├── RegisterPage.vue
│   │   │   ├── OtpPage.vue
│   │   │   ├── FaceSetupPage.vue
│   │   │   ├── DashboardPage.vue
│   │   │   ├── HistoryPage.vue
│   │   │   ├── ProfilePage.vue
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.vue
│   │   │       ├── EmployeesPage.vue
│   │   │       ├── AttendancePage.vue
│   │   │       └── RecordDetailPage.vue
│   │   ├── router/          # Vue Router (hash mode for Cordova)
│   │   ├── services/
│   │   │   └── geofence.js  # Geolocation wrapper
│   │   └── stores/
│   │       └── auth.js      # Pinia auth store (JWT + user)
│   ├── src-cordova/
│   │   └── config.xml       # Cordova config + permissions
│   └── quasar.config.js
│
├── .github/workflows/
│   ├── ci.yml               # Build + smoke test on every PR
│   └── deploy.yml           # Auto-deploy on main push
└── README.md
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Android Studio | Latest (for APK build) |
| Java JDK | 17 |

### 1. Clone

```bash
git clone https://github.com/hritishmahajan/FaceAttend.git
cd FaceAttend
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env — set email credentials and office coordinates
npm install
npm start
# Server runs on http://localhost:3000
# Admin seeded automatically from ADMIN_EMAIL + ADMIN_PASSWORD
```

**Key `.env` variables:**

```env
JWT_SECRET=change_this_in_production
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_gmail_app_password   # Generate at myaccount.google.com/apppasswords

OFFICE_LAT=28.6139      # Office latitude
OFFICE_LNG=77.2090      # Office longitude
OFFICE_RADIUS_METERS=200
```

> **Development mode** (`NODE_ENV=development`): OTPs are printed to the console — no email needed.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm install -g @quasar/cli@2.3.0

# Set backend URL
echo "API_URL=http://localhost:3000" > .env

# Run in browser
quasar dev

# Build SPA
quasar build

# Build Android APK (requires Android Studio + ANDROID_HOME set)
quasar build -m cordova -T android
```

### 4. Download face-api.js Models

The browser build requires model weights in `frontend/public/models/`. Run:

```bash
cd frontend
node -e "
const fs = require('fs');
const https = require('https');
const path = require('path');
const base = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const models = 'public/models';
fs.mkdirSync(models, { recursive: true });
const files = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_tiny_model-weights_manifest.json',
  'face_landmark_68_tiny_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1',
];
files.forEach(f => {
  const out = fs.createWriteStream(path.join(models, f));
  https.get(base + '/' + f, r => r.pipe(out));
  console.log('Downloading', f);
});
"
```

Or download manually from the [face-api.js weights folder](https://github.com/justadudewhohacks/face-api.js/tree/master/weights) into `frontend/public/models/`.

---

## API Reference

### Auth

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, phone, password }` | Create account, send OTP |
| POST | `/api/auth/verify-otp` | `{ userId, otp }` | Verify OTP → returns JWT |
| POST | `/api/auth/login` | `{ email, password }` | Login → send OTP |
| POST | `/api/auth/resend-otp` | `{ userId }` | Resend OTP |

### Face

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/face/register` | ✅ | Upload face descriptor + photo |
| POST | `/api/face/verify` | ✅ | Confirm stored descriptor exists |

### Attendance

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/attendance/punch-in` | ✅ | Geofence check + save punch-in |
| POST | `/api/attendance/punch-out` | ✅ | Geofence check + save punch-out |
| GET | `/api/attendance/today` | ✅ | Today's record for current user |
| GET | `/api/attendance/my` | ✅ | Last 30 records for current user |

### Admin

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | Admin | Present/absent counts for a date |
| GET | `/api/admin/attendance` | Admin | All records (filter by date/user) |
| GET | `/api/admin/attendance/:id` | Admin | Single record with shift duration |
| GET | `/api/admin/employees` | Admin | All employee profiles |
| GET | `/api/admin/photo/:filename` | Admin | Serve punch photo |
| GET | `/api/admin/geofence` | Admin | Current geofence config |

---

## Deployment

### Backend → Render (Free Tier)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service → connect repo
3. **Root Directory:** `backend`
4. **Build Command:** `npm install`
5. **Start Command:** `npm start`
6. Add Environment Variables (from `.env.example`)
7. Copy the deploy hook URL → add as `RENDER_DEPLOY_HOOK` in GitHub Secrets

### Frontend → GitHub Pages

1. Add `API_URL=https://your-service.onrender.com` to GitHub Secrets
2. Push to `main` — GitHub Actions builds and deploys automatically
3. Enable Pages in repo Settings → Pages → `gh-pages` branch

### Build Android APK

```bash
# Install Android platform
cd frontend/src-cordova
cordova platform add android

# Build signed release APK
cd ..
quasar build -m cordova -T android -- --release
```

APK will be at `frontend/src-cordova/platforms/android/app/build/outputs/apk/release/`.

---

## Security Notes

- Face descriptors (128 floats) are stored server-side; no raw facial images leave the device for matching
- Geofence is validated **server-side** — spoofing GPS on the client won't bypass the check
- OTPs expire in 10 minutes and are single-use
- Rate limiting applied to all auth endpoints (30 req / 15 min)
- JWT tokens expire in 7 days

---

## Screenshots

| Login | OTP | Face Setup |
|---|---|---|
| ![Login](docs/login.png) | ![OTP](docs/otp.png) | ![Face Setup](docs/face-setup.png) |

| Dashboard | Punch In Scan | Admin |
|---|---|---|
| ![Dashboard](docs/dashboard.png) | ![Scan](docs/scan.png) | ![Admin](docs/admin.png) |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.

© 2026 Samya Kakkar. All rights reserved.
