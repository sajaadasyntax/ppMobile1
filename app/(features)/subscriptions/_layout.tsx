import { Stack } from 'expo-router';

export default function SubscriptionsLayout() {
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
          headerTitle: 'الاشتراكات',
        }}
      />
      <Stack.Screen
        name="previous-subscriptions"
        options={{
          headerTitle: 'الاشتراكات السابقة',
        }}
      />
    </Stack>
  );
}
