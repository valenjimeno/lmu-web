export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-screen px-4 py-4 sm:px-6 sm:py-6">{children}</div>;
}
