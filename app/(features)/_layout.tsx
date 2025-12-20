import { Stack } from 'expo-router';

export default function FeaturesLayout() {
  return (
    <Stack
      screenOptions={{
        // Headers are handled by individual feature layouts (bulletin/_layout, voting/_layout, etc.)
        // Setting headerShown: false here to avoid duplicate headers
        headerShown: false,
      }}
    />
  );
}
