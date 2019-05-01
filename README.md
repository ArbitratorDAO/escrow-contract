# ArbitratorDAO contracts

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
