# SLPA Inventory Management System

React frontend for the Sri Lanka Ports Authority inventory application.

## Setup

1. Copy `.env.example` to `.env.local` and set `REACT_APP_API_URL`.
2. Run `npm install`.
3. Run `npm start` for development or `npm run build` for production.

Authentication uses an eight-hour JWT stored in browser local storage. The shared API client attaches the token and returns the user to the login page when the server rejects an expired token.

## Main modules

- Dashboard
- Unit-tracked inventory assets
- Item types, main categories, and subcategories
- Suppliers and invoice attachments
- Damage/disposal adjustments
- Reports with print, PDF, and Excel export
- Administrator-only user management

Run `CI=true npm test -- --watchAll=false` for the frontend smoke test.

