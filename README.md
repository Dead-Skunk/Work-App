# Field Forms (PWA)

This is a dependency-free prototype for a field-intake app. It runs in the browser and can be installed as a PWA on iOS, Android, and Windows.

## Run locally

Open `index.html` directly in a browser, or serve the folder with any static server.

## Notion integration

The client expects a backend endpoint (recommended) that writes to Notion, because your Notion API key must stay private.

This repo includes a Cloudflare Pages Function at `/api/submit` that writes to Notion.

1. Deploy this project to Cloudflare Pages.
2. Add these environment variables in Cloudflare Pages:
   - `NOTION_API_KEY`: your Notion integration token
   - `NOTION_DATABASE_ID`: your Notion database ID
3. The endpoint will auto-create the properties below if they do not exist (matching names and types):
   - Service (select)
   - Employee ID (rich text)
   - Client Name (rich text)
   - Client Birthday (date)
   - Client SSN Last4 (rich text)
   - Contact Phone (phone)
   - Contact Email (email)
   - Address (rich text)
   - City (rich text)
   - State (rich text)
   - Zip (rich text)
   - Preferred Contact (select)
   - Referral Source (rich text)
   - Services Requested (rich text)
   - Situation (rich text)
   - Goals (rich text)
   - Additional Info (rich text)
   - Consent (checkbox)
   - Household Size (number)
   - Monthly Income (number)
   - Employment Status (select)
   - Dependents (number)
   - Utility Account (rich text)
   - Balance Due (number)
   - Notes (rich text)
   - Representative Name (rich text)
   - Gender (select)
   - Client Key (rich text)
   - Submitted At (date)
   - Attachments (rich text)
   - Raw Payload (rich text)
4. Set `APP_CONFIG.notionWebhookUrl` in `config.js` to `/api/submit` when you deploy.

## Authentication

Employee sign-in is validated by a backend endpoint that returns a token. This repo includes a Cloudflare Pages Function at `/api/auth`.

1. Deploy this project to Cloudflare Pages (Functions will run automatically).
2. Add these environment variables in Cloudflare Pages:
   - `AUTH_SECRET`: a long random string
   - `EMPLOYEE_IDS`: comma-separated list of valid IDs (e.g., `1234,5678,9012`)
   - `AUTH_TTL_SECONDS`: token lifetime in seconds (optional, default 3600)
3. Set `APP_CONFIG.authEndpoint` in `config.js` to `/api/auth` (already the default).

## Local storage

The app stores the employee ID, selected client key, and intake completion map in `localStorage` to support resume after refresh. Auth tokens are stored in `sessionStorage` and require re-login when the browser session ends. If this is not acceptable for your data policy, remove the persistence helpers in `app.js`.

## Next steps

- Replace the service form schema in `app.js` with your real forms.
- Add validation rules required by your org.
- Add PNG icons (192x192 and 512x512) if you prefer PNG over SVG.

## Resume later

Conversation recap:
- Stack choice: PWA (web app installable on Windows/iOS/Android).
- Hosting: Cloudflare Pages (free) with a Squarespace-managed domain.
- Subdomain plan: e.g. `forms.yourdomain.com` pointing to `<project>.pages.dev` via CNAME.
- Notion: needs a backend endpoint to keep the Notion API key private.

If you reopen this later, tell Codex:
- Project path: `C:\Users\Admin\Desktop\Work App`
- Hosting: Cloudflare Pages
- Domain: Squarespace-managed
