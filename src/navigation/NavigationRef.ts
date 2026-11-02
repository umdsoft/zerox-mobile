import * as React from 'react';
import {isAppLocked} from '../helper/appLockState';

export const navigationRef = React.createRef();

export function navigate(name: string, params?: any) {
  // SEC (2026-11-02): qulf (PIN) ekrani ustiga hech narsa ochilmasin (fon bildirishnoma/handlerlar).
  // Bildirishnoma BOSILISHI index.js'da alohida (deferNotificationPress) kechiktiriladi.
  if (isAppLocked()) return;
  if (navigationRef.current) {
    navigationRef.current.navigate(name, params);
  }
}
