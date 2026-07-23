# Horno del Pingüino

[![CI](https://github.com/horno-del-pinguino-92f9/horno-landing/actions/workflows/ci.yml/badge.svg)](https://github.com/horno-del-pinguino-92f9/horno-landing/actions/workflows/ci.yml)

Landing page estática para Horno del Pingüino — postres artesanales.

## Variables de Entorno

```bash
PUBLIC_API_BASE_URL=https://product-admin-backend-vfyy.onrender.com
PUBLIC_WHATSAPP_NUMBER=593XXXXXXXXX
PUBLIC_INSTAGRAM_HANDLE=hornodlpinguino
```

`PUBLIC_API_BASE_URL` MUST be the backend's HOST ROOT (no `/api` suffix) —
the client appends `/api/public/products` itself. A trailing slash on the
value is normalized automatically.

## Desarrollo

```bash
npm install
npm run dev        # dev server
npm run build      # build static site
npm test           # unit tests
npm run test:e2e   # e2e tests (requires `npm run preview` running)
```

## Actualizar Fallback Data

Si el backend cambia, regenerá `src/data/fallback.json`:

```bash
curl -s "https://product-admin-backend-vfyy.onrender.com/api/public/products?page=1&limit=100" | \
  jq '{items: .items}' > src/data/fallback.json
```

## Estructura

`src/layouts/` · `src/components/` · `src/pages/` · `src/lib/api.ts` · `src/data/` · `public/` · `tests/unit/` · `tests/e2e/`
