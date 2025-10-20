# Encrypted Keystore Setup Guide

Quick reference for setting up encrypted key storage for Orbbit smart contract deployments.

## ⚠️ Security First

**NEVER store private keys in plain text `.env` files!**

This project uses encrypted key storage:

- **Foundry** → Encrypted keystores with password
- **Hardhat** → Encrypted configuration vars
- **Mainnet** → Hardware wallet (Ledger/Trezor) **required**

---

## Quick Command Reference

| Task         | Foundry                                   | Hardhat                              |
| ------------ | ----------------------------------------- | ------------------------------------ |
| **Setup**    | `cast wallet import <name> --interactive` | `npx hardhat vars set <VAR>`         |
| **List**     | `cast wallet list`                        | `npx hardhat vars list`              |
| **Address**  | `cast wallet address <name>`              | N/A                                  |
| **Deploy**   | `forge script --account <name>`           | `npx hardhat deploy`                 |
| **Remove**   | `cast wallet remove <name>`               | `npx hardhat vars delete <VAR>`      |
| **Location** | `~/.foundry/keystores/`                   | `~/.config/hardhat-nodejs/vars.json` |

---

## Foundry Encrypted Keystore

### Initial Setup

```bash
# Import your private key (one-time)
cast wallet import testnet-deployer --interactive

# Prompts:
# Enter private key: [paste your key - hidden]
# Enter password: [create strong password - hidden]

# ✅ Key encrypted at: ~/.foundry/keystores/testnet-deployer
```

### Verify Setup

```bash
# List all wallets
cast wallet list

# Check wallet address
cast wallet address testnet-deployer

# Decrypt and show address (requires password)
cast wallet decrypt testnet-deployer
```

### Usage in Deployments

```bash
# Deploy to testnet
forge script script/Deploy.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC \
  --account testnet-deployer \
  --sender $(cast wallet address testnet-deployer) \
  --broadcast

# You'll be prompted for password
# Password: [enter password from password manager]
```

### Common Commands

```bash
# Remove wallet
cast wallet remove testnet-deployer

# Re-import with new password
cast wallet import testnet-deployer --interactive

# List all keystores
ls ~/.foundry/keystores/

# Change keystore password (export + re-import)
cast wallet decrypt testnet-deployer > /tmp/key
cast wallet remove testnet-deployer
cast wallet import testnet-deployer --interactive < /tmp/key
rm /tmp/key  # Delete temp file immediately
```

---

## Hardhat Encrypted Vars

### Initial Setup

```bash
# Set encrypted variable (one-time)
npx hardhat vars set TESTNET_DEPLOYER_PRIVATE_KEY

# Prompts:
# ✔ Enter value: [paste your private key - hidden]

# ✅ Key encrypted at: ~/.config/hardhat-nodejs/vars.json
```

### Verify Setup

```bash
# List all encrypted vars
npx hardhat vars list

# Check if specific var exists (doesn't show value)
npx hardhat vars has TESTNET_DEPLOYER_PRIVATE_KEY

# Get var value (decrypts and displays)
npx hardhat vars get TESTNET_DEPLOYER_PRIVATE_KEY
```

### Usage in Deployments

```bash
# Deploy to testnet (automatic - no command changes!)
npx hardhat deploy --network baseSepolia

# Hardhat automatically uses encrypted vars
# No need to pass --private-key or similar flags
```

### Common Commands

```bash
# Delete a var
npx hardhat vars delete TESTNET_DEPLOYER_PRIVATE_KEY

# Set mainnet deployer key
npx hardhat vars set MAINNET_DEPLOYER_PRIVATE_KEY

# View storage location
ls -la ~/.config/hardhat-nodejs/
```

---

## Hardware Wallet (Ledger)

### Initial Setup

1. **Purchase** Ledger Nano S Plus (~$79) from official website
2. **Initialize** device and set PIN
3. **Install** Ethereum app via Ledger Live
4. **Get address:**
   ```bash
   # Connect Ledger, unlock, open Ethereum app
   cast wallet address --ledger
   # 0xYourLedgerAddress...
   ```

### Usage in Deployments

**Foundry:**

