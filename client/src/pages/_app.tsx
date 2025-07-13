import '../index.css';
import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import { VaultContextProvider } from '../contexts/VaultContext';
import AppShell from '../components/layout/AppShell';

const CustomApp = ({ Component, pageProps }: AppProps) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <VaultContextProvider>
        <AppShell>
          <Component {...pageProps} />
        </AppShell>
      </VaultContextProvider>
    </ThemeProvider>
  );
};

export default CustomApp; 