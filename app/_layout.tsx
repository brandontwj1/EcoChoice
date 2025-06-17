import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="ProductSearch" options={{ headerShown: false }} />
        <Stack.Screen name="ProductDetails" options={{
          title: "",
          headerBackTitle: "Back",
          headerStyle: { backgroundColor: "#f8faf7" }, // Set your desired color here
          headerTintColor: "#388e3c", 
        }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
