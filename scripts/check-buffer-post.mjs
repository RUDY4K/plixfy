import { getBufferPost } from "./buffer-client.mjs";

const postId = process.argv[2];
if (!/^[a-f0-9]{24}$/i.test(postId || "")) {
  throw new Error("Usage: node scripts/check-buffer-post.mjs <buffer-post-id>");
}

const post = await getBufferPost(postId);
if (!post) throw new Error(`Buffer post ${postId} was not found`);

console.log(JSON.stringify(post, null, 2));
if (post.status === "error") process.exitCode = 1;
