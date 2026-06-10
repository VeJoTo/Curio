import type { Profile } from '@curio/shared';

export type NotifPermission = Profile['notifPermission'];

/** Map an expo-notifications OS status string to the profile enum. */
export function toPermission(status: string): NotifPermission {
  if (status === 'granted') {
    return 'granted';
  }
  if (status === 'denied') {
    return 'denied';
  }
  return 'undetermined';
}

/** What the in-app notifications control should request next. */
export type NotifAction = 'request' | 'settings';

export interface NotifControl {
  statusLabel: string;
  actionLabel: string;
  action: NotifAction;
}

/**
 * Describe the notifications control for a given permission. The OS permission
 * dialog is one-shot, so only `undetermined` can be re-requested in-app; once
 * `granted`/`denied`, the only lever is the system Settings deep-link.
 */
export function notifControl(permission: NotifPermission): NotifControl {
  switch (permission) {
    case 'granted':
      return { statusLabel: 'On', actionLabel: 'Manage in settings', action: 'settings' };
    case 'denied':
      return { statusLabel: 'Blocked', actionLabel: 'Open settings', action: 'settings' };
    default:
      return { statusLabel: 'Off', actionLabel: 'Turn on notifications', action: 'request' };
  }
}
