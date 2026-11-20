import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Design-to-Code Generator',
  description: 'Upload a UI screenshot or use a Figma design to generate frontend code with AI.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
