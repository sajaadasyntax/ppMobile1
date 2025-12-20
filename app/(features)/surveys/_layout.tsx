import { Stack } from 'expo-router';

export default function SurveysLayout() {
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
          headerTitle: 'الاستبيانات',
        }}
      />
      <Stack.Screen
        name="public-surveys"
        options={{
          headerTitle: 'الاستبيانات العامة',
        }}
      />
      <Stack.Screen
        name="member-surveys"
        options={{
          headerTitle: 'استبيانات الأعضاء',
        }}
      />
    </Stack>
  );
}
