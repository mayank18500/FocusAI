// ============================================================
// FocusGuard AI — Timer Hook
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
  initialSeconds: number;
  autoStart?: boolean;
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
}

interface UseTimerReturn {
  seconds: number;
  minutes: number;
  hours: number;
  totalSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  progress: number; // 0–100
  formattedTime: string;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: (newSeconds?: number) => void;
  stop: () => void;
}

export function useTimer({
  initialSeconds,
  autoStart = false,
  onComplete,
  onTick,
}: UseTimerOptions): UseTimerReturn {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  const initialRef = useRef(initialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);

  // Keep refs updated
  onCompleteRef.current = onComplete;
  onTickRef.current = onTick;

  useEffect(() => {
    if (!isRunning || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTotalSeconds((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setIsRunning(false);
          onCompleteRef.current?.();
          return 0;
        }
        onTickRef.current?.(next);
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const progress =
    initialRef.current > 0
      ? ((initialRef.current - totalSeconds) / initialRef.current) * 100
      : 0;

  const formattedTime =
    hours > 0
      ? `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const reset = useCallback((newSeconds?: number) => {
    const s = newSeconds ?? initialRef.current;
    setTotalSeconds(s);
    initialRef.current = s;
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setTotalSeconds(0);
  }, []);

  return {
    seconds,
    minutes,
    hours,
    totalSeconds,
    isRunning,
    isPaused,
    progress,
    formattedTime,
    start,
    pause,
    resume,
    reset,
    stop,
  };
}
