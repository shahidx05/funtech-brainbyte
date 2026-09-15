import { useState, useEffect, useCallback } from 'react';

export function useAntiCheat({
  active = false,
  maxTabSwitches = 3,
  onViolationThresholdReached,
}) {
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [screenshotDetectedAlert, setScreenshotDetectedAlert] = useState(false);
  const [securityShieldActive, setSecurityShieldActive] = useState(false);

  // Fullscreen Enforcer
  const enterFullscreen = useCallback(() => {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().catch(() => {});
    } else if (docEl.webkitRequestFullscreen) {
      docEl.webkitRequestFullscreen();
    } else if (docEl.msRequestFullscreen) {
      docEl.msRequestFullscreen();
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Monitor Fullscreen status
  useEffect(() => {
    if (!active) return;

    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, [active]);

  // Tab Switch & Visibility Change Detection
  useEffect(() => {
    if (!active || isBlocked) return;

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        registerViolation('tab_switch');
      }
    };

    const handleWindowBlur = () => {
      // Window lost focus (alt+tab, application switch, developer tools popup)
      registerViolation('window_blur');
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [active, isBlocked, tabSwitchCount]);

  const registerViolation = (type) => {
    if (isBlocked) return;

    setTabSwitchCount((prevCount) => {
      const nextCount = prevCount + 1;
      
      if (nextCount >= maxTabSwitches) {
        setIsBlocked(true);
        setShowWarningModal(false);
        if (onViolationThresholdReached) {
          onViolationThresholdReached(nextCount);
        }
      } else {
        setShowWarningModal(true);
      }
      return nextCount;
    });
  };

  // Prevent Copy, Cut, Paste, Right Click & Dangerous Key Combos
  useEffect(() => {
    if (!active) return;

    // Prevent context menu (Right Click)
    const handleContextMenu = (e) => {
      e.preventDefault();
      triggerScreenshotShield();
      return false;
    };

    // Prevent Copy/Cut/Paste
    const handleCopyPaste = (e) => {
      e.preventDefault();
      return false;
    };

    // Prevent Text Selection Drag
    const handleDragStart = (e) => {
      e.preventDefault();
      return false;
    };

    // Keyboard Shortcuts Interceptor
    const handleKeyDown = (e) => {
      // PrintScreen / SysRq key detection
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        triggerScreenshotShield();
        setScreenshotDetectedAlert(true);
        setTimeout(() => setScreenshotDetectedAlert(false), 4000);
        return false;
      }

      // Block F12 (DevTools)
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+U (View Source)
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, Ctrl+P (Print)
      if (e.ctrlKey && ['c', 'v', 'x', 'a', 'p'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        if (e.key.toLowerCase() === 'p') {
          triggerScreenshotShield();
        }
        return false;
      }
    };

    // Screenshot Protection Trigger
    const triggerScreenshotShield = () => {
      setSecurityShieldActive(true);
      setTimeout(() => {
        setSecurityShieldActive(false);
      }, 1500);
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('dragstart', handleDragStart);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [active]);

  const dismissWarningModal = () => {
    setShowWarningModal(false);
    enterFullscreen();
  };

  const resetViolations = useCallback(() => {
    setTabSwitchCount(0);
    setIsBlocked(false);
    setShowWarningModal(false);
  }, []);

  return {
    tabSwitchCount,
    maxTabSwitches,
    showWarningModal,
    dismissWarningModal,
    resetViolations,
    isBlocked,
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    screenshotDetectedAlert,
    securityShieldActive,
  };
}
