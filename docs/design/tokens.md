# Design Tokens — Marca Inova TI (CRM)

**Versão:** 1.0 (Fase 0)  
**Uso:** frontend Next.js, Tailwind, shadcn/ui customizado

> **Importante:** usar identidade Inova TI (flame/dark/warm neutrals). **Não** usar defaults genéricos de AI (purple `#7C3AED`, cream `#FAF5FF`, gradientes violeta).

---

## Cores — CSS custom properties

```css
:root {
  /* Superfícies */
  --base: #1b1b1d;
  --panel: #232326;
  --void: #141416;
  --line: #2f2f33;

  /* Marca — flame */
  --flame: #fb640a;
  --ember: #ff8a3d;
  --rust: #b8480c;
  --glow: #f86905;

  /* Neutros quentes */
  --bone: #f4f1ec;
  --smoke: #a5a29d;
  --faint: #6f6c68;

  /* Semânticas */
  --ok: #3ad07f;
  --warn: #ffb454;
  --bad: #ff5a52;

  /* Tipografia */
  --font-display: 'Sora', system-ui, sans-serif;
  --font-body: 'IBM Plex Sans', system-ui, sans-serif;

  /* Raios */
  --radius-sm: 8px;
  --radius-md: 13px;
  --radius-lg: 16px;

  /* Sombras */
  --shadow-card: 0 12px 40px -12px rgba(0, 0, 0, 0.85);
  --shadow-elevated: 0 40px 90px -40px rgba(0, 0, 0, 1);
}
```

---

## Tailwind extend (referência)

```javascript
// tailwind.config — excerpt
colors: {
  base: '#1b1b1d',
  panel: '#232326',
  void: '#141416',
  line: '#2f2f33',
  flame: { DEFAULT: '#fb640a', ember: '#ff8a3d', rust: '#b8480c' },
  bone: '#f4f1ec',
  smoke: '#a5a29d',
  faint: '#6f6c68',
  ok: '#3ad07f',
  warn: '#ffb454',
  bad: '#ff5a52',
},
fontFamily: {
  display: ['Sora', 'system-ui', 'sans-serif'],
  body: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
},
```

---

## Componentes shadcn — overrides

| Componente     | Background             | Texto     | Accent                           |
| -------------- | ---------------------- | --------- | -------------------------------- |
| Button primary | `--flame`              | `#160b04` | hover `--ember`                  |
| Button ghost   | transparent            | `--bone`  | border `--line`, hover `--flame` |
| Card           | `--panel`              | `--bone`  | border `--line`                  |
| Input          | `--void`               | `--bone`  | focus border `--flame`           |
| Badge alta     | `rgba(255,90,82,.15)`  | `--bad`   | —                                |
| Badge média    | `rgba(255,180,84,.15)` | `--warn`  | —                                |
| Badge baixa    | `rgba(58,208,127,.12)` | `--ok`    | —                                |

---

## Logo / wordmark

```
Inova<b>CRM</b> AI
```

- `Inova` e `AI`: `--bone`
- `CRM`: `--flame` (bold)
- Fundo preferencial: `--void` ou `--base`

---

## Kanban (funil)

| Elemento     | Token                    |
| ------------ | ------------------------ |
| Coluna fundo | `--panel`                |
| Card         | `--void` border `--line` |
| Drag hover   | border `--flame`         |
| Valor deal   | `--flame` (font-display) |

---

## Acessibilidade

- Contraste mínimo WCAG AA para `--bone` sobre `--void` / `--panel`
- Focus ring: `2px solid var(--flame)` offset 2px
- Não depender só de cor para status — usar ícone + texto

---

## Referências

- Origem: Inova-TI `painel-next/app/globals.css`
- [prompts-claude-design.md](./prompts-claude-design.md)
- [arquitetura-frontend.md](../arquitetura-frontend.md)
