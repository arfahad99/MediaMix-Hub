import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const sizeClasses = {
    sm: 'px-4 py-2',
    md: 'px-6 py-3',
    lg: 'px-8 py-4',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const isDisabled = disabled || isLoading;

  const renderContent = () => (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`
        ${sizeClasses[size]} 
        rounded-xl 
        flex-row 
        items-center 
        justify-center 
        ${variant === 'secondary' ? 'bg-gray-200' : ''}
        ${variant === 'danger' ? 'bg-red-500' : ''}
        ${variant === 'ghost' ? 'bg-transparent' : ''}
        ${isDisabled ? 'opacity-50' : ''}
      `}
      style={style}
    >
      {isLoading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? 'white' : '#6366f1'} 
          size="small" 
        />
      ) : (
        <>
          {icon}
          <Text
            className={`
              ${textSizeClasses[size]} 
              font-inter-semibold 
              ${variant === 'primary' ? 'text-white' : ''}
              ${variant === 'secondary' ? 'text-gray-700' : ''}
              ${variant === 'danger' ? 'text-white' : ''}
              ${variant === 'ghost' ? 'text-gray-600' : ''}
              ${icon ? 'ml-2' : ''}
            `}
            style={textStyle}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );

  if (variant === 'primary') {
    return (
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        className={`rounded-xl ${isDisabled ? 'opacity-50' : ''}`}
        style={style}
      >
        {renderContent()}
      </LinearGradient>
    );
  }

  return renderContent();
};

export default Button;