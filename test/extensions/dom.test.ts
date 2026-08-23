import { store } from "../setup";
import "../../src/extensions/dom";
import { beforeEach, describe, expect, it } from "vitest";

describe("dom extension", () => {
  beforeEach(() => {
    store.clearAll();
    document.body.innerHTML = "";
  });

  it("exposes the dom helper on developer tools", () => {
    expect(typeof store._.dom).toBe("function");
    expect(store._.dom.selector).toBe("[store],[store-area]");
  });

  it("binds inputs using store and name attributes", () => {
    const input = document.createElement("input");
    input.setAttribute("store", "username");
    document.body.appendChild(input);

    store._.dom.node(input);
    expect(input.value).toBe("");

    input.value = "alice";
    input.dispatchEvent(new Event("input"));
    expect(store.get("username")).toBe("alice");
  });

  it("restores stored values into the element", () => {
    const input = document.createElement("input");
    input.setAttribute("name", "email");
    document.body.appendChild(input);
    store.set("email", "a@b.c");

    store._.dom.node(input);
    expect(input.value).toBe("a@b.c");
  });

  it("uses alternate storage areas via store-area", () => {
    const input = document.createElement("input");
    input.setAttribute("store", "token");
    input.setAttribute("store-area", "session");
    document.body.appendChild(input);

    store._.dom.node(input);
    input.value = "secret";
    input.dispatchEvent(new Event("input"));
    expect(store.session.get("token")).toBe("secret");
  });

  it("initializes all matching nodes when invoked", () => {
    const one = document.createElement("input");
    one.setAttribute("store", "one");
    const two = document.createElement("input");
    two.setAttribute("store", "two");
    document.body.append(one, two);

    const nodes = store._.dom();
    expect(nodes).toHaveLength(2);
    one.value = "1";
    one.dispatchEvent(new Event("input"));
    two.value = "2";
    two.dispatchEvent(new Event("input"));
    expect(store.get("one")).toBe("1");
    expect(store.get("two")).toBe("2");
  });

  it("derives keys from node name and writes non-input content", () => {
    const block = document.createElement("div");
    document.body.appendChild(block);

    expect(store._.dom.key(block)).toBe("dom.div");
    expect(store._.dom.key(block, 2)).toBe("dom.div2");
    store._.dom.set(block, "plain");
    expect(block.innerHTML).toBe("plain");
    store._.dom.set(block, { text: "hello" });
    expect(block.innerHTML).toBe('{"text":"hello"}');
  });
});
