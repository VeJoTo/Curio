import { describe, expect, it } from 'vitest';
import { notifControl, toPermission } from './permission';

describe('toPermission', () => {
  it('maps OS statuses to the profile enum, defaulting unknown to undetermined', () => {
    expect(toPermission('granted')).toBe('granted');
    expect(toPermission('denied')).toBe('denied');
    expect(toPermission('undetermined')).toBe('undetermined');
    expect(toPermission('provisional')).toBe('undetermined');
    expect(toPermission('')).toBe('undetermined');
  });
});

describe('notifControl', () => {
  it('undetermined → request the permission', () => {
    expect(notifControl('undetermined')).toEqual({
      statusLabel: 'Off',
      actionLabel: 'Turn on notifications',
      action: 'request',
    });
  });

  it('granted → manage in settings (request would no-op; OS dialog is one-shot)', () => {
    expect(notifControl('granted')).toEqual({
      statusLabel: 'On',
      actionLabel: 'Manage in settings',
      action: 'settings',
    });
  });

  it('denied → deep-link to settings (OS will not re-prompt)', () => {
    expect(notifControl('denied')).toEqual({
      statusLabel: 'Blocked',
      actionLabel: 'Open settings',
      action: 'settings',
    });
  });
});
