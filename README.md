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

```bash
# BnM Token balance: 4.0
# LINK Token balance: 27.291099348319977224
# Message cost in LINK: 0.04536595555759099
# Request sent, Message ID: 0xb7d3f7efb47e2e498397fa49d33711a3595e9bc01fdcc14992a8ccfad79841cb
# Waiting for message delivery...
# Source Router balance before: 2.0
# Attestation created for key generation:  {
#   attestationId: '0x2bc',
#   txHash: '0xd09e606997db95ec8e3aa9fd5da7b160d9813f4f9be794919c2ebcaa9f83f681',
#   indexingValue: '0xb7d3f7efb47e2e498397fa49d33711a3595e9bc01fdcc14992a8ccfad79841cb'
# }
# PreSubmission data:
#   Request Message ID: 0xb7d3f7efb47e2e498397fa49d33711a3595e9bc01fdcc14992a8ccfad79841cb
#   Idempotency Key: 0x54523eb849e34bb30ec802d31c413bc3dd2be87b5979ccdf545281755d6937ef
#   Used Tokens: 1.0
#   Pay Fees In: BigNumber { _hex: '0x01', _isBigNumber: true }
#   Sender: 0x6945EE254481302AD292Dfc8F7f27c4B065Af96d
#   Timestamp: 2024-09-08T10:56:36.000Z
# Cross-chain operation completed successfully
# Test completed successfully
```
