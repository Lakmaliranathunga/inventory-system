# SLPA Inventory API

Express and MySQL API for the SLPA Inventory Management System.

## Setup

1. Copy `.env.example` to `.env` and use a dedicated MySQL account.
2. Run `npm install`.
3. Run `npm run dev` during development or `npm start` in production.

Public registration is disabled; administrators create accounts through `/api/users`. Roles 1, 3, and 4 can change inventory data, while role 2 is read-only. Only administrators can manage users.

Invoice attachments are limited to one JPEG, PNG, WebP, or PDF file up to the configured size. Attachments are served only through the authenticated invoice attachment endpoint.

`npm test` runs non-mutating API smoke tests. `node scripts/check-integrity.js` reports duplicate identifiers and orphaned relationships.

Inventory is modeled as individually tracked physical assets. Every inventory row has quantity 1. Damage, disposal, and correction records synchronize the asset's current condition.

