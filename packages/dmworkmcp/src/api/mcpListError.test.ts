import { describe, expect, it } from "vitest";
import { classifyMcpListError } from "./mcpListError";

describe("classifyMcpListError", () => {
  it.each([[401, "auth"], [403, "forbidden"], [500, "server"], [503, "server"]])("maps http %s", (status, expected) => {
    expect(classifyMcpListError({ response: { status } })).toBe(expected);
  });
  it("maps network errors without a response", () => {
    expect(classifyMcpListError({ code: "ERR_NETWORK" })).toBe("network");
  });
});
