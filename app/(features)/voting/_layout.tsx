import { Stack } from 'expo-router';

export default function VotingLayout() {
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
          headerTitle: 'التصويت',
        }}
      />
      <Stack.Screen
        name="electoral-voting"
        options={{
          headerTitle: 'التصويت الانتخابي',
        }}
      />
      <Stack.Screen
        name="opinion-voting"
        options={{
          headerTitle: 'تصويت الرأي',
        }}
      />
    </Stack>
  );
}
