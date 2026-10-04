import { PlaceholderPage } from '@/components/PlaceholderPage';

export function SettingsPage() {
  return (
    <PlaceholderPage
      module="Settings"
      title="Settings"
      description="Operator preferences for scan thresholds, notification routing and data retention. The interface is staged; nothing is persisted in Phase 01."
      phase="a later phase, once authentication and storage exist"
      planned={[
        'Match and ATS threshold configuration',
        'Notification routing per module',
        'Data export and deletion controls',
        'Account-level preferences tied to a real identity',
      ]}
    />
  );
}