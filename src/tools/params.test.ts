import { API_PAGE_SIZES, VERSION_PAGE_SIZES } from "@prompty-tools/core";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  listParamsShape,
  toListParams,
  toVersionListParams,
  versionListParamsShape,
} from "./params.js";

const listSchema = z.object(listParamsShape);
const versionListSchema = z.object(versionListParamsShape);

describe("listParamsShape", () => {
  it("accepts exactly the page sizes the platform accepts", () => {
    for (const pageSize of API_PAGE_SIZES) {
      expect(listSchema.parse({ pageSize })).toEqual({ pageSize });
    }
    expect(() => listSchema.parse({ pageSize: 13 })).toThrowError();
  });

  it("accepts an empty object (all fields optional)", () => {
    expect(listSchema.parse({})).toEqual({});
  });

  it("rejects unknown scopes, sorts, and overlong searches", () => {
    expect(() => listSchema.parse({ scope: "everyone" })).toThrowError();
    expect(() => listSchema.parse({ sort: "oldest" })).toThrowError();
    expect(() => listSchema.parse({ search: "x".repeat(201) })).toThrowError();
  });

  it("rejects non-positive and fractional pages", () => {
    expect(() => listSchema.parse({ page: 0 })).toThrowError();
    expect(() => listSchema.parse({ page: 1.5 })).toThrowError();
  });
});

describe("versionListParamsShape", () => {
  it("accepts exactly the version page sizes the platform accepts", () => {
    for (const pageSize of VERSION_PAGE_SIZES) {
      expect(versionListSchema.parse({ pageSize })).toEqual({ pageSize });
    }
    expect(() => versionListSchema.parse({ pageSize: 12 })).toThrowError();
  });
});

describe("toListParams", () => {
  it("returns an empty object when no fields are set", () => {
    expect(toListParams({})).toEqual({});
  });

  it("copies every provided field and omits absent ones", () => {
    expect(
      toListParams({
        page: 2,
        pageSize: 24,
        sort: "most-upvoted",
        scope: "mine",
        search: "react",
        tag: "frontend",
      }),
    ).toEqual({
      page: 2,
      pageSize: 24,
      sort: "most-upvoted",
      scope: "mine",
      search: "react",
      tag: "frontend",
    });
    expect(Object.keys(toListParams({ page: 3 }))).toEqual(["page"]);
  });
});

describe("toVersionListParams", () => {
  it("copies provided fields and omits absent ones", () => {
    expect(toVersionListParams({})).toEqual({});
    expect(toVersionListParams({ page: 2, pageSize: 50 })).toEqual({ page: 2, pageSize: 50 });
  });
});
