import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../src/utils/colors';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" backgroundColor={Colors.appBg} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.appBg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="day/[dayNum]"
          options={{ presentation: 'card', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="import"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack>
    </>
  );
}
