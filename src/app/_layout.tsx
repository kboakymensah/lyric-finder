import { Stack } from 'expo-router';

import { LibraryProvider } from '../contexts/library-context';
import { PreviewPlayerProvider } from '../contexts/preview-player-context';

export default function RootLayout() {
  return (
    <LibraryProvider>
      <PreviewPlayerProvider><Stack screenOptions={{ headerShown: false }} /></PreviewPlayerProvider>
    </LibraryProvider>
  );
}
