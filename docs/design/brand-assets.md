# Brand assets — Inova CRM AI

**Marca:** chama (flame) Inova TI · fundo void `#141416` · accent `#fb640a` / ember `#ff8a3d`

## Favicon e ícones (desktop + mobile)

| Arquivo                                                   | Uso                                                    |
| --------------------------------------------------------- | ------------------------------------------------------ |
| `frontend/public/favicon.svg`                             | Aba moderna (SVG)                                      |
| `frontend/public/favicon-16x16.png` / `favicon-32x32.png` | Fallback PNG                                           |
| `frontend/public/apple-touch-icon.png`                    | iOS “Adicionar à Tela de Início” (180×180)             |
| `frontend/public/icons/icon-192.png` / `icon-512.png`     | PWA / Android                                          |
| `frontend/public/site.webmanifest`                        | Manifest PWA (`theme_color` / `background_color` void) |
| `frontend/app/icon.png` / `app/apple-icon.png`            | Metadata automática Next.js App Router                 |

Metadata em `frontend/app/layout.tsx` (`icons`, `manifest`, `appleWebApp`, Open Graph title).

## Logo na UI

`BrandLogo` (`frontend/components/BrandLogo.tsx`) exibe o mark 28×28 + texto **InovaCRM AI**.

## Regenerar PNGs a partir da fonte

```powershell
cd frontend
# fonte: public/icons/icon-source.png (1024×1024)
node -e "const sharp=require('sharp'); /* resize jobs — ver histórico commit brand */"
```

Não usar purple/cream AI defaults — ver [`tokens.md`](./tokens.md).
