import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store/authStore';
import { ToastProvider } from '@/components/ui/ToastContainer';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { loadUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    const publicRoutes = ['/auth/login', '/auth/register'];
    const isPublicRoute = publicRoutes.includes(router.pathname);

    if (!isAuthenticated && !isPublicRoute) {
      router.push('/auth/login');
    } else if (isAuthenticated && isPublicRoute) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <ToastProvider>
      <Component {...pageProps} />
    </ToastProvider>
  );
}