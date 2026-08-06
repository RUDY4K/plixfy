import { loadEnvLocal } from "./telegram-client.mjs";
import { discoverBufferChannels } from "./buffer-client.mjs";

loadEnvLocal();

try {
  const { organization, channels } = await discoverBufferChannels();
  console.log(`Buffer organization: ${organization.name} (${organization.id})`);
  if (channels.length === 0) {
    console.log("No social channels are connected yet.");
  } else {
    for (const channel of channels) {
      console.log(
        `${channel.service}: ${channel.displayName || channel.name} (${channel.id})` +
          `${channel.isDisconnected ? " [disconnected]" : ""}` +
          `${channel.isLocked ? " [locked]" : ""}`,
      );
    }
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
