import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  isPassword?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword = false,
  style,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-gray-700 font-inter-semibold text-sm mb-2">
          {label}
        </Text>
      )}
      
      <View
        className={`
          flex-row items-center bg-white border-2 rounded-xl px-4 py-3
          ${error ? 'border-red-500' : isFocused ? 'border-primary-500' : 'border-gray-200'}
        `}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={error ? '#ef4444' : isFocused ? '#6366f1' : '#9ca3af'}
            style={{ marginRight: 12 }}
          />
        )}
        
        <TextInput
          className="flex-1 font-inter text-base text-gray-900"
          secureTextEntry={isPassword && !isPasswordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="#9ca3af"
          style={style}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity onPress={togglePasswordVisibility}>
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color="#9ca3af"
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !isPassword && (
          <TouchableOpacity onPress={onRightIconPress}>
            <Ionicons
              name={rightIcon}
              size={20}
              color={error ? '#ef4444' : '#9ca3af'}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text className="text-red-500 text-sm mt-1 font-inter">
          {error}
        </Text>
      )}
      
      {helperText && !error && (
        <Text className="text-gray-500 text-sm mt-1 font-inter">
          {helperText}
        </Text>
      )}
    </View>
  );
};

export default Input;