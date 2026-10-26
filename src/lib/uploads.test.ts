import { describe, expect, it } from "vitest";
import { decodeImagePayload, UploadError } from "./uploads";

describe("upload validation", () => {
  it("rejects non-images and oversized payloads", () => {
    expect(() => decodeImagePayload(Buffer.from("hi").toString("base64"), "text/plain")).toThrow(
      UploadError
    );
    const big = Buffer.alloc(10 * 1024 * 1024 + 10, 1).toString("base64");
    expect(() => decodeImagePayload(big, "image/jpeg")).toThrow(/exceeds/);
  });

  it("accepts a tiny jpeg and a data-url", () => {
    const b64 = Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString("base64");
    const decoded = decodeImagePayload(`data:image/png;base64,${b64}`, "image/jpeg");
    expect(decoded.mimeType).toBe("image/png");
    expect(decoded.buffer.length).toBe(4);
  });
});
