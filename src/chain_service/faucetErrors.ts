import { SlackBlockkitMessage, SlackBlock } from "../slack_service/slack.js";
import { NetworkConfig } from "../config.js";
import { Config } from "../config.js";

export abstract class FaucetError extends Error {
  constructor(message: string) {
    super(message);
  }

  abstract serializeForSlack(): SlackBlockkitMessage;

  appendContext(network: NetworkConfig): SlackBlock[] {
    const context = `Encountered error when depositing new funds for network *'${network.name}'* \n`;

    return [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Faucet Service",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: context,
        },
      },
    ];
  }
}

export class NoFundsError extends FaucetError {
  config: Config;
  constructor(message: string, config: Config) {
    super(message);
    this.config = config;
    this.name = "InsufficientBalance Error";
    Object.setPrototypeOf(this, new.target.prototype);
  }

  serializeForSlack(): SlackBlockkitMessage {
    let context = this.appendContext(this.config.getNetwork());

    let errorBlock: SlackBlock = {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Error Name*: ${this.name}`,
        },
        {
          type: "mrkdwn",
          text: `*From Account*: ${this.config.getSenderPk()}`,
        },
        {
          type: "mrkdwn",
          text: `*Message*: ${this.message}`,
        },
      ],
    };

    return {
      blocks: [...context, errorBlock],
    };
  }
}

export class DispatchError extends FaucetError {
  section: string;
  method: string;
  config: Config;
  constructor(
    message: string,
    method: string,
    section: string,
    config: Config,
  ) {
    super(message);
    this.name = "DispatchError";
    this.config = config;
    this.section = section;
    this.method = method;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  serializeForSlack(): SlackBlockkitMessage {
    let context = this.appendContext(this.config.getNetwork());

    let errorBlock: SlackBlock = {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Error Name*: ${this.name}`,
        },
        {
          type: "mrkdwn",
          text: `*Error Section*: ${this.section}`,
        },
        {
          type: "mrkdwn",
          text: `*Error Method*: ${this.method}`,
        },
        {
          type: "mrkdwn",
          text: `*Message*: ${this.message}`,
        },
      ],
    };

    return {
      blocks: [...context, errorBlock],
    };
  }
}

export class AddressError extends Error {
  constructor(
    message: string,
    private account: string,
  ) {
    super(message);
  }
}
