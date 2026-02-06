import { Hero } from '@/components/landing/Hero';
import { ExampleGrid } from '@/components/landing/ExampleGrid';
import { GettingStarted } from '@/components/landing/GettingStarted';
import { Page } from '@/components/ui/Page/Page';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Footer } from '@/components/landing/Footer';

function App() {
  return (
    <ThemeProvider>
      <Page>
        <Hero />
        <ExampleGrid />
        <GettingStarted />
        <Footer />
      </Page>
    </ThemeProvider>
  );
}

export default App;
