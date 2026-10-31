import { useCallback, useRef } from 'react';
import { DeviceEventEmitter, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { bottomNavigationEvent, bottomNavigationVisibilityForScroll } from '../lib/bottom-navigation-scroll';

export function useBottomNavigationScroll() {
  const previousOffset = useRef(0);

  return useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffset = Math.max(0, event.nativeEvent.contentOffset.y);
    const visibility = bottomNavigationVisibilityForScroll(currentOffset, previousOffset.current);
    previousOffset.current = currentOffset;
    if (visibility) DeviceEventEmitter.emit(bottomNavigationEvent, visibility);
  }, []);
}
