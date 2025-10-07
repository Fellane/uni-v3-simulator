# Uniswap v3 LP Simulator (MVP)

- Next.js 14 (App Router), TypeScript
- Источник данных: Uniswap v3 Subgraph (The Graph hosted)
- Эндпоинт меняется через `SUBGRAPH_URL` в `.env.local`

## Быстрый старт
```bash
pnpm install # или npm install
cp .env.example .env.local
pnpm dev
# открыть http://localhost:3000
```

## Деплой
- Vercel: добавьте переменную `SUBGRAPH_URL`
- Встраивание (iframe):
```html
<iframe
  src="https://your-vercel-app.vercel.app"
  style="width:100%;max-width:1280px;height:900px;border:0;overflow:hidden;display:block;margin:0 auto;">
</iframe>
```

## Дальше (в продакшен)
- Точные формулы v3 (Uniswap v3 SDK): реальная доля `L_user / L_in_range`
- Срезы по часу/5 минутам, кэш в SQLite/Postgres, графики fees/TVL/in-range
- Поддержка нескольких сетей/пулов, сравнение диапазонов, экспорт CSV
