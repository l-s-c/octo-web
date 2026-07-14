export type Visibility = "public" | "space" | "private";

// ─── Frontend (camelCase) types ────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  iconKey: string;
  sortOrder: number;
  skillCount: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  tags: string[];
  ownerId: string;
  ownerName: string;
  spaceId: string;
  visibility: Visibility;
  version: string;
  readmeContent: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileSha256?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkillListQuery {
  q?: string;
  categoryId?: string;
  cursor?: string;
  limit?: number;
  mine?: boolean;
}

export interface PagedResult<T> {
  items: T[];
  nextCursor: string | null;
}

export interface ApiResponse<T> {
  code: number | string;
  message?: string;
  data: T;
}

export interface NewSkillForm {
  name: string;
  description: string;
  categoryId: string;
  tags: string[];
  visibility: Visibility;
  version?: string;
  readmeContent: string;
  fileName: string;
  fileSize: number;
}

export type UpdateSkillForm = Partial<NewSkillForm>;

// ─── Backend (snake_case) raw response types ───────────────────────────────

/** Raw category as returned by GET /api/v1/skill/categories */
export interface RawCategory {
  id: string;
  name: string;
  icon_key: string;
  skill_count: number;
}

/** Raw skill as returned by GET /api/v1/skill and GET /api/v1/skill/:id */
export interface RawSkill {
  id: string;
  name: string;
  description: string;
  category_id: string;
  tags: string[];
  owner_id: string;
  owner_name: string;
  space_id: string;
  visibility: Visibility;
  version: string;
  readme_content: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_sha256: string;
  created_at: string;
  updated_at: string;
}

/** Raw paged response from list endpoints */
export interface RawPagedResult<T> {
  items: T[];
  next_cursor: string | null;
}
