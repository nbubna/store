import { store } from "../setup";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("old extension", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("warns that the extension is deprecated on import", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await import("../../src/extensions/old");
    expect(warn).toHaveBeenCalledWith(
      "[store2/old] Deprecated: legacy IE storage polyfill unsupported in store2 3.x and will be removed in a future major release.",
    );
    expect(store).toBeTruthy();
  });
});
