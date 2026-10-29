import type { ViewStyle } from 'react-native';

/** Native stacking values keep the global tab bar above each route's ScrollView. */
export const persistentNavigationSurfaceStyle: ViewStyle = {
  bottom: 0,
  elevation: 24,
  left: 0,
  position: 'absolute',
  right: 0,
  zIndex: 24,
};