```bash
forge script script/Deploy.s.sol \
  --rpc-url $BASE_MAINNET_RPC \
  --ledger \
  --sender 0xYourLedgerAddress \
  --broadcast

# Ledger will display transaction
# Press right button to approve
```

**Hardhat:**

```bash
# Requires @nomicfoundation/hardhat-ledger plugin
pnpm add -D @nomicfoundation/hardhat-ledger

# Then deploy
npx hardhat deploy --network base
```

---

## Password Management

### Best Practices

✅ **DO:**

- Use password manager (1Password, Bitwire, LastPass)
- Use unique, strong passwords (16+ characters)
- Store backup of private key separately
- Use different passwords for testnet/mainnet

❌ **DON'T:**

- Store passwords in plain text
- Reuse passwords across keystores
- Store passwords in cloud without encryption
- Share passwords via email/chat

### Recommended Password Structure

```
Format: [word]-[word]-[word]-[number]
Example: correct-horse-battery-42

Or use password manager to generate:
- Length: 16-24 characters
- Include: uppercase, lowercase, numbers, symbols
```

---

## Troubleshooting

### "Wallet already exists"

```bash
cast wallet remove testnet-deployer
cast wallet import testnet-deployer --interactive
```

### "Failed to decrypt"

Wrong password. If you forgot it:

- If you have the private key: Remove and re-import
- If you don't have the private key: Key is permanently inaccessible

### "Variable not found" (Hardhat)

```bash
# Check what vars exist
npx hardhat vars list

# Set if missing
npx hardhat vars set TESTNET_DEPLOYER_PRIVATE_KEY
```

### Keystore password prompt not showing

```bash
# Use password file instead
echo "your_password" > ~/.foundry/.password
chmod 600 ~/.foundry/.password

forge script script/Deploy.s.sol \
  --account testnet-deployer \
  --password-file ~/.foundry/.password \
  --broadcast
```

### Can't find Ledger device

```bash
# Check if Ledger is detected
cast wallet address --ledger

# If not working:
# 1. Ensure Ledger is unlocked
# 2. Ethereum app is open on Ledger
# 3. Try different USB port
# 4. Update Ledger firmware via Ledger Live
```

---

## Migration from Plain Text .env

If you have `PRIVATE_KEY` in `.env` and want to migrate:

### Step 1: Import to encrypted storage

**Foundry:**

```bash
# Copy private key from .env
# Import it
cast wallet import testnet-deployer --interactive
# Paste key when prompted
```

**Hardhat:**

```bash
# Copy private key from .env
# Set encrypted var
npx hardhat vars set TESTNET_DEPLOYER_PRIVATE_KEY
# Paste key when prompted
```

### Step 2: Verify

```bash
# Foundry: Check address matches
cast wallet address testnet-deployer

# Hardhat: Deploy to testnet
npx hardhat deploy --network baseSepolia
```

### Step 3: Remove from .env

```bash
# Remove PRIVATE_KEY line from .env
# Or comment it out
# PRIVATE_KEY=removed_for_security
```

### Step 4: Update commands

**Before:**

```bash
forge script --private-key $PRIVATE_KEY --broadcast
```

**After:**

```bash
forge script --account testnet-deployer --broadcast
```

---

## Security Checklist

- [ ] Private keys stored in encrypted keystores only
- [ ] Strong, unique passwords for each keystore
- [ ] Passwords stored in password manager
- [ ] Separate keystores for testnet and mainnet
- [ ] Hardware wallet purchased for mainnet deployments
- [ ] Backup of private keys in secure location
- [ ] No PRIVATE_KEY in .env files
- [ ] .env file in .gitignore
- [ ] Team members trained on encrypted storage

---

## Support

For more detailed information:

- [Deployment Guide](../../apps/docs/src/content/engineering/web3-apps/smart-contracts/deployment.mdx)
- [Foundry Book](https://book.getfoundry.sh/reference/cast/cast-wallet)
- [Hardhat Docs](https://hardhat.org/hardhat-runner/docs/guides/configuration-variables)

For issues:

- Check troubleshooting section above
- Contact Orbbit engineering team
- Create issue in monorepo
