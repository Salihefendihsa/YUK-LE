import { useCallback, useRef, useState } from 'react';
import { ConfirmDialog, type ConfirmTone } from '../components/ui/ConfirmDialog';

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

type Resolver = (ok: boolean) => void;

/**
 * Promise-based confirm. Component'in JSX'inde `{dialog}` render et,
 * sonra `await confirm({...})` ile kullan. Native Alert.alert yerine.
 */
export function useConfirm() {
  const [visible, setVisible] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const resolverRef = useRef<Resolver | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    setOpts(options);
    setVisible(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = useCallback((ok: boolean) => {
    setVisible(false);
    setLoading(false);
    const r = resolverRef.current;
    resolverRef.current = null;
    r?.(ok);
  }, []);

  const dialog = opts ? (
    <ConfirmDialog
      visible={visible}
      title={opts.title}
      message={opts.message}
      confirmLabel={opts.confirmLabel}
      cancelLabel={opts.cancelLabel}
      tone={opts.tone}
      loading={loading}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  ) : null;

  return { confirm, dialog, setConfirmLoading: setLoading };
}
