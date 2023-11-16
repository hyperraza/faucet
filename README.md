## Service Description

This simple API allows users to be funded with native token of the connected network.
The secret of an account with funds is passed as environment variable. When a user request funds,
a transaction from the balances pallet is made to the user's address.

## Error handling

If an error arises during the transfer (like a lack of funds from the sender account), a message
will be sent to the corresponding slack channel specified via environment.
To avoid sending multiple messages, only one type of error will be sent every period of time,
here defined as 8 hours.

## Environment variables:

### Mandatory

- `SLACK_WEB_HOOK_TOKEN` - Slack web hook token for error reporting.
- `SUBSTRATE_SECRET_PHRASE` - Substrate account secret used by the service to fund user's accounts.

### Optional

- `PORT` - Defaults to `3000`.
- `RATE_LIMIT_WINDOW_MINUTES` - Rate limit window in minutes. Defaults to `1`.
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per rate limit window. Defaults to `60`.
- `RATE_LIMIT_NUMBER_OF_PROXIES` - Allowed number of proxies in front of the service. Defaults to `1`.
