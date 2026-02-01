import { Hero } from '@/components/landing/Hero';
import { ExampleGrid } from '@/components/landing/ExampleGrid';
import { Page } from '@/components/ui/Page/Page';
// import { GetStarted } from '@/components/landing/GetStarted';
// import { Footer } from '@/components/landing/Footer';

function App() {
  return (
    <Page>
      {/* <Header /> */}
      <Hero />
      <ExampleGrid />
      {/* <GetStarted /> */}
      {/* <Footer /> */}
    </Page>
  );
}

export default App;
