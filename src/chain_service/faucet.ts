import { Keyring } from "@polkadot/api";
import { checkAddress, cryptoWaitReady } from "@polkadot/util-crypto";
import BN from "bn.js";
import { ApiManager } from "./api.js";
import { Config } from "../config.js";
import {
  AddressError,
  DispatchError,
  NoFundsError,
  RateError,
  RpcSinkError,
} from "./faucetErrors.js";
import { SlackNotifier } from "../slack_service/slack.js";

export default class Faucet {
  private config: Config;
  private apiManager: ApiManager;
  private fundMap: Map<string, number[]>;
  private slackNotifier: SlackNotifier;

  constructor(
    config: Config,
    slackNotifier: SlackNotifier,
    apiManager: ApiManager,
  ) {
    this.config = config;
    this.apiManager = apiManager;
    this.slackNotifier = slackNotifier;
    this.fundMap = new Map<string, number[]>();
  }

  // Populate api's in the apiManager
  async init() {
    await this.apiManager.getApi();
  }

  async send(address: string) {
    return new Promise<string>(async (resolve, reject) => {
      // Waiting for crypto library to be ready
      await cryptoWaitReady();

      // Reject early if the address has an incorrect format
      // or limit has been hit
      const check = checkAddress(address, this.config.getaddressPrefix());
      if (!check[0]) {
        return reject(
          new AddressError(
            `Invalid address! The expected SS58 address prefix used for encoding ${this.config.getaddressPrefix()}, visit https://github.com/paritytech/substrate/blob/e232d78dd5bafa3bbaae9ac9db08f99e238392db/primitives/core/src/crypto.rs#L444 for reference`,
            address,
          ),
        );
      }
      // Handle limits
      let remainingTime = this.isAddressAllowed(address);
      if (remainingTime) {
        return reject(
          new RateError(`Address ${address} has reached limit`, remainingTime),
        );
      }
      this.addFundEvent(address);

      // Derive sender object from secret
      const keyring = new Keyring({ type: "sr25519" });
      keyring.setSS58Format(this.config.getaddressPrefix());

      let sender;
      try {
        sender = keyring.addFromUri(this.config.getSecret());
      } catch {
        return reject(`Service Error: Invalid Mnemonic`);
      }

      let nonce = await this.apiManager.executeApiCall(async (api) => api.rpc.system.accountNextIndex(sender.publicKey));
      const padding = new BN(10).pow(new BN(this.config.getDecimals()));
      const amount = new BN(this.config.getFundAmount()).mul(padding);
      const tx = await this.apiManager.executeApiCall(async (api) =>
        api.tx.balances
        .transferKeepAlive(address, amount)
        .signAndSend(sender, { nonce }, (submissionResult: any) =>
          this.onSubmissionResultHandler(submissionResult, resolve, reject),
        ))
        .catch((error: any) => {
          this.checkLackOfFunds(error);
          this.removeLatestFundEvent(address);
          reject();
        });
    });
  }

  private async onSubmissionResultHandler(
    submissionResult: any,
    resolve: any,
    reject: any,
  ) {
    const { status, events, dispatchError } = submissionResult;

    if (status.isFinalized) {
      if (dispatchError) {
        this.handleDispatchError(dispatchError);
        return reject();
      }
      resolve();
    }
  }

  private addFundEvent(address: string) {
    const now = Date.now();
    if (!this.fundMap.has(address)) {
      this.fundMap.set(address, []);
    }
    this.fundMap.get(address)!.push(now);
  }

  private removeLatestFundEvent(address: string) {
    this.fundMap.get(address)!.pop();
  }

  // either return undefined if address is allowed, or a number
  // representing the amount of seconds the address needs to wait
  // for being refunded
  private isAddressAllowed(address: string): number | undefined {
    const now = Date.now();
    if (!this.fundMap.has(address)) return undefined;

    // filter the last hour fundings for address
    const recentFundings = this.fundMap
      .get(address)!
      .filter((timestamp) => now - timestamp <= 60 * 60 * 1000);

    // check amount of fundings per hour
    if (recentFundings.length >= this.config.getLimitPerHour()) {
      let lastFund = recentFundings[0];
      let timePassedSinceLastFund = now - lastFund;
      let remainingTimeNextFundMilisec =
        60 * 60 * 1000 - timePassedSinceLastFund;
      return remainingTimeNextFundMilisec / 1000;
    }

    // check the waiting time
    let timeSinceLastFund = recentFundings[recentFundings.length - 1];
    if (
      now - timeSinceLastFund <
      this.config.getWaitingTimeMinutes() * 60 * 1000
    ) {
      let timePassedSinceLastFund = now - timeSinceLastFund;
      let remainingTimeNextFundMilisec =
        this.config.getWaitingTimeMinutes() * 60 * 1000 -
        timePassedSinceLastFund;
      return remainingTimeNextFundMilisec / 1000;
    }
    this.fundMap.set(address, recentFundings); // Update the map with only recent occurrences
    return undefined;
  }

  private async handleDispatchError(dispatchError: any) {
    if (dispatchError?.isModule) {
      const decoded =  (await this.apiManager.getApi()).api.registry.findMetaError(dispatchError.asModule);
      const { docs, name, section, method } = decoded;

      console.log(
        "\x1b[31m%s\x1b[0m",
        "🚫 Dispatch Error: ",
        `Method: ${method}`,
        `Section: ${section}`,
      );

      if (name === "InsufficientBalance") {
        return this.registerLackOfFundsEvent();
      }

      // Otherwise we just send a generic dispatch error message
      // to slack
      let error = new DispatchError(
        "A dispatch error occurred when funding",
        method,
        section,
        this.config,
      );
      this.slackNotifier.pushError(error);
    } else {
      console.log(
        "\x1b[31m%s\x1b[0m",
        "🚫 Encountered some other error: ",
        dispatchError?.toString(),
        JSON.stringify(dispatchError),
      );

      let error = new DispatchError(
        "An unknown dispatch error occurred when funding",
        "Unknown",
        "Unknown",
        this.config,
      );
      this.slackNotifier.pushError(error);
    }
  }

  private checkLackOfFunds(error: any) {
    if (error.name === "RpcError" && error.message.includes("Inability to pay some fees")){
        this.registerLackOfFundsEvent();
    }else{
        console.log(
          "\x1b[31m",
          "🚫 Encountered some other error: ",
          error?.toString(),
          JSON.stringify(error),
        );
        let slackError = new RpcSinkError(
          error.message,
          this.config,
        );
        this.slackNotifier.pushError(slackError);
    }
  }

  private async registerLackOfFundsEvent() {
    let error = new NoFundsError(
      "The faucet account does not have enough funds",
      this.config,
    );
    this.slackNotifier.pushError(error);
  }
}
