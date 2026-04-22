# Unified Dashboard Suite

This project delivers a complete starter implementation for:
- **Admin dashboard** (user + platform overview)
- **Client dashboard** (sessions + support ticket creation)
- **Companion dashboard** (assigned tickets + upcoming sessions)

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## API overview

- `GET /api/health`
- `GET /api/admin/overview`
- `PATCH /api/admin/users/:id`
- `GET /api/client/:id/dashboard`
- `POST /api/client/:id/tickets`
- `GET /api/companion/:id/dashboard`
- `PATCH /api/companion/:id/tickets/:ticketId`

## Notes

- Data is currently in-memory for demo purposes (`server.js`).
- You can later replace the in-memory `db` object with a persistent datastore.
