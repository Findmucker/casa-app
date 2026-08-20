import type { Metadata, Viewport } from "next";
import "./globals.css";
import FloatingCuties from "@/components/FloatingCuties";


export const metadata: Metadata = {
  title: "A Nossa Casinha",
  applicationName: "A Nossa Casinha",
  description: "Organiza a casa, despesas, compras, tarefas, hábitos e eventos em conjunto.",
  manifest: "/manifest.json",
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Casinha",
  },
};

export const viewport: Viewport = {
  themeColor: "#fce7f3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className="h-full">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="h-full font-sans bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(regs) {
              regs.forEach(function(reg) {
                reg.update();
                if (reg.waiting) { reg.waiting.postMessage({type:'SKIP_WAITING'}); }
              });
            });
            navigator.serviceWorker.addEventListener('controllerchange', function() {
              if (!window.__swReloaded) { window.__swReloaded = true; window.location.reload(); }
            });
            // Clear all caches on load (force fresh)
            if ('caches' in window) {
              caches.keys().then(function(keys) {
                keys.forEach(function(k) { caches.delete(k); });
              });
            }
          }
        `}} />
        <FloatingCuties />
        {children}
      </body>
    </html>
  );
}
