import axios, { AxiosRequestConfig } from "axios";
import { WKApp, buildAcceptLanguage } from "@octo/base";
import type {
  CreateMcpParams,
  ListMcpParams,
  ListMcpResponse,
  McpCategory,
  McpDetail,
} from "../types/mcp";
import {
  MCP_CATEGORY_LABELS,
  MCP_CATEGORY_ORDER,
  MOCK_MCP_DETAILS,
  MOCK_MCP_LIST,
} from "../mock/mcpMock";

// ═══════════════════════════════════════════════════════════════════════════
// MCP Market service layer
// ═══════════════════════════════════════════════════════════════════════════
//
// The UI (list page + detail/create modals) ONLY imports the exported
// functions below — it never talks to axios or the mock directly. This keeps
// data-fetching behind a single seam so switching from mock to the real
// backend is a one-line change.
//
//   ┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
//   │  Pages/UI   │ ──▶ │  this service    │ ──▶ │ mock OR api │
//   └─────────────┘     └──────────────────┘     └─────────────┘
//
// TODO(backend): when the real MCP-market API is ready, flip USE_MOCK to
// false (or wire it to an env flag) and implement the `*Real` functions
// against the actual endpoints. Nothing in the UI layer changes.
// The real request plumbing (axios instance + interceptors) mirrors the
// summary module (packages/dmworksummary/src/api/summaryApi.ts) so auth /
// space-id / language headers stay consistent across the app.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Single switch between mock and real implementations.
 * Keep as a const so the bundler tree-shakes the unused branch in prod.
 */
const USE_MOCK = true;

// Simulate network latency so loading states are exercised during dev.
const MOCK_DELAY_MS = 300;

function delay<T>(value: T, ms = MOCK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// ─── Mock implementations ──────────────────────────────────────────────────

function buildCategories(): McpCategory[] {
  const counts = new Map<string, number>();
  for (const item of MOCK_MCP_LIST) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }
  return MCP_CATEGORY_ORDER.map((key) => ({
    key,
    label: MCP_CATEGORY_LABELS[key] ?? key,
    count: key === "all" ? MOCK_MCP_LIST.length : counts.get(key) ?? 0,
  }));
}

async function listMcpMock(params: ListMcpParams): Promise<ListMcpResponse> {
  const keyword = (params.keyword ?? "").trim().toLowerCase();
  const category = params.category ?? "all";
  const items = MOCK_MCP_LIST.filter((item) => {
    const matchCategory = category === "all" || item.category === category;
    const matchKeyword =
      !keyword ||
      item.name.toLowerCase().includes(keyword) ||
      item.slogan.toLowerCase().includes(keyword) ||
      item.provider.toLowerCase().includes(keyword);
    return matchCategory && matchKeyword;
  });
  return delay({ items, total: items.length, categories: buildCategories() });
}

async function getMcpDetailMock(id: string): Promise<McpDetail> {
  const detail = MOCK_MCP_DETAILS.find((d) => d.id === id);
  if (!detail) {
    throw new Error(`MCP not found: ${id}`);
  }
  return delay(detail);
}

async function createMcpMock(params: CreateMcpParams): Promise<{ id: string }> {
  // Mock create: no persistence, just echo a synthetic id.
  const id = `mock-${Date.now()}`;
  return delay({ id }, 400).then((r) => {
    // eslint-disable-next-line no-console
    console.info("[mcp-market] mock create", params);
    return r;
  });
}

// ─── Real implementations (placeholders — wire up when backend lands) ───────

const mcpAxios = axios.create({ baseURL: "" });

// TODO(backend): confirm the real mount path. Assumed nginx-proxied at
// <origin>/mcp/api/v1, mirroring the summary service convention.
const BASE = "/mcp/api/v1";

function resolveBaseURL(): string {
  const apiURL = WKApp.apiClient?.config?.apiURL;
  if (!apiURL) return "";
  try {
    return new URL(apiURL).origin;
  } catch {
    return "";
  }
}

mcpAxios.interceptors.request.use((config) => {
  config.baseURL = resolveBaseURL();
  config.headers = config.headers ?? {};
  config.headers["Accept-Language"] = buildAcceptLanguage();
  const token = WKApp.loginInfo.token;
  if (token) {
    config.headers["token"] = token;
  }
  const spaceId = WKApp.shared.currentSpaceId;
  if (spaceId) {
    config.headers["X-Space-Id"] = spaceId;
  }
  return config;
});

async function get<T>(
  path: string,
  params?: Record<string, unknown>,
  config?: AxiosRequestConfig
): Promise<T> {
  const resp = await mcpAxios.get(`${BASE}${path}`, { params, ...config });
  return resp.data?.data ?? resp.data;
}

async function post<T>(path: string, data?: unknown): Promise<T> {
  const resp = await mcpAxios.post(`${BASE}${path}`, data);
  return resp.data?.data ?? resp.data;
}

async function listMcpReal(params: ListMcpParams): Promise<ListMcpResponse> {
  // TODO(backend): adjust to the real response shape.
  return get<ListMcpResponse>("/servers", params as Record<string, unknown>);
}

async function getMcpDetailReal(id: string): Promise<McpDetail> {
  // TODO(backend): adjust to the real response shape.
  return get<McpDetail>(`/servers/${encodeURIComponent(id)}`);
}

async function createMcpReal(params: CreateMcpParams): Promise<{ id: string }> {
  // TODO(backend): adjust to the real request/response shape.
  return post<{ id: string }>("/servers", params);
}

// ─── Public API (the only surface the UI imports) ──────────────────────────

export function listMcp(params: ListMcpParams = {}): Promise<ListMcpResponse> {
  return USE_MOCK ? listMcpMock(params) : listMcpReal(params);
}

export function getMcpDetail(id: string): Promise<McpDetail> {
  return USE_MOCK ? getMcpDetailMock(id) : getMcpDetailReal(id);
}

export function createMcp(params: CreateMcpParams): Promise<{ id: string }> {
  return USE_MOCK ? createMcpMock(params) : createMcpReal(params);
}
