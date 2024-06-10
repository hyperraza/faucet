import fs from "fs";
import path from "path";
import { Keyring } from "@polkadot/api";
export interface RateLimitConfig {
  rateLimitWindowMinutes: number;
  rateLimitMaxRequests: number;
  rateLimitNumberOfProxies: number;
}

export interface NetworkConfig {
  name: string;
  wss: string;
  addressPrefix: number;
  decimals: number;
  fundAmount: number;
  limitPerHour: number;
  minWaitTimeMinutes: number;
  slackWaitingTimeMinutes: number;
}

export interface ServiceConfig {
  network: NetworkConfig;
}

export class Config {
  private rateLimitConfig: RateLimitConfig;
  private substrateAccountSecret: string;
  private config: ServiceConfig;

  constructor(filePath: string) {
    this.config = this.loadConfig(filePath);

    this.rateLimitConfig = {
      rateLimitWindowMinutes: parseInt(
        process.env.RATE_LIMIT_WINDOW_MINUTES || "1",
      ),
      rateLimitMaxRequests: parseInt(
        process.env.RATE_LIMIT_MAX_REQUESTS || "60",
      ),
      rateLimitNumberOfProxies: parseInt(
        process.env.RATE_LIMIT_NUMBER_OF_PROXIES || "1",
      ),
    };
    this.substrateAccountSecret = process.env.SUBSTRATE_SECRET_PHRASE!;
    this.validateNetworkSecret();
  }

  public getRateLimitConfig(): RateLimitConfig {
    return this.rateLimitConfig;
  }

  public getSecret(): string {
    return this.substrateAccountSecret;
  }

  private loadConfig(filePath: string): ServiceConfig {
    try {
      const configPath = path.join(process.cwd(), filePath);
      const rawConfig = fs.readFileSync(configPath, "utf-8");
      return JSON.parse(rawConfig) as ServiceConfig;
    } catch (error) {
      console.error(`Failed to load configuration from ${filePath}:`, error);
      process.exit(1);
    }
  }

  private validateNetworkSecret() {
    if (!this.getSecret()) {
      throw new Error(
        `Account secret for network '${this.config.network.name}' is undefined`,
      );
    }
  }
  public getNetwork(): NetworkConfig {
    return this.config.network;
  }

  public getaddressPrefix(): number {
    return this.config.network.addressPrefix;
  }

  public getSenderPk(): string {
    const keyring = new Keyring({ type: "sr25519" });
    keyring.setSS58Format(this.getaddressPrefix());

    let sender = keyring.addFromUri(this.getSecret());
    return sender.address;
  }

  public getDecimals(): number {
    return this.config.network.decimals;
  }

  public getFundAmount(): number {
    return this.config.network.fundAmount;
  }

  public getLimitPerHour(): number {
    return this.config.network.limitPerHour;
  }

  public getWaitingTimeMinutes(): number {
    return this.config.network.minWaitTimeMinutes;
  }

  public getSlackWaitingTimeMinutes(): number {
    // we default to 8 hours (480 minutes)
    if (!this.config.network.slackWaitingTimeMinutes) {
      return 480;
    } else {
      return this.config.network.slackWaitingTimeMinutes;
    }
  }
}
