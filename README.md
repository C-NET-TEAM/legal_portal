# Legal Portal (CMS & SMS Suite)

A full-stack, enterprise-grade legal management platform consisting of:
* **CMS (Client Management System)**: Client portal for case filing, real-time case tracking, timeline chat, and evidence submission.
* **SMS (Subject Matter Specialist System)**: Legal specialist dashboard for case review, categorization, legal notes, AI output evaluation, and approval workflows.
* **Backend API**: Node.js & Express service backed by **MongoDB Atlas** and **AWS EBS storage** for media documents.

---

## Live Production Deployment

* **Permanent HTTPS API**: [https://13-202-10-28.sslip.io/api/health](https://13-202-10-28.sslip.io/api/health)
* **Static Public IP**: `13.202.10.28` (AWS EC2 Elastic IP)
* **SSL / TLS**: Let's Encrypt automated certificate with Nginx reverse proxy
* **Database**: MongoDB Atlas (`cluster0.bdwezjh.mongodb.net`, Database: `legal_portal`)
* **Media Storage**: AWS EBS volume mount at `/data/legal_portal/uploads`

---

## Project Structure

```
legal-portal/
├── backend/                  # Node.js Express REST API
│   ├── models/               # Mongoose Schemas (User, SmsUser, Case, Alert)
│   ├── deploy/               # EC2 PM2 ecosystem & Nginx SSL automation scripts
│   ├── db.js                 # MongoDB Atlas connection manager
│   ├── upload.js             # AWS EBS disk storage via Multer
│   ├── server.js             # API route handlers and server entry
│   └── migrate_db.js         # JSON to MongoDB migration utility
├── cms/                      # React + Vite Client Management System
│   ├── src/                  # Components, styles, and API clients
│   └── package.json
└── sms/                      # React + Vite Subject Matter Specialist System
    ├── src/                  # Components, styles, and API clients
    └── package.json
```

---

## Getting Started Locally

### 1. Backend Setup

```bash
cd backend
npm install
npm start
```
*The backend connects to MongoDB Atlas and listens on `http://localhost:5000`.*

### 2. CMS (Client Portal) Setup

```bash
cd cms
npm install
npm run dev
```

### 3. SMS (Specialist Portal) Setup

```bash
cd sms
npm install
npm run dev
```

---

## License

Proprietary - C-NET TEAM. All Rights Reserved.
