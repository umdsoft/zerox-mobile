/**
 * useOfertaSafePad.ts — xavfsiz maydon (ContractModal.tsx dan ko'chirilgan, xulq o'zgarmagan).
 * SS-DEV (2026-10-04) ILDIZ: orqaga tugmasi status bar ostida kesilardi — oyna ota maydonni AYNAN to'ldiradi
 * (flex:1) va ota inset'lar qoplamagan qismi (status bar / notch, home indicator / nav bar) o'lchab olinib padding qilinadi.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

export const useOfertaSafePad = (contract: boolean) => {
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();
  const mainRef = useRef<View>(null);
  const [pad, setPad] = useState({ top: 0, bottom: 0 });
  const measureInsets = useCallback(() => {
    mainRef.current?.measureInWindow((_x, y, _w, h) => {
      if (!h) return;
      const top = Math.max(0, Math.round(insets.top - (y - frame.y)));
      const bottom = Math.max(0, Math.round(insets.bottom - (frame.y + frame.height - (y + h))));
      setPad(p => (p.top === top && p.bottom === bottom ? p : { top, bottom }));
    });
  }, [insets.top, insets.bottom, frame.y, frame.height]);
  useEffect(() => {
    if (contract) measureInsets();
  }, [contract, measureInsets]);
  return { mainRef, pad, measureInsets };
};
