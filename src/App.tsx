import { BrowserRouter } from 'react-router-dom';
import { ScrollToTop } from './components/shared/ScrollToTop';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { AppRoutes } from './routes';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}