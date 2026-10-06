import { useState } from 'react';
import { checkTypos, exportUrl } from '../api/curriculum';
import type { LabMaterial, TypoIssue } from '../api/curriculum';

interface Props {
  lab: LabMaterial | null;
  pdfs: { kind: 'lab' | 'quiz' | 'rubric'; label: string }[];
}

/** Proofreading and PDF export for a generated lab. Renders nothing until a lab exists. */
export default function LabTools({ lab, pdfs }: Props) {
  const [checking, setChecking] = useState(false);
  const [issues, setIssues] = useState<TypoIssue[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!lab) return null;

  async function runCheck() {
    setChecking(true);
    setError(null);
    try {
      setIssues((await checkTypos()).issues);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Typo check failed.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="lab-tools">
      <div className="lab-tools-row">
        <button className="btn-outline" disabled={checking} onClick={() => void runCheck()}>
          {checking ? 'Checking…' : 'Check typos'}
        </button>
        {pdfs.map(p => (
          <a key={p.kind} className="download-link" href={exportUrl(p.kind)}>Download {p.label} PDF</a>
        ))}
      </div>
      {error && <div className="status-line status-error" role="alert">{error}</div>}
      {issues !== null && issues.length === 0 && <div className="status-line status-loading">No issues found.</div>}
      {issues !== null && issues.length > 0 && (
        <ul className="lab-tools-issues">
          {issues.map((issue, i) => (
            <li key={i}><strong>{issue.type}</strong> · {issue.location}: {issue.suggestion}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
