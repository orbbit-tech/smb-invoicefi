# Wallet Connection Setup Guide

## Overview
This guide helps you configure wallet connections (MetaMask, Coinbase Wallet, etc.) for the Orbbit Investor app.

## Prerequisites
1. **WalletConnect Project ID** (Required for wallet connections)
   - Visit: https://cloud.walletconnect.com
   - Create a free account
   - Create a new project
   - Copy your Project ID

2. **Alchemy API Key** (Required for blockchain RPC)
   - Visit: https://dashboard.alchemy.com
   - Create account or sign in
   - Create new app for Base network
   - Copy API key from dashboard

## Environment Variables Setup

### Step 1: Create .env.local file
```bash
cd apps/frontend/investor
cp .env.example .env.local
```

### Step 2: Configure Required Variables

#### Minimum Configuration (For Production)
```bash
# WalletConnect (Required)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Alchemy RPC URLs (Required)
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Disable localhost for production
NEXT_PUBLIC_ENABLE_LOCALHOST=false
```

#### Development Configuration (With Localhost Support)
```bash
# WalletConnect (Required)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Alchemy RPC URLs (Required)
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Enable localhost for development
NEXT_PUBLIC_ENABLE_LOCALHOST=true
```

## Troubleshooting Common Issues

### Issue 1: "Invalid chainId" Error
**Error Message:**
```
"Invalid chainId"
{"code":-32602,"message":"Expected an array with at least one valid string HTTPS url 'rpcUrls'..."}
```

**Cause:** MetaMask rejects localhost (HTTP) chains through wallet_addEthereumChain

**Solutions:**
1. **Disable Localhost (Recommended for MetaMask):**
   ```bash
   NEXT_PUBLIC_ENABLE_LOCALHOST=false
   ```

2. **Use Base Sepolia Testnet Instead:**
   - Connect to Base Sepolia (Chain ID: 84532)
   - Get testnet ETH from Base faucet: https://faucet.quicknode.com/base/sepolia

3. **For Localhost Development:**
   - Use hardhat accounts directly (not MetaMask)
   - Connect wallet only to testnet chains
   - Import hardhat private keys into MetaMask if needed

### Issue 2: "errorCorrection" React Warning
**Warning Message:**
```
React does not recognize the `errorCorrection` prop on a DOM element
```

**Cause:** RainbowKit 2.x compatibility with React 19

**Impact:**
- This is a non-breaking warning
- Wallet connection still works
- Will be fixed in future RainbowKit updates

**Workaround:** Can be safely ignored for now

### Issue 3: WalletConnect Not Working
**Symptoms:** QR code doesn't appear or wallet apps don't connect

**Solution:**
1. Verify `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set
2. Check console for warning messages
3. Ensure project ID is valid (get from https://cloud.walletconnect.com)

## Network Configuration

### Available Networks

1. **Base Sepolia Testnet** (Default)
   - Chain ID: 84532
   - RPC: Alchemy or https://sepolia.base.org
   - Testnet ETH: https://faucet.quicknode.com/base/sepolia

2. **Base Mainnet**
   - Chain ID: 8453
   - RPC: Alchemy or https://mainnet.base.org
   - Real ETH required

3. **Localhost** (Development Only)
   - Chain ID: 31337
   - RPC: http://127.0.0.1:8545
   - Requires running Hardhat node
   - Not compatible with MetaMask's add network feature

## Testing Wallet Connection

### Step 1: Start the Application
```bash
pnpm dev:investor
```

### Step 2: Open Browser
Navigate to: http://localhost:3000

### Step 3: Connect Wallet
1. Click "Connect Wallet" button
2. Choose your wallet (MetaMask, Coinbase Wallet, etc.)
3. Select network: **Base Sepolia** (recommended for testing)
4. Approve connection in wallet

### Step 4: Verify Connection
- Wallet address should appear in UI
- Network badge should show "Base Sepolia"
- No console errors

## Wallet Recommendations

### For Development
1. **MetaMask** - Use Base Sepolia testnet only
2. **Coinbase Wallet** - Works with all configured chains
3. **Frame** - Good for development with local chains

### For Production
1. **Coinbase Wallet** - Best UX, built-in Base support
2. **MetaMask** - Most popular, works with Base
3. **Rainbow Wallet** - Good mobile experience

## Security Notes

### Important
- Never commit `.env.local` to git (already in .gitignore)
- Keep API keys private
- Use different keys for development vs production
- Rotate keys if accidentally exposed

### Production Deployment (Vercel)
1. Go to Vercel project settings
2. Navigate to "Environment Variables"
3. Add all `NEXT_PUBLIC_*` variables
4. Deploy

## Support

If issues persist:
1. Check browser console for detailed errors
2. Verify all environment variables are set correctly
3. Try different wallet or network
4. Clear browser cache and restart

## Reference Links

- **WalletConnect Cloud:** https://cloud.walletconnect.com
- **Alchemy Dashboard:** https://dashboard.alchemy.com
- **Base Sepolia Faucet:** https://faucet.quicknode.com/base/sepolia
- **RainbowKit Docs:** https://rainbowkit.com/docs
- **Wagmi Docs:** https://wagmi.sh
