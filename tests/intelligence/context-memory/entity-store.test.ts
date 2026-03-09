/**
 * Entity Store Tests
 */

import {
  EntityStore,
  getEntityStore,
} from "../../../src/intelligence/context-memory/entity-store";
import {
  initializeDatabase,
  closeDatabase,
} from "../../../src/automation/db/database";

describe("EntityStore", () => {
  let entityStore: EntityStore;

  beforeAll(async () => {
    await initializeDatabase(":memory:");
    entityStore = getEntityStore();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it("should track and retrieve entities", async () => {
    const entity = await entityStore.trackEntity(
      "repository",
      "test/repo",
      { language: "TypeScript" },
      ["testing"],
    );

    expect(entity).toBeDefined();
    expect(entity.type).toBe("repository");
    expect(entity.name).toBe("test/repo");

    const retrieved = await entityStore.getEntity(entity.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe(entity.id);
  });

  it("should create relationships", async () => {
    const entity1 = await entityStore.trackEntity("file", "a.ts", {}, []);
    const entity2 = await entityStore.trackEntity("file", "b.ts", {}, []);

    await entityStore.createRelationship(
      entity1.id,
      entity2.id,
      "depends_on",
      0.8,
    );

    const updated = await entityStore.getEntity(entity1.id);
    expect(updated!.context.relationships.length).toBeGreaterThan(0);
  });

  it("should get statistics", async () => {
    const stats = await entityStore.getStatistics();
    expect(stats).toHaveProperty("total_entities");
    expect(typeof stats.total_entities).toBe("number");
  });
});
