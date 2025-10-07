export const metadata = {
  title: "Uniswap v3 LP Simulator (MVP)",
  description: "Backtest fees APR, IL, token split for a chosen pool & range."
};

import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
