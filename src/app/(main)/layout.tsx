// src/app/(main)/layout.tsx

import TopNav from "@/components/shared/TopNav";
import Footer from "@/components/shared/Footer";
import MascotChat from "@/components/mascot/MascotChat";
import AuthWrapper from "../wrappers/AuthWrapper";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthWrapper>
      <div className="relative flex min-h-screen flex-col">
        <TopNav />
        <main className="relative z-[1] mx-auto w-full max-w-[1600px] flex-1 px-5 py-6">
          {children}
        </main>
        <Footer />
        {/* Floating assistant — available on every station page */}
        <MascotChat />
      </div>
    </AuthWrapper>
  );
}
