import { describe, expect, it } from "vitest";
import { AuthError, authenticate, loadApiKeys } from "../src/auth.js";

describe("API-key authentication", () => {
  it("maps a key to a user and accepts bearer auth", () => {
    const keys = loadApiKeys("secret:user-a");
    expect(authenticate({ authorization: "Bearer secret" }, keys).userId).toBe("user-a");
  });

  it("rejects unknown keys", () => {
    expect(() => authenticate({ "x-api-key": "wrong" }, loadApiKeys("secret:user-a"))).toThrow(AuthError);
  });
});