import type { Page, PromptyClient } from "@prompty-tools/core";
import { vi, type Mock } from "vitest";

type ResourceStub = Record<string, Mock>;

export interface ClientStub {
  prompts: ResourceStub;
  personas: ResourceStub;
  tones: ResourceStub & { collections: ResourceStub };
  outputs: ResourceStub;
  constraints: ResourceStub & { collections: ResourceStub };
  libraries: ResourceStub;
}

function entityStub(): ResourceStub {
  return {
    list: vi.fn(),
    listAll: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    vote: vi.fn(),
    unvote: vi.fn(),
    toggleFavorite: vi.fn(),
    setVisibility: vi.fn(),
    listVersions: vi.fn(),
    getVersion: vi.fn(),
  };
}

function collectionsStub(): ResourceStub {
  return {
    list: vi.fn(),
    listAll: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    vote: vi.fn(),
    unvote: vi.fn(),
    toggleFavorite: vi.fn(),
    listItems: vi.fn(),
    setItems: vi.fn(),
  };
}

export function createClientStub(): { stub: ClientStub; client: PromptyClient } {
  const stub: ClientStub = {
    prompts: entityStub(),
    personas: entityStub(),
    tones: Object.assign(entityStub(), { collections: collectionsStub() }),
    outputs: entityStub(),
    constraints: Object.assign(entityStub(), { collections: collectionsStub() }),
    libraries: {
      ...entityStub(),
      listPrompts: vi.fn(),
      listAllPrompts: vi.fn(),
      addPrompt: vi.fn(),
      removePrompt: vi.fn(),
    },
  };
  return { stub, client: stub as unknown as PromptyClient };
}

export function fakePage<T>(
  items: readonly T[],
  overrides: Partial<Pick<Page<T>, "total" | "page" | "pageSize" | "hasNext" | "hasPrev">> = {},
): Page<T> {
  return {
    items,
    total: overrides.total ?? items.length,
    page: overrides.page ?? 1,
    pageSize: overrides.pageSize ?? 12,
    hasNext: overrides.hasNext ?? false,
    hasPrev: overrides.hasPrev ?? false,
    next: () => Promise.reject(new RangeError("no next page")),
    prev: () => Promise.reject(new RangeError("no previous page")),
  };
}
