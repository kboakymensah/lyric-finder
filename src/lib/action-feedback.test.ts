import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Vibration: { vibrate: vi.fn() } }));

import { provideActionFeedback } from './action-feedback';

describe('provideActionFeedback', () => {
  it('requests a short device vibration after a saved-library action', () => {
    const vibrate = vi.fn();

    provideActionFeedback(vibrate);

    expect(vibrate).toHaveBeenCalledWith(25);
  });
});
