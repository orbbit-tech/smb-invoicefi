# Hardhat v3 Migration Guide

## ✅ Migration Completed

Your project has been successfully migrated from Hardhat v2.26.3 to **Hardhat v3.0.7**!

## 🔑 Setting Up Private Keys & API Keys

### Using the Keystore (Recommended - Encrypted Storage)

Hardhat v3 uses the `hardhat-keystore` plugin for secure, encrypted storage of secrets.

#### Set up your private keys:

```bash
# For Base Sepolia testnet (encrypted, password-protected)
npx hardhat keystore set TESTNET_DEPLOYER_PRIVATE_KEY

# For Base Mainnet (encrypted, password-protected)
npx hardhat keystore set MAINNET_DEPLOYER_PRIVATE_KEY

# For Etherscan API key
npx hardhat keystore set ETHERSCAN_API_KEY
```

#### For Development (no password prompt):

```bash
# Add --dev flag to skip password prompts for non-sensitive development keys
npx hardhat keystore set TESTNET_DEPLOYER_PRIVATE_KEY --dev
```

### Managing Your Keystore

```bash
# List all stored keys
npx hardhat keystore list

# Get a specific key value
npx hardhat keystore get TESTNET_DEPLOYER_PRIVATE_KEY

# Delete a key
npx hardhat keystore delete TESTNET_DEPLOYER_PRIVATE_KEY

# Change keystore password
npx hardhat keystore change-password

# Show keystore file location
npx hardhat keystore path
```

## 📦 Major Changes from v2 to v3

### 1. **Configuration Variables**
- **v2**: `vars.get('KEY_NAME')`
- **v3**: `configVariable('KEY_NAME')`

### 2. **Network Configuration**
Networks now require explicit `type` field:
- `type: 'edr-simulated'` - For in-memory test networks
- `type: 'http'` - For JSON-RPC networks (testnets/mainnet)

### 3. **Plugin Registration**
Plugins must be explicitly registered:
```typescript
plugins: [hardhatKeystore]
```

### 4. **Commands Changed**
- **v2**: `npx hardhat vars set KEY_NAME`
- **v3**: `npx hardhat keystore set KEY_NAME`

## 🚀 Deployment with Hardhat Ignition

Hardhat v3 uses **Hardhat Ignition** instead of `hardhat-deploy`.

### Deploy to Base Sepolia:
```bash
npx hardhat ignition deploy ignition/modules/OrbbitProtocol.ts --network baseSepolia --parameters ignition/parameters/base-sepolia.json
```

### Deploy to Base Mainnet:
```bash
npx hardhat ignition deploy ignition/modules/OrbbitProtocol.ts --network base --parameters ignition/parameters/base-mainnet.json
```

### Deploy to Local Network:
```bash
# Start local node
npx hardhat node

# In another terminal, deploy
npx hardhat ignition deploy ignition/modules/OrbbitProtocol.ts --network localhost
```

## 📝 Common Tasks

### Compile Contracts
```bash
npx hardhat compile
```

### Run Tests
```bash
npx hardhat test
```

### Verify Contracts
```bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### Generate TypeChain Types
```bash
npx hardhat typechain
```

## 🔄 What Was Migrated

### ✅ Completed
- [x] Upgraded to Hardhat v3.0.7
- [x] Migrated to ESM (`"type": "module"`)
- [x] Updated all plugins to v3 versions
- [x] Configured `hardhat-keystore` plugin properly
- [x] Migrated from `hardhat-deploy` to Hardhat Ignition
- [x] Created Ignition deployment modules
- [x] Updated network configurations for v3
- [x] Configured TypeChain for v3
- [x] Set up contract verification for Base networks

### 📁 Backups Created
- `hardhat.config.v2.ts` - Your original v2 config
- `deploy/001_deploy_contracts.v2.ts` - Your original deployment script

## 🆕 New Files Created

```
ignition/
├── modules/
│   └── OrbbitProtocol.ts          # Main deployment module
└── parameters/
    ├── base-sepolia.json          # Testnet parameters
    └── base-mainnet.json          # Mainnet parameters
```

## 📚 Resources

- [Hardhat v3 Documentation](https://hardhat.org/docs)
- [Configuration Variables Guide](https://hardhat.org/docs/learn-more/configuration-variables)
- [Hardhat Keystore Plugin](https://hardhat.org/plugins/nomicfoundation-hardhat-keystore)
- [Hardhat Ignition](https://hardhat.org/ignition)
- [Migration from hardhat-deploy](https://blog.nomic.foundation/migrating-to-hardhat-ignition-from-hardhat-deploy-c17311bb658f/)

## ⚠️ Important Notes

1. **First-time keystore setup**: When you run `npx hardhat keystore set` for the first time, you'll be prompted to create a password for your keystore.

2. **Lazy loading**: Configuration variables are only loaded when needed. If you run `npx hardhat compile`, it won't ask for your private keys.

3. **Environment variables still work**: You can still use `.env` files for non-sensitive values like RPC URLs.

4. **Old v2 vars are gone**: The old `npx hardhat vars` command and `~/.hardhat/vars.json` file are no longer used in v3.

## 🎯 Next Steps

1. **Set up your private keys**:
   ```bash
   npx hardhat keystore set TESTNET_DEPLOYER_PRIVATE_KEY
   npx hardhat keystore set ETHERSCAN_API_KEY
   ```

2. **Test compilation**:
   ```bash
   npx hardhat compile
   ```

3. **Test deployment on local network**:
   ```bash
   npx hardhat node
   # In another terminal:
   npx hardhat ignition deploy ignition/modules/OrbbitProtocol.ts --network localhost
   ```

4. **Deploy to testnet**:
   ```bash
   npx hardhat ignition deploy ignition/modules/OrbbitProtocol.ts --network baseSepolia
   ```

---

**Migration completed on**: October 17, 2025
**Hardhat version**: 3.0.7
**Previous version**: 2.26.3
