import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  getCategories,
  getSkills,
  getMySkills,
  getSkill,
  deleteSkill,
} from "./skillApiReal";

// Mock global fetch
const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve({
    status,
    json: () => Promise.resolve({ code: 0, data }),
  });
}

describe("skillApiReal", () => {
  it("getCategories maps snake_case to camelCase", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse([
        { id: "dev-tools", name: "开发工具", icon_key: "Terminal", skill_count: 6 },
        { id: "starter", name: "装机必备", icon_key: "Box", skill_count: 3 },
      ]),
    );

    const categories = await getCategories();

    expect(categories).toEqual([
      { id: "dev-tools", name: "开发工具", iconKey: "Terminal", sortOrder: 1, skillCount: 6 },
      { id: "starter", name: "装机必备", iconKey: "Box", sortOrder: 2, skillCount: 3 },
    ]);
    expect(mockFetch).toHaveBeenCalledWith(
      "/market/api/v1/skill/categories",
      expect.objectContaining({ headers: expect.objectContaining({ "Content-Type": "application/json" }) }),
    );
  });

  it("getSkills maps paged result and passes query params", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({
        items: [
          {
            id: "ci-failure-map",
            name: "ci-failure-map",
            description: "Analyze CI logs",
            category_id: "dev-tools",
            tags: ["CI"],
            owner_id: "jian",
            owner_name: "jian",
            space_id: "dev-space",
            visibility: "space",
            version: "1.0.2",
            readme_content: "# ci-failure-map",
            file_name: "ci-failure-map.zip",
            file_url: "http://localhost/files/ci.zip",
            file_size: 1024,
            file_sha256: "abc123",
            created_at: "2026-06-01T00:00:00Z",
            updated_at: "2026-07-10T00:00:00Z",
          },
        ],
        next_cursor: "abc",
      }),
    );

    const result = await getSkills({ q: "CI", categoryId: "dev-tools", limit: 10 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].categoryId).toBe("dev-tools");
    expect(result.items[0].fileSha256).toBe("abc123");
    expect(result.nextCursor).toBe("abc");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/market/api/v1/skill?"),
      expect.anything(),
    );
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("q=CI");
    expect(url).toContain("category_id=dev-tools");
    expect(url).toContain("limit=10");
  });

  it("getMySkills calls /skill/mine endpoint", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ items: [], next_cursor: null }),
    );

    const result = await getMySkills({ q: "test" });

    expect(result.items).toEqual([]);
    expect(result.nextCursor).toBeNull();
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/market/api/v1/skill/mine");
    expect(url).toContain("q=test");
  });

  it("getSkill maps a single skill", async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({
        id: "test-skill",
        name: "Test",
        description: "desc",
        category_id: "other",
        tags: ["a"],
        owner_id: "u1",
        owner_name: "User",
        space_id: "s1",
        visibility: "public",
        version: "1.0.0",
        readme_content: "# Test",
        file_name: "test.zip",
        file_url: "/files/test.zip",
        file_size: 512,
        file_sha256: "def456",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-02T00:00:00Z",
      }),
    );

    const skill = await getSkill("test-skill");

    expect(skill.id).toBe("test-skill");
    expect(skill.categoryId).toBe("other");
    expect(skill.readmeContent).toBe("# Test");
    expect(skill.fileSha256).toBe("def456");
  });

  it("deleteSkill handles 204 response", async () => {
    mockFetch.mockReturnValueOnce(
      Promise.resolve({ status: 204, json: () => Promise.resolve({}) }),
    );

    await expect(deleteSkill("some-id")).resolves.toBeUndefined();
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/market/api/v1/skill/some-id");
  });

  it("throws ApiError on non-zero code", async () => {
    mockFetch.mockReturnValueOnce(
      Promise.resolve({
        status: 404,
        json: () => Promise.resolve({ code: "err.marketplace.not_found", message: "not found" }),
      }),
    );

    await expect(getSkill("nonexistent")).rejects.toThrow("not found");
  });
});
