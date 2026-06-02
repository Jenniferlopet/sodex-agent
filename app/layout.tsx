import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SoDEX Agent Console',
  description: 'Agentic trading dashboard with SoSoValue/SoDEX data and silent exchange fallback.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
