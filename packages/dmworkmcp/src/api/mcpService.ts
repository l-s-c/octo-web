import axios, { AxiosRequestConfig } from "axios";
import { WKApp, buildAcceptLanguage } from "@octo/base";
import type {
  CreateMcpParams,
  ListMcpParams,
  ListMcpResponse,
  McpCategory,
  McpDetail,
  McpListItem,
  McpProbeRequest,
  McpProbeResult,
  McpQuickStart,
} from "../types/mcp";
import {
  MCP_CATEGORY_LABELS,
  MCP_CATEGORY_ORDER,
  MOCK_MCP_DETAILS,
  MOCK_MCP_LIST,
  MOCK_PROBED_TOOLS,
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
// Public surface (stable signatures — backend only replaces the impls):
//   fetchMcpList(params)   → list + categories
//   fetchMcpDetail(id)     → full detail
//   probeMcpTools(req)     → "try connect / fetch tool list" (see LSC-70)
//   createMcp(params)      → create a new MCP entry
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

async function fetchMcpListMock(
  params: ListMcpParams
): Promise<ListMcpResponse> {
  const keyword = (params.keyword ?? "").trim().toLowerCase();
  const category = params.category ?? "all";
  const items = MOCK_MCP_LIST.filter((item) => {
    const matchCategory = category === "all" || item.category === category;
    const matchKeyword =
      !keyword ||
      item.name.toLowerCase().includes(keyword) ||
      item.slogan.toLowerCase().includes(keyword);
    return matchCategory && matchKeyword;
  });
  return delay({ items, total: items.length, categories: buildCategories() });
}

async function fetchMcpDetailMock(id: string): Promise<McpDetail> {
  const detail = MOCK_MCP_DETAILS.find((d) => d.id === id);
  if (!detail) {
    throw new Error(`MCP not found: ${id}`);
  }
  return delay(detail);
}

async function probeMcpToolsMock(
  req: McpProbeRequest
): Promise<McpProbeResult> {
  // Mock probe: pretend to connect and fetch tools/list. Longer delay so the
  // loading state is visible. Real probing (esp. stdio) must be done by the
  // Electron main process — see LSC-70.
  // TODO: 后端提供真实探测接口
  const hasTarget = req.transport === "stdio" ? !!req.command : !!req.url;
  if (!hasTarget) {
    return delay(
      {
        ok: false,
        tools: [],
        // The UI translates by `code`; the service layer stays i18n-agnostic.
        error: {
          code: "init_failed" as const,
          message: "",
        },
      },
      600
    );
  }
  return delay(
    {
      ok: true,
      tools: MOCK_PROBED_TOOLS,
      serverInfo: { name: req.transport, version: "mock" },
    },
    800
  );
}

async function createMcpMock(params: CreateMcpParams): Promise<{ id: string }> {
  // In-memory persistence: mutate the same arrays fetchMcpList/Detail read
  // from, so a freshly-created MCP shows up at the top of the list and its
  // detail modal opens without a "not found" error. Session-only — a page
  // reload resets to the built-in fixtures, which is what we want for a
  // prototype (no leaking mock state across sessions).
  const id = slugify(params.name) || `mock-${Date.now()}`;
  const uniqueId = MOCK_MCP_DETAILS.some((d) => d.id === id)
    ? `${id}-${Date.now().toString(36)}`
    : id;
  const detail = buildDetailFromCreate(uniqueId, params);
  MOCK_MCP_DETAILS.unshift(detail);
  MOCK_MCP_LIST.unshift(projectListItem(detail));
  return delay({ id: uniqueId }, 400);
}

/** Turn a create-form payload into a fully-populated detail record. */
function buildDetailFromCreate(
  id: string,
  params: CreateMcpParams
): McpDetail {
  const quickStart: McpQuickStart = {
    transport: params.transport,
    serverName: params.name.trim(),
    url: params.url || undefined,
    authType: params.authType,
    command: params.command || undefined,
    args: params.args && params.args.length ? params.args : undefined,
    env:
      params.env && Object.keys(params.env).length ? params.env : undefined,
  };
  return {
    id,
    name: params.name.trim(),
    slogan: params.slogan,
    category: params.category,
    tags: params.tags ?? [],
    toolCount: params.tools.length,
    icon: params.icon || "🧩",
    quickStart,
    tools: params.tools,
    usageExamples: (params.usageExamples ?? []).filter((s) => s.trim()),
    faqs: (params.faqs ?? []).filter((f) => f.question.trim()),
    notes: (params.notes ?? []).filter((s) => s.trim()),
  };
}

/** Derive the list-card projection from a full detail. */
function projectListItem(d: McpDetail): McpListItem {
  return {
    id: d.id,
    name: d.name,
    slogan: d.slogan,
    category: d.category,
    tags: d.tags,
    toolCount: d.toolCount,
    icon: d.icon,
  };
}

/** ASCII/CJK-safe slug for the mock id. Falls back to "" so caller adds ts. */
function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9一-龥-]/g, "");
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

async function fetchMcpListReal(
  params: ListMcpParams
): Promise<ListMcpResponse> {
  // TODO(backend): adjust to the real response shape.
  return get<ListMcpResponse>("/servers", params as Record<string, unknown>);
}

async function fetchMcpDetailReal(id: string): Promise<McpDetail> {
  // TODO(backend): adjust to the real response shape.
  return get<McpDetail>(`/servers/${encodeURIComponent(id)}`);
}

async function probeMcpToolsReal(
  req: McpProbeRequest
): Promise<McpProbeResult> {
  // TODO(backend): stdio probing must run in the Electron main process
  // (see LSC-70). This will call the `mcp:probeTools` IPC / local HTTP route
  // rather than this remote axios path once that lands.
  return post<McpProbeResult>("/probe", req);
}

async function createMcpReal(params: CreateMcpParams): Promise<{ id: string }> {
  // TODO(backend): adjust to the real request/response shape.
  return post<{ id: string }>("/servers", params);
}

// ─── Public API (the only surface the UI imports) ──────────────────────────

export function fetchMcpList(
  params: ListMcpParams = {}
): Promise<ListMcpResponse> {
  return USE_MOCK ? fetchMcpListMock(params) : fetchMcpListReal(params);
}

export function fetchMcpDetail(id: string): Promise<McpDetail> {
  return USE_MOCK ? fetchMcpDetailMock(id) : fetchMcpDetailReal(id);
}

/**
 * Try-connect + fetch tool list. Mock returns a fake tool set after a delay;
 * the real implementation is provided by the Electron main process.
 * TODO: 后端提供真实探测接口
 */
export function probeMcpTools(req: McpProbeRequest): Promise<McpProbeResult> {
  return USE_MOCK ? probeMcpToolsMock(req) : probeMcpToolsReal(req);
}

export function createMcp(params: CreateMcpParams): Promise<{ id: string }> {
  return USE_MOCK ? createMcpMock(params) : createMcpReal(params);
}
