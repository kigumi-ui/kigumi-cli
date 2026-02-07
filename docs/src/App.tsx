import { Hero } from '@/components/landing/Hero';
import { ExampleGrid } from '@/components/landing/ExampleGrid';
import { GettingStarted } from '@/components/landing/GettingStarted';
import { Troubleshooting } from '@/components/landing/Troubleshooting';
import { Page } from '@/components/ui/Page/Page';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Footer } from '@/components/landing/Footer';
import { useState } from 'react';
import { useEffect } from 'react';

function App() {
  const [hideNavigation, setHideNavigation] = useState(true);

  useEffect(() => {
    setHideNavigation(true);
  }, []);

  return (
    <ThemeProvider>
      <Page disable-navigation-toggle={hideNavigation}>
        <Hero />
        <ExampleGrid />
        <GettingStarted />
        <Troubleshooting />
        <Footer />
      </Page>
    </ThemeProvider>
  );
}

export default App;
