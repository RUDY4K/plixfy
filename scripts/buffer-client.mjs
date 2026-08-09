const BUFFER_ENDPOINT = "https://api.buffer.com";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RETRIES = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function apiKey() {
  const value = process.env.BUFFER_API_KEY || process.env.BUFFER_ACCESS_TOKEN;
  if (!value) throw new Error("BUFFER_API_KEY is not set");
  // Clipboard and Windows shell pipelines can inject a BOM or another invisible
  // Unicode character into secrets. Authorization headers only accept visible ASCII.
  return value.replace(/[^\x21-\x7E]/g, "");
}

async function graphql(query, variables = {}) {
  let lastError;

  for (let attempt = 1; attempt <= DEFAULT_RETRIES; attempt += 1) {
    try {
      const response = await fetch(BUFFER_ENDPOINT, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey()}`,
          "content-type": "application/json",
          "user-agent": "PlixfyCloudSocial/2.0",
        },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok && !body.errors?.length) return body.data;

      const description =
        body.errors?.map((error) => error.message).filter(Boolean).join("; ") ||
        `HTTP ${response.status}`;
      lastError = new Error(`Buffer API failed: ${description}`);
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === DEFAULT_RETRIES) break;
    } catch (error) {
      lastError = error;
      if (attempt === DEFAULT_RETRIES) break;
    }
    await sleep(attempt * 1_500);
  }

  throw lastError || new Error("Buffer API returned no usable response");
}

export function isBufferConfigured() {
  return Boolean(process.env.BUFFER_API_KEY || process.env.BUFFER_ACCESS_TOKEN);
}

export async function getBufferOrganizations() {
  const data = await graphql(`
    query GetOrganizations {
      account {
        organizations {
          id
          name
          ownerEmail
        }
      }
    }
  `);
  return data?.account?.organizations || [];
}

export async function getBufferChannels(organizationId) {
  const data = await graphql(
    `
      query GetChannels($organizationId: OrganizationId!) {
        channels(input: { organizationId: $organizationId }) {
          id
          name
          displayName
          service
          isDisconnected
          isLocked
          isQueuePaused
        }
      }
    `,
    { organizationId },
  );
  return data?.channels || [];
}

export async function discoverBufferChannels() {
  const organizations = await getBufferOrganizations();
  if (organizations.length === 0) throw new Error("Buffer account has no organization");

  const requestedId = process.env.BUFFER_ORGANIZATION_ID;
  const organization =
    organizations.find((candidate) => candidate.id === requestedId) || organizations[0];
  const channels = await getBufferChannels(organization.id);
  return { organization, channels };
}

export function mapChannelsByPlatform(channels) {
  const serviceToPlatform = {
    twitter: "x",
    x: "x",
    facebook: "facebook",
    instagram: "instagram",
    tiktok: "tiktok",
    youtube: "youtube",
    bluesky: "bluesky",
  };
  const result = {};
  for (const channel of channels) {
    if (channel.isDisconnected || channel.isLocked) continue;
    const platform = serviceToPlatform[String(channel.service || "").toLowerCase()];
    if (platform && !result[platform]) result[platform] = channel;
  }

  const overrides = {
    x: process.env.BUFFER_X_CHANNEL_ID || process.env.BUFFER_TWITTER_CHANNEL_ID,
    facebook: process.env.BUFFER_FACEBOOK_CHANNEL_ID,
    instagram: process.env.BUFFER_INSTAGRAM_CHANNEL_ID,
    tiktok: process.env.BUFFER_TIKTOK_CHANNEL_ID,
    youtube: process.env.BUFFER_YOUTUBE_CHANNEL_ID,
  };
  for (const [platform, id] of Object.entries(overrides)) {
    if (!id) continue;
    const channel = channels.find((candidate) => candidate.id === id);
    if (channel) result[platform] = channel;
  }
  return result;
}

export function buildBufferPostInput({ channelId, platform, text, image, title }) {
  const input = {
    channelId,
    text,
    schedulingType: "automatic",
    mode: process.env.BUFFER_SHARE_MODE || "shareNow",
    source: "plixfy-cloud-social",
  };
  if (image) input.assets = [{ image: { url: image } }];
  if (platform === "facebook") {
    input.metadata = { facebook: { type: "post" } };
  } else if (platform === "instagram") {
    input.metadata = {
      instagram: { type: "post", shouldShareToFeed: true, isAiGenerated: false },
    };
  } else if (platform === "tiktok") {
    input.metadata = { tiktok: { title: String(title || text).slice(0, 90) } };
  }
  return input;
}

export async function publishBufferPost({ channelId, platform, text, image, title }) {
  const input = buildBufferPostInput({ channelId, platform, text, image, title });

  const data = await graphql(
    `
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          __typename
          ... on PostActionSuccess {
            post {
              id
              status
              dueAt
            }
          }
          ... on MutationError {
            message
          }
        }
      }
    `,
    { input },
  );
  const payload = data?.createPost;
  if (!payload?.post?.id) {
    throw new Error(`Buffer rejected ${platform} post: ${payload?.message || payload?.__typename || "unknown error"}`);
  }
  return payload.post;
}
