import { Hero } from '@/components/landing/Hero';
import { ExampleGrid } from '@/components/landing/ExampleGrid';
import { GettingStarted } from '@/components/landing/GettingStarted';
import { Troubleshooting } from '@/components/landing/Troubleshooting';
import { Page } from '@/components/ui/Page/Page';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Footer } from '@/components/landing/Footer';
import { ThemeFab } from '@/components/landing/ThemeFab';

function App() {
  return (
    <ThemeProvider>
      <Page disable-navigation-toggle>
        <Hero />
        <ExampleGrid />
        <GettingStarted />
        <Troubleshooting />
        <Footer />
      </Page>
      <ThemeFab />
    </ThemeProvider>
  );
}

export default App;
