import React from 'react';
import { View, Text } from 'react-native';
import { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#10b981',
        backgroundColor: '#f0fdf4',
        borderLeftWidth: 5,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#065f46',
      }}
      text2Style={{
        fontSize: 14,
        color: '#047857',
      }}
      renderLeadingIcon={() => (
        <View className="justify-center items-center ml-3">
          <Ionicons name="checkmark-circle" size={24} color="#10b981" />
        </View>
      )}
    />
  ),
  
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#ef4444',
        backgroundColor: '#fef2f2',
        borderLeftWidth: 5,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#991b1b',
      }}
      text2Style={{
        fontSize: 14,
        color: '#dc2626',
      }}
      renderLeadingIcon={() => (
        <View className="justify-center items-center ml-3">
          <Ionicons name="alert-circle" size={24} color="#ef4444" />
        </View>
      )}
    />
  ),
  
  warning: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#f59e0b',
        backgroundColor: '#fffbeb',
        borderLeftWidth: 5,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#92400e',
      }}
      text2Style={{
        fontSize: 14,
        color: '#d97706',
      }}
      renderLeadingIcon={() => (
        <View className="justify-center items-center ml-3">
          <Ionicons name="warning" size={24} color="#f59e0b" />
        </View>
      )}
    />
  ),
  
  info: (props: any) => (
    <InfoToast
      {...props}
      style={{
        borderLeftColor: '#3b82f6',
        backgroundColor: '#eff6ff',
        borderLeftWidth: 5,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#1e40af',
      }}
      text2Style={{
        fontSize: 14,
        color: '#2563eb',
      }}
      renderLeadingIcon={() => (
        <View className="justify-center items-center ml-3">
          <Ionicons name="information-circle" size={24} color="#3b82f6" />
        </View>
      )}
    />
  ),
};