import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#2E7D32',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontFamily: 'Tajawal-Bold',
        },
        headerTitleAlign: 'center',
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: 'المحادثات',
        }}
      />
      <Stack.Screen
        name="chat-conversation"
        options={{
          headerTitle: 'المحادثة',
        }}
      />
    </Stack>
  );
}
