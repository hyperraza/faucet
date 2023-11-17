import dotenv from "dotenv";
import { Config } from "./config.js";
import ExpressConfig from "./express/express.config.js";
import { ApiManager } from "./chain_service/api.js";
import Faucet from "./chain_service/faucet.js";
import { AddressError, RateError } from "./chain_service/faucetErrors.js";
import { SlackNotifier } from "./slack_service/slack.js";

dotenv.config();
const PORT = process.env.PORT || 3000;

// Load base config and initializations
const config = new Config("config.json");
const apiManager = new ApiManager(config);
const slackNotifier = new SlackNotifier();
const faucet = new Faucet(config, slackNotifier, apiManager);
await faucet.init();
const app = ExpressConfig(config.getRateLimitConfig());

// fund route
app.get("/fund", async (req, res) => {
  let { to } = req.query;

  if (!to) {
    return res.status(400).send("Must provide a valid address");
  }

  try {
    await faucet.send(String(to));
  } catch (error) {
    if (error instanceof AddressError) {
      return res
        .status(400)
        .send(`Error sending to address ${error.address}: <br /> ${error.message}`);
    } else if (error instanceof RateError) {
      return res
        .status(400)
        .send(
          `Address has reached the limit, plase try again in ${error.remaining}`,
        );
    } else {
        return res.status(500).send("Server Error. Please try again later");
    }
  }

  return res.sendStatus(200);
});

app.listen(PORT, () => console.log("Server Running on Port " + PORT));
