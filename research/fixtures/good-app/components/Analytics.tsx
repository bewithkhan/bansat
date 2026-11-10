'use client';
import { useEffect } from 'react';
import { loadWhenConsented } from '@/lib/privacy/consent';

// Google Analytics loads only after the visitor accepts analytics.
export function Analytics() {
  useEffect(() => {
    loadWhenConsented('analytics', `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`);
  }, []);
  return null;
}
