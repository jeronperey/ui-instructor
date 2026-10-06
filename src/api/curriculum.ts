// Direct client for the Curriculum Designer agent (no orchestrator).
// Endpoint reference: curriculum-designer/routers/curriculum.py
//
// Set VITE_CURRICULUM_URL in .env.local (copy from .env.example).

const BASE = import.meta.env.VITE_CURRICULUM_URL ?? 'http://localhost:8003';
export const LAB_ID = import.meta.env.VITE_LAB_ID ?? 'lab4';

// Placeholder identity until real instructor auth exists.
const INSTRUCTOR_ID = 'instructor';

// Generation takes ~30-60s on the live model.
const TIMEOUT_MS = 150_000;

// ── Types (mirror curriculum-designer/models/curriculum.py) ─────────────────

export type ApprovalStatus = 'pending' | 'approved' | 'needs_changes';

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'short_answer' | 'multiple_choice' | 'code' | 'essay';
  expected_answer: string;
  rubric_points: number;
  difficulty: 'basic' | 'intermediate' | 'challenge';
  learning_objective_ref: string | null;
}

export interface LabMaterial {
  lab_id: string;
  title: string;
  spec_markdown: string;
  quiz: QuizQuestion[];
  learning_objectives: string[];
  material_content: string | null;
  approval_status: ApprovalStatus;
  version: number;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ── Request helper ──────────────────────────────────────────────────────────

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, { ...init, signal: controller.signal });
    if (!res.ok) {
      // Agent errors look like { error: { code, message } }
      const body = await res.json().catch(() => null);
      throw new ApiError(body?.error?.message ?? `Request failed (${res.status})`, res.status);
    }
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new ApiError('The curriculum designer took too long to respond.', 0);
    }
    throw new ApiError('Could not reach the curriculum designer. Is it running?', 0);
  } finally {
    clearTimeout(timer);
  }
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ── Endpoints ───────────────────────────────────────────────────────────────

/** Returns null when no lab exists yet for LAB_ID. */
export async function getLab(): Promise<LabMaterial | null> {
  try {
    return await request<LabMaterial>(`/curriculum/${LAB_ID}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export function generateLab(params: {
  title: string;
  learningObjectives: string[];
  file?: File;
}): Promise<LabMaterial> {
  if (params.file) {
    const form = new FormData();
    form.append('lab_id', LAB_ID);
    form.append('title', params.title);
    form.append('learning_objectives', JSON.stringify(params.learningObjectives));
    form.append('instructor_id', INSTRUCTOR_ID);
    form.append('files', params.file);
    return request<LabMaterial>('/curriculum/generate-with-material', { method: 'POST', body: form });
  }
  return postJson<LabMaterial>('/curriculum/generate', {
    lab_id: LAB_ID,
    title: params.title,
    learning_objectives: params.learningObjectives,
    instructor_id: INSTRUCTOR_ID,
  });
}

/** Stores the PDF text as generation context; call generateLab afterwards to apply it. */
export async function uploadMaterial(file: File): Promise<void> {
  const form = new FormData();
  form.append('files', file);
  await request(`/curriculum/${LAB_ID}/upload-material`, { method: 'POST', body: form });
}

export function approveLab(): Promise<LabMaterial> {
  return postJson<LabMaterial>(`/curriculum/${LAB_ID}/approve`, { approved_by: INSTRUCTOR_ID, notes: '' });
}

/** Regenerates the quiz and rubric (not the spec) using the feedback. */
export function requestChanges(feedback: string): Promise<LabMaterial> {
  return postJson<LabMaterial>(`/curriculum/${LAB_ID}/request-changes`, {
    feedback,
    requested_by: INSTRUCTOR_ID,
  });
}
