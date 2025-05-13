// src/config.ts
"use client"; // This file can be used in client components

export const isCompetitionModeEnabled: boolean = process.env.NEXT_PUBLIC_COMPETITION_MODE_ENABLED === 'true';
