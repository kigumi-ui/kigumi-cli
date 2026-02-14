import { StudioProvider } from './contexts/StudioContext';
import { StudioLayout } from './components/StudioLayout';
import './KigumiStudio.css';

export function KigumiStudio() {
  return (
    <StudioProvider>
      <StudioLayout />
    </StudioProvider>
  );
}
