import { ApiPromise, WsProvider } from "@polkadot/api";
import { Config, NetworkConfig } from "../config.js";

export type API = {
  api: ApiPromise;
  ss58Format: number;
};

class ApiManager {
  private apiInstanceDict: { [key: string]: API } = {};
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  private async connectApi(socketUrl: string): Promise<API> {
    const wsProvider = new WsProvider(socketUrl);
    const api = await ApiPromise.create({
      provider: wsProvider,
      noInitWarn: true,
    });

    const chainProperties = await api.registry.getChainProperties();
    const ss58Format = Number(
      chainProperties?.get("ss58Format").toString() ||
        this.config.getaddressPrefix(),
    );

    return { api, ss58Format };
  }

  public async populateApis(): Promise<void> {
    const network: NetworkConfig = this.config.getNetwork();

    console.log(`Connecting to node ${network.wss}...`);
    this.apiInstanceDict["network"] = await this.connectApi(network.wss);
    console.log(`Connected to node ${network.wss}`);
  }

  public async getApi(): Promise<API> {
    if (!this.apiInstanceDict["network"]) {
      await this.populateApis();
    }
    return this.apiInstanceDict["network"];
  }

  public async executeApiCall(apiCall: (apiCall: ApiPromise) => Promise<any>): Promise<any> {
    let apiInstance = await this.getApi();

    try {
        return await apiCall(apiInstance.api);
    } catch (initialError: any) {
      // Only retry if the error is regarding bad signature error
      if (initialError.name === "RpcError" && initialError.message.includes("Transaction has a bad signature")){
        console.log(`Error encountered, attempting to refresh the api...`);
        try {
            apiInstance = await this.connectApi(this.config.getNetwork().wss); 
            this.apiInstanceDict["network"] = apiInstance; 
            return await apiCall(apiInstance.api);
        } catch (retryError) {
            throw retryError;
        }

      }else{
        throw initialError;
      }
    }
  }
}

export { ApiManager, ApiPromise };
