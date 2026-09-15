import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useAntiCheat } from '../../hooks/useAntiCheat';

describe('useAntiCheat Hook Unit Tests', () => {
  it('should initialize with default states', () => {
    const { result } = renderHook(() =>
      useAntiCheat({ active: false, maxTabSwitches: 3 })
    );

    expect(result.current.tabSwitchCount).toBe(0);
    expect(result.current.showWarningModal).toBe(false);
    expect(result.current.isBlocked).toBe(false);
  });

  it('should ignore window blur and visibilitychange when active is false', () => {
    const onThreshold = vi.fn();
    const { result } = renderHook(() =>
      useAntiCheat({ active: false, onViolationThresholdReached: onThreshold })
    );

    act(() => {
      window.dispatchEvent(new Event('blur'));
    });

    expect(result.current.tabSwitchCount).toBe(0);
    expect(result.current.showWarningModal).toBe(false);
    expect(onThreshold).not.toHaveBeenCalled();
  });

  it('should register violations and show warning modal when active is true', () => {
    const onThreshold = vi.fn();
    const { result } = renderHook(() =>
      useAntiCheat({ active: true, maxTabSwitches: 3, onViolationThresholdReached: onThreshold })
    );

    // 1st blur
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(result.current.tabSwitchCount).toBe(1);
    expect(result.current.showWarningModal).toBe(true);
    expect(result.current.isBlocked).toBe(false);

    // Dismiss modal
    act(() => {
      result.current.dismissWarningModal();
    });
    expect(result.current.showWarningModal).toBe(false);

    // 2nd blur
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(result.current.tabSwitchCount).toBe(2);
    expect(result.current.showWarningModal).toBe(true);

    // 3rd blur (threshold reached)
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(result.current.tabSwitchCount).toBe(3);
    expect(result.current.isBlocked).toBe(true);
    expect(result.current.showWarningModal).toBe(false);
    expect(onThreshold).toHaveBeenCalledWith(3);
  });
});
