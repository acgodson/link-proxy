# Link Proxy

Share, access, and pay for AI services using LINK from across multiple blockchain network.

## Summary

Included in this repository is:

- Solidity [contracts](forge-contracts/src)
- Foundry [testing](contracts-foundry/test)
- Testnet [scripts](contracts-foundry/ts-scripts)

- Frontend [client](client/)

### Testing locally

Clone down the repo, cd into it, then build and run unit tests:

```bash
git clone https://github.com/acgodson/link-proxy.git
cd contracts-foundry
npm run build
forge test
```

**Expected output**

```
output 1
```

### Deploying to Testnet and Testing

You will need a wallet with at least 0.5 Testnet ETH Sepolia and 0.05 Base Sepolia. Obtain faucets from [Chainlink faucet](http://faucets.chain.link)

create and update .env file

```bash
PRIVATE_KEY=your_wallet_private_key
```

```bash
npm run main
```

**Expected output**

```
output 2
```
