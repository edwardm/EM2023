import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { SITE_TITLE, SITE_DESCRIPTION } from "../consts";

export const GET: APIRoute = async ({ site }) => {
	if (!site) {
		throw new Error(
			"The Astro site URL is required to generate RSS links.",
		);
	}

	const posts = await getCollection("portfolio");
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site,
		items: posts.map((post) => ({
			...post.data,
			link: `/portfolio/${post.slug}/`,
		})),
	});
};
