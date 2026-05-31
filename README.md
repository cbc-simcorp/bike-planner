# BikePlanner

A consumer-oriented bike-ride planning app. Next.js 16 (App Router) + TypeScript + Tailwind CSS v4.

## Run locally

```pwsh
cd C:\Users\CBC\BikePlanner
npm run dev
```

Open http://localhost:3000 in your browser.

## Access from your phone (same Wi-Fi)

```pwsh
npm run dev:lan
```

Then on your phone, open `http://<your-laptop-LAN-IP>:3000`. Find your IP with:

```pwsh
ipconfig | Select-String "IPv4"
```

If Windows Firewall blocks it, allow inbound TCP on port 3000 for your private network.

## Project structure

- `src/app/layout.tsx` — root layout, metadata, viewport
- `src/app/page.tsx` — dashboard home page
- `src/app/globals.css` — Tailwind entry

## Build for production

```pwsh
npm run build
npm start
```
