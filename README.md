## Service Description

This simple API allows users to be funded with native token of the connected network.
The secret of an account with funds is passed as environment variable. When a user requests funds,
a transaction from the balances pallet is made to the user's address.

In order to use the faucet, make a GET request to `/fund?to={your-public-address}`, which will trigger
the transaction and respond to the user if the funding was successful.

## Rate limiting

An address can only be funded X times every 60 minutes, where it must also wait for Y minutes between
each funding. Both values can be configured in `config.json` by setting `limitPerHour` and `minWaitTimeMinutes`
respectively.
Alternatively, the requests per IP can be configured by `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_MINUTES`.

## Error handling

If an error arises during the transfer (like a lack of funds from the sender's account), a message
will be sent to the corresponding slack channel specified via environment.
To avoid sending multiple messages, only one type of error will be sent every period of time,
here defined as 8 hours.

## Environment variables:

### Mandatory

- `SLACK_WEB_HOOK_TOKEN` - Slack web hook token for error reporting.
- `SUBSTRATE_SECRET_PHRASE` - Substrate account secret used by the service to fund user's account.

### Optional

- `PORT` - Defaults to `3000`.
- `RATE_LIMIT_WINDOW_MINUTES` - Rate limit window in minutes. Defaults to `1`.
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per rate limit window. Defaults to `60`.
- `RATE_LIMIT_NUMBER_OF_PROXIES` - Allowed number of proxies in front of the service. Defaults to `1`.

### Develop locally

If you want to develop frontend

1. go to /interface
2. run `yarn dev`

If you want to develop both frontend and backend

1. in /interface run `yarn build`
2. in the main directory run `yarn dev`
