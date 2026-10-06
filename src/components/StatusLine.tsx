interface Props {
  busy: boolean;
  error: string | null;
}

export default function StatusLine({ busy, error }: Props) {
  if (error) return <div className="status-line status-error" role="alert">{error}</div>;
  if (busy) return <div className="status-line status-loading">Working… generation can take up to a minute.</div>;
  return null;
}
