import { StudioProvider } from './contexts/StudioContext';
import { StudioLayout } from './components/StudioLayout';
import { StudioConsoleProvider } from './components/console/StudioConsoleProvider';
import './KigumiStudio.css';

export function KigumiStudio() {
  return (
    <StudioProvider>
      <StudioConsoleProvider>
        <StudioLayout />
      </StudioConsoleProvider>
    </StudioProvider>
  );
}
