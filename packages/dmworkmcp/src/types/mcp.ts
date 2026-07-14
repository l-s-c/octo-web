// ─── MCP Market domain types ───────────────────────────────────────────────
// These types describe the MCP (Model Context Protocol) server marketplace
// entities. They are intentionally decoupled from any backend wire format so
// the service layer (see ./api) can map a real API response onto them later
// without touching the UI.

/** MCP transport kinds, per the MCP spec. */
export type McpTransport = "stdio" | "streamable-http" | "sse";

/** A single tool exposed by an MCP server. */
export interface McpTool {
  name: string;
  description: string;
  /** JSON schema of the tool input (optional, from tools/list). */
  inputSchema?: Record<string, unknown>;
}

/** A frequently-asked question shown on the detail modal. */
export interface McpFaq {
  question: string;
  answer: string;
}

/**
 * Structured "quick access" data. The three quick-access tabs (prompt / CLI /
 * JSON) are all generated from THIS structure plus frontend templates — no MCP
 * ships hand-written snippets. See src/api/quickStartTemplates.ts.
 *
 * TODO(backend): the real detail endpoint should return this same `quickStart`
 * shape; the frontend keeps owning the client-specific templating.
 */
export interface McpQuickStart {
  transport: McpTransport;
  /** Server name used as the key in the generated config. */
  serverName: string;
  /** Remote endpoint (streamable-http / sse). */
  url?: string;
  /** Whether the remote endpoint needs a bearer token. */
  authType?: "bearer" | "none";
  /** stdio command + args + env (stdio transport only). */
  command?: string;
  args?: string[];
  env?: Record<string, string>;
}

/** Card + list representation of an MCP server. */
export interface McpListItem {
  id: string;
  /** Display name, e.g. "GitHub MCP". */
  name: string;
  /** Short one/two line pitch shown on the card. */
  slogan: string;
  /** Category key used by the filter pills, e.g. "dev". */
  category: string;
  /** Provider / publisher label. */
  provider: string;
  /** Short tag labels shown on the card, e.g. ["官方", "热门"]. */
  tags: string[];
  /** Number of tools this server exposes (shown on the card footer). */
  toolCount: number;
  /** Icon glyph / emoji used as the card avatar. */
  icon: string;
}

/** Full detail payload shown in the centered detail modal. */
export interface McpDetail extends McpListItem {
  /** Long description shown under the title. */
  description: string;
  /** Structured quick-access data — the 3 tabs are generated from this. */
  quickStart: McpQuickStart;
  /** The tools grid (2 columns) in the detail modal. */
  tools: McpTool[];
  /** A usage example (rendered as a quote block). */
  usageExample: string;
  /** Common questions. */
  faqs: McpFaq[];
  /** Cautions / notes (rendered as a warning block, one string per line). */
  notes: string[];
}

/** A category filter option with its live count. */
export interface McpCategory {
  key: string;
  label: string;
  count: number;
}

/** Params accepted by the list endpoint (mock honors keyword + category). */
export interface ListMcpParams {
  keyword?: string;
  category?: string;
}

/** Response envelope for the list endpoint. */
export interface ListMcpResponse {
  items: McpListItem[];
  total: number;
  categories: McpCategory[];
}

/**
 * Request for the "try connect / fetch tool list" probe.
 * Shape fixed per LSC-70 research conclusion so the mock and the real
 * (Electron main-process) implementation share one signature.
 */
export interface McpProbeRequest {
  transport: McpTransport;
  /** stdio */
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  /** http / sse */
  url?: string;
  headers?: Record<string, string>;
}

/** Error codes the probe can surface. */
export type McpProbeErrorCode =
  | "command_not_found"
  | "timeout"
  | "init_failed"
  | "no_tools_capability";

/** Result of a probe. Mirrors LSC-70's McpProbeResult. */
export interface McpProbeResult {
  ok: boolean;
  tools: McpTool[];
  serverInfo?: { name?: string; version?: string };
  error?: { code: McpProbeErrorCode; message: string };
}

/**
 * Payload for creating a new MCP server entry. The fields here map 1:1 onto
 * the fields surfaced in the detail modal, per the product spec.
 */
export interface CreateMcpParams {
  name: string;
  provider: string;
  category: string;
  slogan: string;
  description: string;
  /** Transport kind (drives which connection fields apply). */
  transport: McpTransport;
  /** Remote endpoint (streamable-http / sse). */
  url?: string;
  /** stdio command line. */
  command?: string;
  /** The tool list — probed or hand-filled. */
  tools: McpTool[];
  /** Visibility scope. */
  visibility: McpVisibility;
}

export type McpVisibility = "public" | "space" | "private";
