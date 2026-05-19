# Horno del Pingüino

[![CI](https://github.com/horno-del-pinguino-92f9/horno-landing/actions/workflows/ci.yml/badge.svg)](https://github.com/horno-del-pinguino-92f9/horno-landing/actions/workflows/ci.yml)

Landing page estática para Horno del Pingüino — postres artesanales.

## Variables de Entorno

```bash
PUBLIC_API_BASE_URL=https://product-admin-backend-vfyy.onrender.com/api
PUBLIC_ORG_EXTERNAL_ID=horno-del-pinguino-92f9
PUBLIC_WHATSAPP_NUMBER=593XXXXXXXXX
PUBLIC_INSTAGRAM_HANDLE=hornodlpinguino
```

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
curl -s "https://product-admin-backend-vfyy.onrender.com/api/public/organizations" | \
  jq '.organizations[] | select(.external_id == "horno-del-pinguino-92f9")' > /tmp/org.json
curl -s "https://product-admin-backend-vfyy.onrender.com/api/public/organizations/horno-del-pinguino-92f9/products" | \
  jq '.products' > /tmp/products.json
jq -n --argfile org /tmp/org.json --argfile products /tmp/products.json \
  '{org: $org, products: $products}' > src/data/fallback.json
```

## Estructura

`src/layouts/` · `src/components/` · `src/pages/` · `src/lib/api.ts` · `src/data/` · `public/` · `tests/unit/` · `tests/e2e/`
