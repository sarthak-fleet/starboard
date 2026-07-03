'use client';

import { useEffect } from 'react';
import { initVitals } from '@/lib/vitals';
import { initApiTiming } from '@/lib/api-timing';

export function VitalsReporter() {
  useEffect(() => {
    initVitals();
    initApiTiming();
  }, []);
  return null;
}
