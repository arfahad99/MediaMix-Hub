import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function IndexPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)/dashboard');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <LinearGradient
      colors={['#6366f1', '#8b5cf6', '#ec4899']}
      className="flex-1 items-center justify-center"
    >
      <View className="items-center">
        <LoadingSpinner size="large" color="white" />
        <Text className="text-white text-lg font-inter-medium mt-4">
          Loading MediaMix Hub...
        </Text>
      </View>
    </LinearGradient>
  );
}