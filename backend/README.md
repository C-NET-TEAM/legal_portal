# CMS-SMS Shared Backend

Shared Node.js / Express backend service for CMS and SMS portals.

## Quick Start

```bash
# Start backend server
npm start
# or
node server.js
```

The server will listen on `http://localhost:5000` and automatically save data to `db.json`.

## Endpoints
- `POST /api/auth/register` - Client registration
- `POST /api/auth/login` - Client login
- `POST /api/sms/auth/register` - SMS Specialist registration
- `POST /api/sms/auth/login` - SMS Specialist login
- `GET /api/cases` - Get all cases (or filter by `?clientId=...`)
- `POST /api/cases` - Submit new case with documents
- `POST /api/cases/:id/review` - Review & approve case
- `POST /api/cases/:id/lex-output` - Submit Lex AI analysis
- `POST /api/cases/:id/final-review` - Complete case evaluation
- `POST /api/cases/:id/chat` - Real-time case chat
- `GET /api/alerts` - Notifications and alerts
