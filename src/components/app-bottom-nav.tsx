import { Link, usePathname, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { mainNavigationItems, type MainNavigationId } from '../lib/main-navigation';
import { persistentNavigationSurfaceStyle } from '../lib/persistent-navigation';
import { bottomNavigationMinimumHeight } from './music-ui';

export { bottomNavigationMinimumHeight } from './music-ui';

const icons: Record<MainNavigationId, string> = {
  search: '⌕',
  library: '▣',
  favorites: '♡',
  playlists: '☷',
};

export function AppBottomNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const activeId: MainNavigationId = pathname === '/'
    ? 'search'
    : pathname === '/favorites'
      ? 'favorites'
      : pathname === '/playlists'
        ? 'playlists'
        : 'library';

  return <View pointerEvents="box-none" style={[styles.surface, persistentNavigationSurfaceStyle]}>
    <View style={[styles.bar, { minHeight: bottomNavigationMinimumHeight + insets.bottom, paddingBottom: Math.max(insets.bottom, 10) }]}>
      {mainNavigationItems.map((item) => {
        const active = item.id === activeId;
        return <Link key={item.id} href={item.href as Href} asChild>
          <Pressable accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: active }} style={styles.item}>
            <Text style={[styles.icon, active && styles.active]}>{icons[item.id]}</Text>
            <Text numberOfLines={1} style={[styles.label, active && styles.active]}>{item.label}</Text>
          </Pressable>
        </Link>;
      })}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  surface: {},
  bar: { backgroundColor: '#11110F', borderTopColor: '#3B372C', borderTopWidth: 1, flexDirection: 'row', paddingHorizontal: 8, paddingTop: 9 },
  item: { alignItems: 'center', flex: 1, gap: 2, minHeight: 44 },
  icon: { color: '#A39D8E', fontSize: 23, fontWeight: '900', lineHeight: 25 },
  label: { color: '#A39D8E', fontSize: 10, fontWeight: '800' },
  active: { color: '#F7C948' },
});
