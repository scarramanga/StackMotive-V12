import { eq } from "drizzle-orm";
import { db } from "./db";
import { 
  users, User, InsertUser,
  tradingAccounts, TradingAccount, InsertTradingAccount,
  strategies, Strategy, InsertStrategy,
  trades, Trade, InsertTrade,
  watchlistItems, WatchlistItem, InsertWatchlistItem,
  marketEvents, MarketEvent, InsertMarketEvent
} from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateLastLogin(id: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateStripeCustomerId(id: number, stripeCustomerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStripeInfo(id: number, info: { customerId: string, subscriptionId: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId: info.customerId,
        stripeSubscriptionId: info.subscriptionId 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Trading Accounts
  async getTradingAccounts(userId: number): Promise<TradingAccount[]> {
    return db
      .select()
      .from(tradingAccounts)
      .where(eq(tradingAccounts.userId, userId));
  }

  async getTradingAccount(id: number): Promise<TradingAccount | undefined> {
    const [account] = await db
      .select()
      .from(tradingAccounts)
      .where(eq(tradingAccounts.id, id));
    return account || undefined;
  }

  async createTradingAccount(accountData: InsertTradingAccount): Promise<TradingAccount> {
    const [account] = await db
      .insert(tradingAccounts)
      .values(accountData)
      .returning();
    return account;
  }

  async updateTradingAccount(id: number, data: Partial<TradingAccount>): Promise<TradingAccount> {
    const [account] = await db
      .update(tradingAccounts)
      .set(data)
      .where(eq(tradingAccounts.id, id))
      .returning();
    return account;
  }

  async deleteTradingAccount(id: number): Promise<void> {
    await db.delete(tradingAccounts).where(eq(tradingAccounts.id, id));
  }

  // Strategies
  async getStrategies(userId: number): Promise<Strategy[]> {
    return db
      .select()
      .from(strategies)
      .where(eq(strategies.userId, userId));
  }

  async getStrategy(id: number): Promise<Strategy | undefined> {
    const [strategy] = await db
      .select()
      .from(strategies)
      .where(eq(strategies.id, id));
    return strategy || undefined;
  }

  async createStrategy(strategyData: InsertStrategy): Promise<Strategy> {
    const [strategy] = await db
      .insert(strategies)
      .values(strategyData)
      .returning();
    return strategy;
  }

  async updateStrategy(id: number, data: Partial<Strategy>): Promise<Strategy> {
    const [strategy] = await db
      .update(strategies)
      .set(data)
      .where(eq(strategies.id, id))
      .returning();
    return strategy;
  }

  async deleteStrategy(id: number): Promise<void> {
    await db.delete(strategies).where(eq(strategies.id, id));
  }

  // Trades
  async getTrades(userId: number): Promise<Trade[]> {
    return db
      .select()
      .from(trades)
      .where(eq(trades.userId, userId));
  }

  async getTrade(id: number): Promise<Trade | undefined> {
    const [trade] = await db
      .select()
      .from(trades)
      .where(eq(trades.id, id));
    return trade || undefined;
  }

  async createTrade(tradeData: InsertTrade): Promise<Trade> {
    const [trade] = await db
      .insert(trades)
      .values(tradeData)
      .returning();
    return trade;
  }

  async updateTrade(id: number, data: Partial<Trade>): Promise<Trade> {
    const [trade] = await db
      .update(trades)
      .set(data)
      .where(eq(trades.id, id))
      .returning();
    return trade;
  }

  // Watchlist
  async getWatchlistItems(userId: number): Promise<WatchlistItem[]> {
    return db
      .select()
      .from(watchlistItems)
      .where(eq(watchlistItems.userId, userId));
  }

  async getWatchlistItem(id: number): Promise<WatchlistItem | undefined> {
    const [item] = await db
      .select()
      .from(watchlistItems)
      .where(eq(watchlistItems.id, id));
    return item || undefined;
  }

  async createWatchlistItem(itemData: InsertWatchlistItem): Promise<WatchlistItem> {
    const [item] = await db
      .insert(watchlistItems)
      .values(itemData)
      .returning();
    return item;
  }

  async deleteWatchlistItem(id: number): Promise<void> {
    await db.delete(watchlistItems).where(eq(watchlistItems.id, id));
  }

  // Market Events
  async getMarketEvents(): Promise<MarketEvent[]> {
    return db.select().from(marketEvents);
  }

  async getMarketEvent(id: number): Promise<MarketEvent | undefined> {
    const [event] = await db
      .select()
      .from(marketEvents)
      .where(eq(marketEvents.id, id));
    return event || undefined;
  }

  async createMarketEvent(eventData: InsertMarketEvent): Promise<MarketEvent> {
    const [event] = await db
      .insert(marketEvents)
      .values(eventData)
      .returning();
    return event;
  }
}