import { Stack } from 'expo-router';
import { View } from 'react-native';

import { PreviewPlayerSurface } from '../components/preview-player-surface';
import { LibraryProvider } from '../contexts/library-context';
import { PreviewPlayerProvider } from '../contexts/preview-player-context';

export default function RootLayout() {
  return (
    <LibraryProvider>
      <PreviewPlayerProvider>
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }} />
          <PreviewPlayerSurface />
        </View>
      </PreviewPlayerProvider>
    </LibraryProvider>
  );
}
