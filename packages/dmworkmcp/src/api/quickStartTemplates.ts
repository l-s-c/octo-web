import type { McpQuickStart } from "../types/mcp";

// ═══════════════════════════════════════════════════════════════════════════
// Quick-start template generation
// ═══════════════════════════════════════════════════════════════════════════
// The three quick-access tabs (提示词 / 命令行 / JSON) are ALL generated from a
// single structured `quickStart` payload plus the client-agnostic templates
// below. No MCP ships hand-written snippets. Per the LSC-71 conclusion:
//   - default tab = 提示词 (natural-language instruction for agent clients)
//   - 命令行 = `claude mcp add ...`
//   - JSON = `mcpServers` snippet; remote servers MUST carry a `type` field
//   - the token position always renders as the placeholder below (never a real
//     token, never pre-filled)
//
// TODO(backend): the backend only needs to return the `quickStart` structure;
// this templating stays on the frontend so client formats can evolve here.
// ═══════════════════════════════════════════════════════════════════════════

/** The visible token placeholder. Never pre-fill a real token. */
export const TOKEN_PLACEHOLDER = "<把这里换成你的 Token>";

export type QuickStartTabKey = "prompt" | "cli" | "json";

export interface QuickStartTab {
  key: QuickStartTabKey;
  /** i18n key suffix under `mcp.detail.qsTab`. */
  labelKey: string;
  /** The generated, copy-ready text. */
  content: string;
  /** Language hint for the code block styling. */
  lang: "text" | "bash" | "json";
}

/** Whether the transport is a remote (network) one. */
function isRemote(qs: McpQuickStart): boolean {
  return qs.transport === "streamable-http" || qs.transport === "sse";
}

/**
 * The `type` value Claude Code expects in `.mcp.json` for remote servers.
 * (Only url without type is treated as stdio and errors — see LSC-71.)
 */
function jsonTypeField(qs: McpQuickStart): string {
  if (qs.transport === "sse") return "sse";
  if (qs.transport === "streamable-http") return "http";
  return "stdio";
}

/** Build the JSON `mcpServers` snippet. */
function buildJson(qs: McpQuickStart): string {
  const type = jsonTypeField(qs);
  if (isRemote(qs)) {
    const headers =
      qs.authType === "bearer"
        ? {
            headers: { Authorization: `Bearer ${TOKEN_PLACEHOLDER}` },
          }
        : {};
    const server = { type, url: qs.url ?? "", ...headers };
    return JSON.stringify({ mcpServers: { [qs.serverName]: server } }, null, 2);
  }
  // stdio
  const server: Record<string, unknown> = {
    type,
    command: qs.command ?? "npx",
    args: qs.args ?? [],
  };
  if (qs.env && Object.keys(qs.env).length > 0) {
    server.env = maskEnv(qs.env);
  }
  return JSON.stringify({ mcpServers: { [qs.serverName]: server } }, null, 2);
}

/** Replace secret-looking env values with the token placeholder. */
function maskEnv(env: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) {
    out[k] = /token|key|secret|password|pwd/i.test(k) ? TOKEN_PLACEHOLDER : v;
  }
  return out;
}

/** Build the `claude mcp add ...` command. */
function buildCli(qs: McpQuickStart): string {
  if (isRemote(qs)) {
    const transportFlag = qs.transport === "sse" ? "sse" : "http";
    const header =
      qs.authType === "bearer"
        ? ` \\\n  --header "Authorization: Bearer ${TOKEN_PLACEHOLDER}"`
        : "";
    return `claude mcp add --transport ${transportFlag} ${qs.serverName} ${
      qs.url ?? ""
    }${header}`;
  }
  const env = qs.env
    ? Object.keys(qs.env)
        .map((k) =>
          /token|key|secret|password|pwd/i.test(k)
            ? ` --env ${k}=${TOKEN_PLACEHOLDER}`
            : ` --env ${k}=${qs.env?.[k] ?? ""}`
        )
        .join("")
    : "";
  const args = (qs.args ?? []).join(" ");
  return `claude mcp add --transport stdio${env} ${qs.serverName} \\\n  -- ${
    qs.command ?? "npx"
  } ${args}`.trim();
}

/** Build the natural-language prompt for agent clients. */
function buildPrompt(qs: McpQuickStart): string {
  if (isRemote(qs)) {
    const auth =
      qs.authType === "bearer"
        ? `\n鉴权：请求头 Authorization: Bearer ${TOKEN_PLACEHOLDER}`
        : "";
    return `帮我接入一个 MCP server：
- 名称：${qs.serverName}
- 传输方式：${qs.transport}
- 地址：${qs.url ?? ""}${auth}
请把它加到我的 MCP 配置里并确认连接可用。`;
  }
  const args = (qs.args ?? []).join(" ");
  const env = qs.env
    ? "\n环境变量：" +
      Object.keys(qs.env)
        .map((k) =>
          /token|key|secret|password|pwd/i.test(k)
            ? `${k}=${TOKEN_PLACEHOLDER}`
            : `${k}=${qs.env?.[k] ?? ""}`
        )
        .join("，")
    : "";
  return `帮我接入一个本地（stdio）MCP server：
- 名称：${qs.serverName}
- 启动命令：${qs.command ?? "npx"} ${args}${env}
请把它加到我的 MCP 配置里并确认连接可用。`;
}

/**
 * Generate the three copy-ready tabs from the structured quick-start payload.
 * Order matters: 提示词 first (the default tab).
 */
export function buildQuickStartTabs(qs: McpQuickStart): QuickStartTab[] {
  return [
    {
      key: "prompt",
      labelKey: "prompt",
      content: buildPrompt(qs),
      lang: "text",
    },
    { key: "cli", labelKey: "cli", content: buildCli(qs), lang: "bash" },
    { key: "json", labelKey: "json", content: buildJson(qs), lang: "json" },
  ];
}
