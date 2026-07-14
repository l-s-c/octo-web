/**
 * Real HTTP client for the skill marketplace API.
 *
 * This module communicates with the octo-marketplace backend. It maps
 * snake_case responses to camelCase frontend types.
 *
 * To switch from mock to real API, change the import in consuming code
 * from `./skillApi` (mock) to `./skillApiReal`.
 */
import { API_BASE_URL } from "./constants";
import type {
  Category,
  NewSkillForm,
  PagedResult,
  RawCategory,
  RawPagedResult,
  RawSkill,
  Skill,
  SkillListQuery,
  UpdateSkillForm,
  ApiResponse,
} from "../types/skill";

// ─── Helpers ───────────────────────────────────────────────────────────────

class ApiError extends Error {
  constructor(
    public code: string | number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  // 204 No Content (e.g. DELETE success)
  if (res.status === 204) return undefined as unknown as T;

  const body: ApiResponse<T> = await res.json();

  if (body.code !== 0) {
    throw new ApiError(body.code, body.message ?? "Unknown error");
  }

  return body.data;
}

// ─── Mappers ───────────────────────────────────────────────────────────────

function mapCategory(raw: RawCategory, index: number): Category {
  return {
    id: raw.id,
    name: raw.name,
    iconKey: raw.icon_key,
    sortOrder: index + 1,
    skillCount: raw.skill_count,
  };
}

function mapSkill(raw: RawSkill): Skill {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    categoryId: raw.category_id,
    tags: raw.tags ?? [],
    ownerId: raw.owner_id,
    ownerName: raw.owner_name,
    spaceId: raw.space_id,
    visibility: raw.visibility,
    version: raw.version,
    readmeContent: raw.readme_content,
    fileName: raw.file_name,
    fileUrl: raw.file_url,
    fileSize: raw.file_size,
    fileSha256: raw.file_sha256,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function mapPagedResult(raw: RawPagedResult<RawSkill>): PagedResult<Skill> {
  return {
    items: (raw.items ?? []).map(mapSkill),
    nextCursor: raw.next_cursor,
  };
}

// ─── Public API (same signatures as mock skillApi.ts) ──────────────────────

export function getCategories(): Promise<Category[]> {
  return request<RawCategory[]>("/skill/categories").then((items) =>
    items.map(mapCategory),
  );
}

export function getSkills(query: SkillListQuery = {}): Promise<PagedResult<Skill>> {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.categoryId && query.categoryId !== "all")
    params.set("category_id", query.categoryId);
  if (query.cursor) params.set("cursor", query.cursor);
  if (query.limit) params.set("limit", String(query.limit));
  const qs = params.toString();
  return request<RawPagedResult<RawSkill>>(`/skill${qs ? `?${qs}` : ""}`).then(
    mapPagedResult,
  );
}

export function getMySkills(query: SkillListQuery = {}): Promise<PagedResult<Skill>> {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.cursor) params.set("cursor", query.cursor);
  if (query.limit) params.set("limit", String(query.limit));
  const qs = params.toString();
  return request<RawPagedResult<RawSkill>>(
    `/skill/mine${qs ? `?${qs}` : ""}`,
  ).then(mapPagedResult);
}

export function getSkill(id: string): Promise<Skill> {
  return request<RawSkill>(`/skill/${encodeURIComponent(id)}`).then(mapSkill);
}

export function createSkill(form: NewSkillForm): Promise<Skill> {
  return request<RawSkill>("/skill", {
    method: "POST",
    body: JSON.stringify({
      name: form.name,
      description: form.description,
      category_id: form.categoryId,
      tags: form.tags,
      visibility: form.visibility,
      version: form.version,
      readme_content: form.readmeContent,
      file_name: form.fileName,
      file_size: form.fileSize,
    }),
  }).then(mapSkill);
}

export function updateSkill(id: string, form: UpdateSkillForm): Promise<Skill> {
  const body: Record<string, unknown> = {};
  if (form.name !== undefined) body.name = form.name;
  if (form.description !== undefined) body.description = form.description;
  if (form.categoryId !== undefined) body.category_id = form.categoryId;
  if (form.tags !== undefined) body.tags = form.tags;
  if (form.visibility !== undefined) body.visibility = form.visibility;
  if (form.version !== undefined) body.version = form.version;
  if (form.readmeContent !== undefined) body.readme_content = form.readmeContent;
  if (form.fileName !== undefined) body.file_name = form.fileName;
  if (form.fileSize !== undefined) body.file_size = form.fileSize;

  return request<RawSkill>(`/skill/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  }).then(mapSkill);
}

export function deleteSkill(id: string): Promise<void> {
  return request<void>(`/skill/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
