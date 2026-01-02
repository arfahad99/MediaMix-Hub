import React from 'react';
import { ActivityIndicator, View } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  style?: any;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'small',
  color = '#6366f1',
  style,
}) => {
  return (
    <View style={style}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

export default LoadingSpinner;