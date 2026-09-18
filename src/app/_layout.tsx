import { Stack } from 'expo-router';

import { LibraryProvider } from '../contexts/library-context';

export default function RootLayout() {
  return (
    <LibraryProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </LibraryProvider>
  );
}
