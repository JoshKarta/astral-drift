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
      await ctx.db.insert("data", row);
    }
  },
});

export const run = internalAction({
  args: {},
  handler: async (ctx) => {
    for (let i = 0; i < TOTAL; i += BATCH_SIZE) {
      const size = Math.min(BATCH_SIZE, TOTAL - i);
      const rows = Array.from({ length: size }, () => ({
        man: faker.person.firstName("male"),
        woman: faker.person.firstName("female"),
        fruit: faker.food.fruit(),
        country: faker.location.country(),
        animal: faker.animal.type(),
      }));
      await ctx.runMutation(internal.seed.insertBatch, { rows });
    }
  },
});