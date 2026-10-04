import type { IntelItem } from '@/types';

/**
 * DEVELOPMENT DATA — activity shown on the COMMAND CENTER.
 * Phase 2 will replace this with a persisted activity feed in Supabase.
 */
export const mockIntel: IntelItem[] = [
  {
    id: 'int-001',
    kind: 'TARGET_ACQUIRED',
    headline: 'TARGET ACQUIRED — ARCLIGHT INFERENCE',
    detail: 'AI Engineer · Bengaluru · 100% match. Highest alignment currently tracked.',
    timestamp: '2026-10-04T06:15:00Z',
    severity: 'CRITICAL',
  },
  {
    id: 'int-002',
    kind: 'SCAN_COMPLETE',
    headline: 'PROTOCOL SCAN COMPLETE — SIGNALFERN',
    detail: 'Internal compatibility estimate 78%. Two skills missing from the skill matrix.',
    timestamp: '2026-10-04T05:40:00Z',
    severity: 'MEDIUM',
  },
  {
    id: 'int-003',
    kind: 'OPERATION_MOVED',
    headline: 'OPERATION MOVED TO INTERVIEW',
    detail: 'Helix Vector Labs · Machine Learning Engineer. First round scheduled.',
    timestamp: '2026-10-03T18:20:00Z',
    severity: 'HIGH',
  },
  {
    id: 'int-004',
    kind: 'MATCH_UPDATED',
    headline: 'MATCH RECALCULATED — QUANTERRA',
    detail: 'Score moved to 90% after profile skills were refreshed.',
    timestamp: '2026-10-03T17:45:00Z',
    severity: 'HIGH',
  },
  {
    id: 'int-005',
    kind: 'TARGET_ACQUIRED',
    headline: 'TARGET ACQUIRED — HELIX VECTOR LABS',
    detail: 'Machine Learning Engineer · Bengaluru · 95% match.',
    timestamp: '2026-10-03T09:20:00Z',
    severity: 'CRITICAL',
  },
  {
    id: 'int-006',
    kind: 'MATCH_UPDATED',
    headline: 'OPERATION CLOSED — IRONVALE ROBOTICS',
    detail: 'Rejected after the vision-specific technical screen.',
    timestamp: '2026-09-28T13:10:00Z',
    severity: 'LOW',
  },
  {
    id: 'int-007',
    kind: 'TARGET_ACQUIRED',
    headline: 'TARGET ACQUIRED — NORTHARC SYSTEMS',
    detail: 'Data Scientist · Remote · 81% match. Spark is the only hard gap.',
    timestamp: '2026-10-02T14:05:00Z',
    severity: 'HIGH',
  },
  {
    id: 'int-008',
    kind: 'SCAN_COMPLETE',
    headline: 'IDENTITY READY — TESSELLATE AI',
    detail: 'Tailored document prepared from the NLP-leaning base resume.',
    timestamp: '2026-09-30T08:00:00Z',
    severity: 'MEDIUM',
  },
];

/** Development-only marker text reused across simulated surfaces. */
export const DEVELOPMENT_MARKER = 'DEVELOPMENT DATA';