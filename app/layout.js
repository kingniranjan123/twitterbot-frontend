import ClientLayout from '@/components/ClientLayout';
import "./globals.css";

export const metadata = {
  title: "Nexus Auto-Bot",
  description: "Advanced Twitter Automation v2",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
