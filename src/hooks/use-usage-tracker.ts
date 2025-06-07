"use client";
import { useRef, useCallback } from 'react';
import { format } from 'date-fns';

interface UsageEntry {
  daily: Record<string, number>;
  weekly: Record<string, number>;
}

interface UsageData {
  [childId: string]: UsageEntry;
}

const STORAGE_KEY = 'shannon-usage-data';

function loadData(): UsageData {
  if (typeof window === 'undefined') return {};
  try {
    const item = window.localStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : {};
  } catch {
    return {};
  }
}

function saveData(data: UsageData) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore write errors
  }
}

export function useUsageTracker() {
  const sessionStartRef = useRef<number | null>(null);

  const startSession = useCallback((childId: string) => {
    sessionStartRef.current = Date.now();
  }, []);

  const endSession = useCallback((childId: string) => {
    if (sessionStartRef.current === null) return;
    const durationMs = Date.now() - sessionStartRef.current;
    const minutes = Math.round(durationMs / 60000);
    sessionStartRef.current = null;

    const data = loadData();
    if (!data[childId]) {
      data[childId] = { daily: {}, weekly: {} };
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const week = format(new Date(), 'RRRR-ww');

    data[childId].daily[today] = (data[childId].daily[today] || 0) + minutes;
    data[childId].weekly[week] = (data[childId].weekly[week] || 0) + minutes;

    saveData(data);
  }, []);

  const getUsage = useCallback((childId: string) => {
    const data = loadData();
    const today = format(new Date(), 'yyyy-MM-dd');
    const week = format(new Date(), 'RRRR-ww');
    const daily = data[childId]?.daily[today] || 0;
    const weekly = data[childId]?.weekly[week] || 0;
    return { daily, weekly };
  }, []);

  const isWithinLimit = useCallback(
    (childId: string, dailyLimit?: number | null, weeklyLimit?: number | null) => {
      const usage = getUsage(childId);
      if (dailyLimit && usage.daily >= dailyLimit) return false;
      if (weeklyLimit && usage.weekly >= weeklyLimit) return false;
      return true;
    },
    [getUsage]
  );

  return { startSession, endSession, getUsage, isWithinLimit };
}
