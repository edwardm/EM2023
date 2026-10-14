import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const portfolio = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/portfolio" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.string().or(z.date()).transform((val) => new Date(val)),
		updatedDate: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
		heroImage: z.string().optional(),
	}),
});

export const collections = { portfolio };
