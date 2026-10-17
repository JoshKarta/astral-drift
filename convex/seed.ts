import { faker } from "@faker-js/faker/locale/en";
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const TOTAL = 3000;
const BATCH_SIZE = 500;

export const insertBatch = internalMutation({
  args: {
    rows: v.array(
      v.object({
        man: v.string(),
        woman: v.string(),
        fruit: v.string(),
        country: v.string(),
        animal: v.string(),
      })
    ),
  },
  handler: async (ctx, { rows }) => {
    for (const row of rows) {
      await ctx.db.insert("data", {
        man: row.man.trim().toLowerCase(),
        woman: row.woman.trim().toLowerCase(),
        fruit: row.fruit.trim().toLowerCase(),
        country: row.country.trim().toLowerCase(),
        animal: row.animal.trim().toLowerCase(),
      });
    }
  },
});

export const run = internalAction({
  args: {},
  handler: async (ctx) => {
    for (let i = 0; i < TOTAL; i += BATCH_SIZE) {
      const size = Math.min(BATCH_SIZE, TOTAL - i);
      const rows = Array.from({ length: size }, () => ({
        man: faker.person.firstName("male").toLowerCase(),
        woman: faker.person.firstName("female").toLowerCase(),
        fruit: faker.food.fruit().toLowerCase(),
        country: faker.location.country().toLowerCase(),
        animal: faker.animal.type().toLowerCase(),
      }));
      await ctx.runMutation(internal.seed.insertBatch, { rows });
    }
  },
});

// Mutation to normalize a batch of existing data
export const normalizeDataBatch = internalMutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { cursor, limit = 500 }) => {
    const pagination = await ctx.db
      .query("data")
      .paginate({ cursor: cursor ?? null, numItems: limit });

    let updatedCount = 0;
    for (const doc of pagination.page) {
      const lowerMan = doc.man.trim().toLowerCase();
      const lowerWoman = doc.woman.trim().toLowerCase();
      const lowerFruit = doc.fruit.trim().toLowerCase();
      const lowerCountry = doc.country.trim().toLowerCase();
      const lowerAnimal = doc.animal.trim().toLowerCase();

      if (
        doc.man !== lowerMan ||
        doc.woman !== lowerWoman ||
        doc.fruit !== lowerFruit ||
        doc.country !== lowerCountry ||
        doc.animal !== lowerAnimal
      ) {
        await ctx.db.patch(doc._id, {
          man: lowerMan,
          woman: lowerWoman,
          fruit: lowerFruit,
          country: lowerCountry,
          animal: lowerAnimal,
        });
        updatedCount++;
      }
    }

    return {
      continueCursor: pagination.continueCursor,
      isDone: pagination.isDone,
      updatedCount,
      processedCount: pagination.page.length,
    };
  },
});

// Action to run all batches until the entire table is normalized to lowercase
export const normalizeExistingData = internalAction({
  args: {},
  handler: async (ctx) => {
    let cursor: string | null = null;
    let isDone = false;
    let totalUpdated = 0;
    let totalProcessed = 0;

    while (!isDone) {
      const result: {
        continueCursor: string;
        isDone: boolean;
        updatedCount: number;
        processedCount: number;
      } = await ctx.runMutation(internal.seed.normalizeDataBatch, {
        cursor,
        limit: 500,
      });

      totalUpdated += result.updatedCount;
      totalProcessed += result.processedCount;
      cursor = result.continueCursor;
      isDone = result.isDone;
    }

    console.log(
      `Normalization complete: processed ${totalProcessed} rows, updated ${totalUpdated} rows to lowercase.`
    );
    return { totalProcessed, totalUpdated };
  },
});