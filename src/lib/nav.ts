import { Activity, Database, LayoutDashboard, Radar, ScanLine, Settings, Sparkles, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Set on routes that are placeholders in Phase 1. */
  placeholder?: boolean;
}

/** Application shell navigation. Terminology per DESIGN_SYSTEM.md §5. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
  { to: '/intel-feed', label: 'Intel Feed', icon: Radar },
  { to: '/target-database', label: 'Target Database', icon: Database },
  { to: '/identity-forge', label: 'Identity Forge', icon: Sparkles },
  { to: '/protocol-scan', label: 'Protocol Scan', icon: ScanLine },
  { to: '/operations', label: 'Operation Status', icon: Activity },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings, placeholder: true },
];

export function navLabelFor(pathname: string): string {
  const exact = NAV_ITEMS.find((item) => item.to === pathname);
  if (exact) return exact.label;
  const parent = NAV_ITEMS.find((item) => pathname.startsWith(`${item.to}/`));
  return parent ? parent.label : 'Command Center';
}