import { KnownBlock, Block } from "@slack/types";
import { FaucetError } from "../chain_service/faucetErrors.js";

export type SlackBlock = KnownBlock | Block;

export interface SlackBlockkitMessage {
  blocks?: SlackBlock[];
}

export class SlackNotifier {
  private webhookUrl: string;
  private errorTimestamps: Map<string, number>;

  constructor() {
    if (process.env.SLACK_WEB_HOOK_TOKEN) {
      this.webhookUrl = `https://hooks.slack.com/services/${process.env.SLACK_WEB_HOOK_TOKEN}`;
    } else {
      throw new Error("SLACK_WEB_HOOK_TOKEN is not defined");
    }

    this.errorTimestamps = new Map<string, number>();
  }

  // We don't want to spam the slack channel, so we send errors only if some interval
  // of time has passed since the last time the same error instance was sent.
  async pushError(error: FaucetError) {
    const now = Date.now();
    const errorKey = error.constructor.name;
    const lastHandled = this.errorTimestamps.get(errorKey) || 0;
    const timeSinceLastHandled = now - lastHandled;

    //8 hour waiting time
    if (timeSinceLastHandled >= 480 * 60 * 1000) {
      this.sendMessage(error.serializeForSlack());
      this.errorTimestamps.set(errorKey, now);
    }
  }

  async sendMessage(message: SlackBlockkitMessage): Promise<void> {
    const payload = JSON.stringify(message);

    const response = await fetch(this.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
    });

    if (!response.ok) {
      throw new Error(`Failed to send message. Status: ${response.status}`);
    }
  }
}
