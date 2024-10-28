import { NearBindgen, near, call, view, assert } from "near-sdk-js";

// Define a structure to store trade listings
class TradeListing {
  constructor(openingTrader, offeredNFTs, desiredNFTs) {
    this.openingTrader = openingTrader; // Account ID of listing creator
    this.offeredNFTs = offeredNFTs; // Array of NFT identifiers offered
    this.desiredNFTs = desiredNFTs; // Array of NFT identifiers desired in return
    this.engagingTrader = null; // Account ID of engaging trader, if any
    this.status = "open"; // Status: "open", "accepted", "completed"
  }
}

@NearBindgen
class NFTTradingContract {
  constructor() {
    this.listings = {}; // Store all trade listings
  }

  // Function to create a direct trade proposal
  @call
  directTrade({ openingTraderNFT, engagingTraderNFT, engagingTrader }) {
    const sender = near.predecessorAccountId();

    // Record a direct trade listing
    const tradeId = `${sender}:${Date.now()}`; // Unique identifier for the trade
    this.listings[tradeId] = new TradeListing(
      sender,
      [openingTraderNFT],
      [engagingTraderNFT],
    );
    this.listings[tradeId].engagingTrader = engagingTrader;
    this.listings[tradeId].status = "pending";

    return tradeId;
  }

  // Function to approve a direct trade and swap NFTs
  @call
  approveDirectTrade({ tradeId }) {
    const sender = near.predecessorAccountId();
    const trade = this.listings[tradeId];

    // Verify trade details
    assert(trade, "Trade not found");
    assert(
      trade.status === "pending",
      "Trade is not in a valid state for approval",
    );
    assert(
      trade.engagingTrader === sender,
      "Only the engaging trader can approve this trade",
    );

    // Swap NFTs between opening and engaging traders
    this._swapNFTs(
      trade.openingTrader,
      trade.engagingTrader,
      trade.offeredNFTs[0],
      trade.desiredNFTs[0],
    );

    trade.status = "completed";
    return `Trade ${tradeId} has been successfully completed.`;
  }

  // List NFTs for trade in the Trading Center
  @call
  listNFTsForTrade({ offeredNFTs, desiredNFTs }) {
    const sender = near.predecessorAccountId();
    const tradeId = `${sender}:${Date.now()}`; // Unique trade ID

    this.listings[tradeId] = new TradeListing(sender, offeredNFTs, desiredNFTs);
    return tradeId;
  }

  // Propose a trade for an existing listing
  @call
  proposeTrade({ tradeId, proposedNFTs }) {
    const sender = near.predecessorAccountId();
    const listing = this.listings[tradeId];

    assert(listing, "Listing not found");
    assert(listing.status === "open", "Listing is not available for trade");

    listing.engagingTrader = sender;
    listing.desiredNFTs = proposedNFTs;
    listing.status = "pending";

    return `Trade proposal submitted by ${sender} for trade ${tradeId}.`;
  }

  // Approve a proposed trade and swap NFTs
  @call
  approveTrade({ tradeId }) {
    const sender = near.predecessorAccountId();
    const trade = this.listings[tradeId];

    assert(trade, "Trade not found");
    assert(
      trade.status === "pending",
      "Trade is not in a valid state for approval",
    );
    assert(
      trade.openingTrader === sender,
      "Only the listing creator can approve this trade",
    );

    // Swap NFTs between opening and engaging traders
    this._swapNFTs(
      trade.openingTrader,
      trade.engagingTrader,
      trade.offeredNFTs,
      trade.desiredNFTs,
    );

    trade.status = "completed";
    return `Trade ${tradeId} has been successfully completed.`;
  }

  _swapNFTs(
    openingTrader,
    engagingTrader,
    openingTraderNFTs,
    engagingTraderNFTs,
  ) {
    // Logic to transfer NFTs between users
    // Note: You will need to integrate NFT transfer logic according to NEAR's standards,
    // using cross-contract calls to interact with NFT contracts.
    // This is a placeholder implementation.
    console.log(`Swapping NFTs between ${openingTrader} and ${engagingTrader}`);
  }

  // Retrieve details of a specific trade listing
  @view
  getTradeListing({ tradeId }) {
    return this.listings[tradeId] || null;
  }

  // Retrieve all open trade listings
  @view
  getOpenListings() {
    return Object.values(this.listings).filter(
      (listing) => listing.status === "open",
    );
  }
}
