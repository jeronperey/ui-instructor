import { useState } from 'react';

interface Props {
  placeholder: string;
  disabled?: boolean;
  /** Resolves true when the message was handled, so the input can be cleared. */
  onSend: (text: string) => Promise<boolean>;
}

export default function ChatBar({ placeholder, disabled, onSend }: Props) {
  const [text, setText] = useState('');

  async function send() {
    const message = text.trim();
    if (!message) return;
    if (await onSend(message)) setText('');
  }

  return (
    <div className="prompt-input-bar">
      <input
        type="text"
        placeholder={placeholder}
        value={text}
        disabled={disabled}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') void send(); }}
      />
      <button className="btn-send" disabled={disabled || !text.trim()} onClick={() => void send()}>Send</button>
    </div>
  );
}
