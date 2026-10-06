import { useRef, useState } from 'react';
import Modal from './Modal';

interface Props {
  /** The agent stores instructions on an existing lab, so a lab must be generated first. */
  labExists: boolean;
  onSave: (instructions: string) => Promise<void>;
  onClose: () => void;
}

type Mode = 'write' | 'file';

export default function UploadAgentModal({ labExists, onSave, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('write');
  const [instructions, setInstructions] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The agent stores plain text, so only text files can be sent.
  function handleFiles(files: FileList | null) {
    const picked = files?.[0];
    if (!picked) return;
    if (!/\.(txt|md)$/i.test(picked.name)) {
      setError('Only .txt and .md files are supported.');
      return;
    }
    setError(null);
    setFile(picked);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await onSave(mode === 'write' ? instructions.trim() : (await file!.text()).trim());
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the instructions.');
    } finally {
      setSaving(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  const hasContent = mode === 'write' ? instructions.trim().length > 0 : file !== null;
  const canSave = labExists && hasContent && !saving;

  return (
    <Modal title="Upload Agent Instructions" onClose={onClose} width={520}>
      <p className="modal-subtitle">
        Define how the AI agent should guide students during this lab.
      </p>

      {!labExists && (
        <p className="modal-subtitle">Generate the lab on the Lab Tasks tab first; instructions are stored on the lab.</p>
      )}

      <div className="modal-tab-switch">
        <button
          className={`modal-tab${mode === 'write' ? ' modal-tab-active' : ''}`}
          onClick={() => setMode('write')}
        >
          Write Instructions
        </button>
        <button
          className={`modal-tab${mode === 'file' ? ' modal-tab-active' : ''}`}
          onClick={() => setMode('file')}
        >
          Upload File
        </button>
      </div>

      {mode === 'write' ? (
        <textarea
          className="modal-textarea"
          placeholder={`e.g. "Only give progressive hints. Never reveal the full solution. If a student asks for the answer directly, redirect them with a guiding question. Focus hints on pointer manipulation and memory management."`}
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          rows={8}
        />
      ) : (
        <>
          <div
            className={`dropzone${dragging ? ' dropzone-active' : ''}${file ? ' dropzone-filled' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".txt,.md"
              style={{ display: 'none' }}
              onChange={e => handleFiles(e.target.files)}
            />
            {file ? (
              <>
                <div className="dropzone-icon">📄</div>
                <div className="dropzone-filename">{file.name}</div>
              </>
            ) : (
              <>
                <div className="dropzone-icon">⬆</div>
                <div className="dropzone-cta">Drag &amp; drop your instructions file</div>
                <div className="dropzone-meta">or click to browse</div>
                <div className="dropzone-hint">TXT or MD</div>
              </>
            )}
          </div>
          {file && (
            <button
              className="dropzone-clear"
              onClick={e => { e.stopPropagation(); setFile(null); }}
            >
              Remove file
            </button>
          )}
        </>
      )}

      {error && <div className="status-line status-error" role="alert">{error}</div>}
      {labExists && <p className="modal-subtitle">Saved instructions are used the next time the lab is generated.</p>}

      <div className="modal-footer">
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button
          className="btn-primary"
          disabled={!canSave}
          onClick={() => void save()}
        >
          {saving ? 'Saving…' : 'Save Instructions'}
        </button>
      </div>
    </Modal>
  );
}
