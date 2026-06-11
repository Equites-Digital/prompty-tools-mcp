import type { Page, PromptyClient } from "@prompty-tools/core";
import { vi, type Mock } from "vitest";

export interface EntityStub {
  list: Mock;
  listAll: Mock;
  get: Mock;
  create: Mock;
  update: Mock;
  delete: Mock;
  vote: Mock;
  unvote: Mock;
  toggleFavorite: Mock;
  setVisibility: Mock;
  listVersions: Mock;
  getVersion: Mock;
}

export interface CollectionsStub {
  list: Mock;
  listAll: Mock;
  get: Mock;
  create: Mock;
  update: Mock;
  delete: Mock;
  vote: Mock;
  unvote: Mock;
  toggleFavorite: Mock;
  listItems: Mock;
  setItems: Mock;
}

export interface LibrariesStub extends EntityStub {
  listPrompts: Mock;
  listAllPrompts: Mock;
  addPrompt: Mock;
  removePrompt: Mock;
}

export interface ClientStub {
  prompts: EntityStub;
  personas: EntityStub;
  tones: EntityStub & { collections: CollectionsStub };
  outputs: EntityStub;
  constraints: EntityStub & { collections: CollectionsStub };
  libraries: LibrariesStub;
}

function entityStub(): EntityStub {
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

function collectionsStub(): CollectionsStub {
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
