/**
 * Typed API client for the AboutFit backend.
 *
 * The backend exposes a REST surface under /api plus an SSE stream
 * for render progress. All cross-origin fetches go through this module
 * so that auth headers, base URLs, and error shapes stay consistent.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// ---------- Types (mirror packages/domain shapes; kept local so the web
// app can compile without pulling the full zod runtime client-side). ----------

export type GarmentStatus =
  | "draft"
  | "segmented"
  | "ready"
  | "rendering"
  | "approved"
  | "exported";

export interface Garment {
  id: string;
  sku: string;
  collectionId: string;
  flatlayUrl: string;
  segmentationMaskUrl?: string;
  fabric?: string;
  silhouette?: string;
  length?: string;
  status: GarmentStatus;
}

export interface VirtualModel {
  id: string;
  workspaceId: string;
  name: string;
  referenceImageUrl: string;
  faceEmbedding?: number[];
  bodyEmbedding?: number[];
}

export type RenderStatus = "queued" | "processing" | "ready" | "failed";

export interface Render {
  id: string;
  garmentId: string;
  virtualModelId: string;
  status: RenderStatus;
  provider?: string;
  costCents?: number;
  promptVersion?: string;
  resultUrl?: string;
  errorMessage?: string;
  createdAt?: string;
}

export type UploadKind = "garment-flatlay" | "virtual-model-reference";

export interface PresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export interface RenderProgressEvent {
  status: RenderStatus;
  progress?: number;
  resultUrl?: string;
  errorMessage?: string;
  [key: string]: unknown;
}

// ---------- Internal helpers ----------

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      // ignore
    }
    throw new Error(
      `API ${init?.method ?? "GET"} ${path} failed: ${res.status} ${detail}`
    );
  }
  // 204 / empty body guard
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ---------- Uploads ----------

export async function presignUpload(
  fileName: string,
  contentType: string,
  kind: UploadKind
): Promise<PresignResponse> {
  return request<PresignResponse>("/uploads/presign", {
    method: "POST",
    body: JSON.stringify({ fileName, contentType, kind }),
  });
}

export async function uploadFileToS3(
  file: File,
  uploadUrl: string
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  });
  if (!res.ok) {
    throw new Error(`S3 upload failed: ${res.status}`);
  }
}

/**
 * Full upload flow: presign + PUT. Returns the public URL of the
 * uploaded object so the caller can persist it on a domain entity.
 */
export async function uploadFile(
  file: File,
  kind: UploadKind
): Promise<string> {
  const { uploadUrl, publicUrl } = await presignUpload(
    file.name,
    file.type || "application/octet-stream",
    kind
  );
  await uploadFileToS3(file, uploadUrl);
  return publicUrl;
}

// ---------- Virtual models ----------

export async function listVirtualModels(
  workspaceId: string
): Promise<VirtualModel[]> {
  return request<VirtualModel[]>(
    `/workspaces/${encodeURIComponent(workspaceId)}/models`
  );
}

export async function createVirtualModel(
  workspaceId: string,
  name: string,
  referenceImageUrl: string
): Promise<VirtualModel> {
  return request<VirtualModel>(
    `/workspaces/${encodeURIComponent(workspaceId)}/models`,
    {
      method: "POST",
      body: JSON.stringify({ name, referenceImageUrl }),
    }
  );
}

// ---------- Garments ----------

export async function createGarment(
  collectionId: string,
  flatlayUrl: string,
  sku?: string
): Promise<Garment> {
  return request<Garment>("/garments", {
    method: "POST",
    body: JSON.stringify({ collectionId, flatlayUrl, sku }),
  });
}

export async function listGarments(workspaceId: string): Promise<Garment[]> {
  const q = new URLSearchParams({ workspaceId }).toString();
  return request<Garment[]>(`/garments?${q}`);
}

export async function getGarment(garmentId: string): Promise<Garment> {
  return request<Garment>(`/garments/${encodeURIComponent(garmentId)}`);
}

export async function listRendersForGarment(
  garmentId: string
): Promise<Render[]> {
  const q = new URLSearchParams({ garmentId }).toString();
  return request<Render[]>(`/renders?${q}`);
}

// ---------- Renders ----------

export async function createRender(
  garmentId: string,
  virtualModelId: string,
  promptVersion: string = "v1"
): Promise<Render> {
  return request<Render>("/renders", {
    method: "POST",
    body: JSON.stringify({ garmentId, virtualModelId, promptVersion }),
  });
}

/**
 * Subscribe to the SSE stream for a render. Returns a cleanup function
 * that closes the underlying EventSource.
 */
export function subscribeRenderProgress(
  renderId: string,
  onEvent: (ev: RenderProgressEvent) => void
): () => void {
  const url = `${API_BASE}/renders/${encodeURIComponent(renderId)}/stream`;
  const es = new EventSource(url);
  es.onmessage = (msg) => {
    try {
      const parsed = JSON.parse(msg.data) as RenderProgressEvent;
      onEvent(parsed);
    } catch {
      // ignore malformed
    }
  };
  es.onerror = () => {
    // Let the consumer decide whether to retry; for now we just close
    // so we don't leak connections on hard failures.
    es.close();
  };
  return () => es.close();
}
