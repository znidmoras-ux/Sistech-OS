import "./globals.css";

export const metadata = {
  title: "Sistech OS",
  description: "SaaS para MSP, help desk e RMM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
