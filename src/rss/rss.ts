import { XMLParser } from "fast-xml-parser";
import { getNextFeedToFetch, markFeedFetched } from "../db/queries/feeds.js";
import { duration } from "drizzle-orm/gel-core";

type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export const fetchFeed = async (feedURL: string): Promise<RSSFeed> => {
  let headers = new Headers({
    "User-Agent": "gator",
  });

  try {
    const respone = await fetch(feedURL, {
      method: "Get",
      headers,
    });

    if (!respone.ok) {
      throw new Error(`Fetch failed ${respone.status}`);
    }

    const data = await respone.text();

    const feedParse = new XMLParser({
      processEntities: false,
    });

    const feedData = feedParse.parse(data).rss;

    if (!Object.hasOwn(feedData, "channel")) {
      throw new Error("Channel doesn't exist");
    }

    let { title, link, description, item } = feedData.channel;

    const requiredFields = { title, link, description };

    // Entries return array
    for (const [key, value] of Object.entries(requiredFields)) {
      if (value === undefined) {
        throw new Error(`Missing required field: ${key}`);
      }
    }

    if (!Array.isArray(item)) {
      item = [];
    }

    const rss: RSSItem[] = [];

    for (const fields of item) {
      if (!isRSSItem(fields)) continue;
      rss.push(fields);
    }

    const result = {
      channel: {
        title,
        link,
        description,
        item: rss,
      },
    };

    return result;
  } catch (e) {
    console.error("Something wrong ", e);
    throw e;
  }
};

function isRSSItem(fields: unknown): fields is RSSItem {
  if (typeof fields !== "object" || fields === null) {
    return false;
  }

  const item = fields as Record<string, unknown>;

  return (
    typeof item.title === "string" &&
    item.title.trim() !== "" &&
    typeof item.link === "string" &&
    item.link.trim() !== "" &&
    typeof item.description === "string" &&
    item.description.trim() !== "" &&
    typeof item.pubDate === "string" &&
    item.pubDate.trim() !== ""
  );
}

export const scrapeFeeds = async () => {
  // get the next feed
  const nextFeed = await getNextFeedToFetch();

  const result = await fetchFeed(nextFeed.url);

  // Mark it as fetched
  await markFeedFetched(nextFeed.id);

  // print the titles
  console.log("Titles: ");
  for (const item of result.channel.item) {
    console.log(`- ${item.title}`);
  }

  console.log("---------------------------------------");
};
