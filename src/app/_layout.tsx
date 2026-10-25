import { Stack } from 'expo-router';
import { View } from 'react-native';

import { AppBottomNav } from '../components/app-bottom-nav';
import { PreviewPlayerSurface } from '../components/preview-player-surface';
import { LibraryProvider } from '../contexts/library-context';
import { PreviewPlayerProvider } from '../contexts/preview-player-context';
import { SongDetailsProvider } from '../contexts/song-details-context';

export default function RootLayout() {
  return (
    <LibraryProvider>
      <SongDetailsProvider>
        <PreviewPlayerProvider>
          <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }} />
            <PreviewPlayerSurface />
            <AppBottomNav />
          </View>
        </PreviewPlayerProvider>
      </SongDetailsProvider>
    </LibraryProvider>
  );
}
