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
npm run icons      # rita om ikoner och iOS-startbilder från src/assets/app-icon.svg
```

Ikonerna i `public/` genereras av `scripts/generate-icons.mjs` och är incheckade.
Startbildernas skärmstorlekar står i `scripts/splash-screens.json`.

### Växlar i utvecklingsläge

Bara i `npm run dev`. De följer inte med i produktionsbygget.

| Växel | Gör |
|---|---|
| `?demo` / `?demo=7` | ersätter all data med 24 (eller 7) dygn påhittad data |
| `?demo=0` | tömmer allt och visar introt |
| `?time=03:10` | låtsas att klockan är 03:10 (nattema, nattamning) |
| `?mode=Flaska` | sätter matningsläget (`Amning`, `Flaska`, `Båda`) |
| `?guide=ios` | visar installationsguiden (`ios`, `android`); `?guide=off` hoppar över den på en telefon |

Växlarna kan kombineras, till exempel `?demo&time=03:10`.

## Publicering på GitHub Pages

Appen publiceras på `https://<användare>.github.io/bebislogg/`. Sökvägen är satt i
`vite.config.ts` (`base`). Om den ändras får den installerade appen en ny, tom lagring.
Datan måste då flyttas med export och import.

1. Skapa ett publikt repo som heter `bebislogg` på GitHub och pusha `main`.
2. Gå till repots **Settings → Pages** och välj **Source: GitHub Actions**.
3. Varje push till `main` kör tester, bygger och publicerar via
   `.github/workflows/deploy.yml`.
