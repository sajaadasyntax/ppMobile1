import { Stack } from 'expo-router';

export default function BulletinLayout() {
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
          headerTitle: 'النشرة',
        }}
      />
      <Stack.Screen
        name="bulletin-details"
        options={{
          headerTitle: 'تفاصيل النشرة',
        }}
      />
    </Stack>
  );
}
