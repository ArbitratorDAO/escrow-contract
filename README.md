# DeFiFu

The following repo contains all the smart contracts for the mutual fund build on the [DutchX protocol](https://dutchx.d.exchange/). Its goal is to enable anyone to invest in a managed/ non-managed fund of ERC20 tokens on Ethereum. The smart contracts stand out, as the fund operators can not steal the any funds from any customers. 

In order to get a quick overview of the logic and the project take a look at the pitch deck, or continue reading on.
![Pitch-Deck](https://docs.google.com/presentation/d/1HRokijl33UsCx8BsxUZF8GUevnaoEDfx2Gkc3q_QBTM/edit?usp=sharing)

The deployment consists of the smart contracts `MutualFUnd`. 

### MutualFund

### MFManger

## Get setup
```bash
# Install dependencies
npm install

# In one tab: Run ganache
npm run rpc
```

## Migrations
Local:
```bash
npm run migrate
```

Rinkeby:
```bash
npm run restore
npm run networks --clean
npm run migrate --reset --network rinkeby
npm run networks-extract
```

Mainnet:
```bash
npm run restore
npm run networks --clean
npm run migrate --reset --network mainnet
npm run networks-extract
```

```
## Security-Advice:

If the operator of the dutchX protocol is proposing malicious changes, everyone in the fund should still be able to withdraw their funds before the malicious changes will be implemented. Hence, for the unlikely event of malicious code changes, users should keep an eye on smart contract updates.