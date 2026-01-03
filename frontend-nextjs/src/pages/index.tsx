import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store/authStore';
import { useMediaStore } from '@/store/mediaStore';
import Layout from '@/components/layout/Layout';
import WelcomeSection from '@/components/sections/WelcomeSection';
import StatsSection from '@/components/sections/StatsSection';
import UploadSection from '@/components/sections/UploadSection';
import GallerySection from '@/components/sections/GallerySection';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuthStore();
  const { loadMedia, loadStats, items, isLoading: mediaLoading } = useMediaStore();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (isAuthenticated) {
      // Load initial data
      loadMedia().catch(error => {
        console.error('Failed to load media:', error);
      });
      loadStats().catch(error => {
        console.error('Failed to load stats:', error);
      });
    }
  }, [isAuthenticated, authLoading, router, loadMedia, loadStats, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  const hasFiles = items.length > 0;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section - only show if no files */}
        {!hasFiles && <WelcomeSection />}
        
        {/* Stats Dashboard */}
        <StatsSection />
        
        {/* Upload Section */}
        <UploadSection />
        
        {/* Gallery Section */}
        <GallerySection />
      </div>
    </Layout>
  );
}