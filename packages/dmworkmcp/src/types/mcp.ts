// ─── MCP Market domain types ───────────────────────────────────────────────
// These types describe the MCP (Model Context Protocol) server marketplace
// entities. They are intentionally decoupled from any backend wire format so
// the service layer (see ./api) can map a real API response onto them later
// without touching the UI.

/** A single tool exposed by an MCP server. */
export interface McpTool {
  name: string;
  description: string;
}

/** A frequently-asked question shown on the detail modal. */
export interface McpFaq {
  question: string;
  answer: string;
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
  /** The `mcpServers` config snippet for the dark quick-access code block. */
  quickAccessConfig: string;
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
 * Payload for creating a new MCP server entry. The fields here map 1:1 onto
 * the fields surfaced in the detail modal, per the product spec.
 */
export interface CreateMcpParams {
  name: string;
  provider: string;
  category: string;
  slogan: string;
  description: string;
  /** Connection config (the mcpServers JSON snippet). */
  quickAccessConfig: string;
  /** Visibility scope. */
  visibility: McpVisibility;
}

export type McpVisibility = "public" | "space" | "private";
