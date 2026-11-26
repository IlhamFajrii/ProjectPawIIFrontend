import '@fontsource-variable/inter';
import '@fontsource-variable/mona-sans/wdth.css';
import './styles/index.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { createRouter } from './app/router';
import { SessionProvider } from './app/SessionProvider';
import { ToastProvider } from './components/ui/ToastProvider';
import { createQueryClient } from './lib/queryClient';
import { watchTheme } from './lib/theme';

watchTheme();

const queryClient = createQueryClient();
const router = createRouter();
const root = document.getElementById('root');
if (!root) throw new Error('Elemen #root tidak ditemukan');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <SessionProvider>
          <RouterProvider router={router} />
        </SessionProvider>
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
);
