# Bebislogg

En PWA för att logga sömn, matning och D-droppar. All data ligger lokalt i telefonen
(IndexedDB). Det finns ingen server och inget konto.

## Utveckling

```sh
npm install
npm run dev        # http://localhost:5173/bebislogg/
npm test           # enhetstester (Vitest)
npm run build      # typkontroll + produktionsbygge i dist/
npm run preview    # servera dist/ lokalt
```

## Publicering på GitHub Pages

Appen publiceras på `https://<användare>.github.io/bebislogg/`. Sökvägen är satt i
`vite.config.ts` (`base`). Om den ändras får den installerade appen en ny, tom lagring.
Datan måste då flyttas med export och import.

1. Skapa ett publikt repo som heter `bebislogg` på GitHub och pusha `main`.
2. Gå till repots **Settings → Pages** och välj **Source: GitHub Actions**.
3. Varje push till `main` kör tester, bygger och publicerar via
   `.github/workflows/deploy.yml`.
