# Demo Video Script

[Intro]

Hi everyone, I’m Jian, co-founder & CTO of Orbbit.
We’re building the future of B2B liquidity, where we connect small & medium businesses that need cashflow today with crypto investors who are looking for stable, real-world yield.

[The Problem]

The big problem is a liquidity mismatch.

For most SMBs, it often takes 30 to 90 days to get paid after they deliver goods or services.
That means their working capital is stuck, production slows down, and growth gets delayed.
Traditional financing is slow, full of paperwork, and expensive.

Right now, more than five trillion dollars are locked in unpaid invoices.
That’s money that could be used to grow businesses today.

On the other side, crypto investors are sitting on over 130 billion dollars in idle stablecoins. Most of it is not earning any return.

And assets like Bitcoin or Ether go up and down with the markets, so the returns are unpredictable and risky.
So even though there’s massive liquidity onchain, it isn’t reaching the real world where it’s needed.

[The Solution]

For SMB:
Upload your invoice. Orbbit underwrites it and advances up to 80 percent of the amount upfront.
Receive USDC instantly. You can keep it in your wallet or off-ramp to your bank account.
Repay automatically once your buyer pays.

For investors:

Browse verified NFT invoices from real businesses.
Fund with USDC directly on Base.
Earn predictable yield as invoices are repaid.

The transactions are transparent and onchain.

[SMB App Demo]

Let’s take a look at how it works.

I’m logging in as Gallivant Ice Cream, one of our SMB customers.
On the main page, you can see all invoices in multiple views — table, kanban, Gantt, and gallery.

To submit an invoice, the SMB first sets up a wallet.
Users can create a new smart wallet using Base Accounts so Orbbit can sponsor gas fees,
or users can connect an existing wallet through Rainbow Kit.

Since I already have a Base account, I’ll just log in and submit a new invoice.
I fill in the details, upload the invoice PDF, and click Submit.

[Behind the Scenes]

Once submitted, Orbbit automatically runs underwriting.
We combine credit data, cashflow analysis, and business legitimacy checks to assess risk.
If approved, the invoice is minted as an NFT and listed on our marketplace.
Only verified SMBs and investors who pass KYC and KYB can participate.

[Investor App Demo]

Now let’s switch to the investor side.

First I connect my existing wallet with MetaMask.

On the marketplace page, I can browse verified invoices, review repayment terms, and select one to fund.

I click “Fund”, confirm the transaction, and pay with USDC. Then I instantly see an NFT appear in my portfolio.

That NFT represents my position. I can click it to view details and track repayment progress.

[SMB Receives]

Once the investor funds the invoice, the Orbbit smart contract settles the transaction and sends USDC directly to the SMB wallet.

[SMB Repay]
Fast forward to due date, SMB clicks the Repay button, and the smart contract automatically distributes principal and yield back to the investor. We’ll provide autopay features to make the process more seamless.

Orbbit earns a platform percentage fee for each financed invoice.

[Architecture Overview]

Here’s a high level overview of what’s under the hood.
We have separate frontend apps for SMB, investor, and internal admin.
Our smart contracts deployed on Base handle NFT, funding, and repayment related logic.
Our backend manages all the offchain logic - including underwriting, KYB/KYC verification, file storage etc.

To bring more users onchain, we design the onboarding to be flexible so that crypto savvy users can connect any existing wallet, and we create a new smart contract wallet automatically for user by integrating with Base Account.

Our smart contracts are deployed on Base Sepolia Testnet and can be verified on BaseScan.

[Target Users]

We serve two groups: SMBs and crypto investors.
For SMBs, we’re starting with industries like consumer packaged goods, hospitality, and retail — sectors that deal with long payment cycles but constant working capital needs.
They can receive USDC directly or cash out to their bank without touching crypto.

For investors, we’re targeting people who already hold stablecoins and want a low-risk, real-world yield opportunity instead of DeFi speculation.
We’ve validated both sides through conversations with founders and early crypto investors, and the feedback has been very positive.

[GTM STrategy]
We’re starting in Houston, which has one of the most diverse SMB ecosystems in the U.S.
We’re working with organizations like the Houston Hospitality Alliance, the Asian Chamber of Commerce, and the Indo-American Chamber of Commerce.
This gives us direct access to thousands of trusted SMBs.
Next, we’re expanding to Austin, which is home to many CPG startups and brand accelerators like The Consumer VC.
This Houston-to-Austin path helps us build a strong early foundation for national expansion.

[Moats]
We think about defensibility through seven powers.

First, speed. We ship weekly and constantly iterate ahead of competitors.
Second, process power. Our hybrid crypto stack brings together trust, compliance, and efficiency.
Third, network effects. More SMBs mean more data, better models, higher yields, and more investors.
Fourth, scale economies. Our AI and automation reduce the marginal cost per loan from thousands of dollars to almost zero.
Fifth, counter-positioning. Traditional lenders are slow, most fintechs are stuck in BaaS mode, and DeFi protocols rarely touch the real world. Orbbit bridges all three.
Sixth, a regulatory moat. We’re working toward lending and securities licenses that will strengthen our long-term position.
And finally, brand. SMBs see Orbbit as the easiest and fairest way to access capital.
Investors see Orbbit as transparent, credible, and impact-driven — real yield from real businesses.
Next STEP:
In the next 6 to 12 months, our goals are clear.
Launch the Alpha version on Base Mainnet.
Onboard at least 15 SMBs through our local partnerships.
Expand to Austin and reach new CPG founders.
Fund over one million dollars in receivables volume with Base ecosystem investors.
Launch the AI features for SMB and Investor dashboard.
Achieve a 95 percent repayment rate to prove the accuracy of our underwriting.
And secure five or more ecosystem partnerships within the Base RWA and DeFi communities.

[Closing]
Orbbit is bridging the worlds of Web2 finance and Web3 liquidity.
We’re turning idle stablecoins into growth capital for real businesses.
And we’re proving that credit can flow onchain — transparently, compliantly, and intelligently.

Thank you.
