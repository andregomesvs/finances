import "server-only";

import { PluggyClient } from "pluggy-sdk";
import { getPluggyEnv } from "@/config/env";

let client: PluggyClient | undefined;

export function getPluggyClient(): PluggyClient {
  if (!client) {
    const env = getPluggyEnv();
    client = new PluggyClient({
      clientId: env.PLUGGY_CLIENT_ID,
      clientSecret: env.PLUGGY_CLIENT_SECRET,
    });
  }

  return client;
}
