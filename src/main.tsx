import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import AppRouter from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { ModeProvider } from './context/ModeContext';
import { SessionProvider } from './context/SessionContext';
import { GuidanceHintProvider } from './context/GuidanceHintContext';
import ErrorBoundary from './components/ErrorBoundary';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = createRoot(rootElement);

  root.render(
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <ThemeProvider>
            <ModeProvider>
              <SessionProvider>
                <GuidanceHintProvider>
                  <AppRouter />
                </GuidanceHintProvider>
              </SessionProvider>
            </ModeProvider>
          </ThemeProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  );
} else {
  console.error('Root element not found');
}