import { StatusPill, type StatusTone } from './StatusPill';

type Props = {
  label: string;
  tone?: StatusTone;
};

/** Durum rozeti — StatusPill ile ayni gorunum, semantik isim. */
export function Badge({ label, tone = 'neutral' }: Props) {
  return <StatusPill label={label} tone={tone} />;
}
