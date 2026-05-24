import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Lora } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { syncCurrentUser } from '@/actions/sync-user';

const sansFont = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const serifFont = Lora({
  variable: '--font-serif',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MindOrbit - Online Mental Health & Psychiatrist Platform',
  description: 'Discover verified psychiatrists, schedule secure online therapy sessions, and manage your mental health appointments.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Sync the authenticated user with Supabase as a fallback in background
  try {
    await syncCurrentUser();
  } catch (err) {
    console.error('Failed to sync current user during server render:', err);
  }

  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${sansFont.variable} ${serifFont.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  const theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (_) {}
              `,
            }}
          />
        </head>
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <Navbar />
          <main className="flex-grow flex flex-col">{children}</main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
