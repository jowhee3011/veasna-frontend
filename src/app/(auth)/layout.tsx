export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="relative z-[1] flex min-h-screen items-center justify-center p-5">
      {children}
    </main>
  );
}
