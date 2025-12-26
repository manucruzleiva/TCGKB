/**
 * IndexedDB Wrapper for TCGKB Offline Storage
 *
 * Database: tcgkb-offline
 * Version: 1
 *
 * Stores:
 * - cards: Cached card data with indexes on name, setCode, lastAccessed
 * - decks: User's decks with userId and lastModified indexes
 * - comments: Cached comments with cardId, deckId, createdAt indexes
 * - pendingActions: Offline mutations queue
 * - userPreferences: Settings storage
 */

const DB_NAME = 'tcgkb-offline';
const DB_VERSION = 1;

// Store names
export const STORES = {
  CARDS: 'cards',
  DECKS: 'decks',
  COMMENTS: 'comments',
  PENDING_ACTIONS: 'pendingActions',
  USER_PREFERENCES: 'userPreferences'
};

// Cache size limits (in MB)
const CACHE_LIMITS = {
  CARDS: 50, // 50 MB
  DECKS: 10, // 10 MB
  COMMENTS: 5, // 5 MB
  TOTAL: 100 // 100 MB total
};

class OfflineDB {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize the database
   * @returns {Promise<IDBDatabase>}
   */
  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[OfflineDB] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[OfflineDB] Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('[OfflineDB] Upgrading database schema');

        // Cards store
        if (!db.objectStoreNames.contains(STORES.CARDS)) {
          const cardsStore = db.createObjectStore(STORES.CARDS, { keyPath: 'id' });
          cardsStore.createIndex('name', 'name', { unique: false });
          cardsStore.createIndex('setCode', 'set.id', { unique: false });
          cardsStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
          console.log('[OfflineDB] Created cards store');
        }

        // Decks store
        if (!db.objectStoreNames.contains(STORES.DECKS)) {
          const decksStore = db.createObjectStore(STORES.DECKS, { keyPath: '_id' });
          decksStore.createIndex('userId', 'userId', { unique: false });
          decksStore.createIndex('lastModified', 'lastModified', { unique: false });
          decksStore.createIndex('isPendingSync', 'isPendingSync', { unique: false });
          console.log('[OfflineDB] Created decks store');
        }

        // Comments store
        if (!db.objectStoreNames.contains(STORES.COMMENTS)) {
          const commentsStore = db.createObjectStore(STORES.COMMENTS, { keyPath: '_id' });
          commentsStore.createIndex('cardId', 'cardId', { unique: false });
          commentsStore.createIndex('deckId', 'deckId', { unique: false });
          commentsStore.createIndex('createdAt', 'createdAt', { unique: false });
          console.log('[OfflineDB] Created comments store');
        }

        // Pending Actions store
        if (!db.objectStoreNames.contains(STORES.PENDING_ACTIONS)) {
          const pendingStore = db.createObjectStore(STORES.PENDING_ACTIONS, {
            keyPath: 'id',
            autoIncrement: true
          });
          pendingStore.createIndex('type', 'type', { unique: false });
          pendingStore.createIndex('createdAt', 'createdAt', { unique: false });
          console.log('[OfflineDB] Created pendingActions store');
        }

        // User Preferences store
        if (!db.objectStoreNames.contains(STORES.USER_PREFERENCES)) {
          db.createObjectStore(STORES.USER_PREFERENCES, { keyPath: 'key' });
          console.log('[OfflineDB] Created userPreferences store');
        }
      };
    });
  }

  /**
   * Generic method to add/update data
   * @param {string} storeName - Store name
   * @param {Object} data - Data to store
   * @returns {Promise<any>}
   */
  async put(storeName, data) {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic method to get data by key
   * @param {string} storeName - Store name
   * @param {string} key - Key to retrieve
   * @returns {Promise<any>}
   */
  async get(storeName, key) {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic method to get all data from a store
   * @param {string} storeName - Store name
   * @param {number} limit - Optional limit
   * @returns {Promise<Array>}
   */
  async getAll(storeName, limit = null) {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = limit ? store.getAll(null, limit) : store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic method to delete data by key
   * @param {string} storeName - Store name
   * @param {string} key - Key to delete
   * @returns {Promise<void>}
   */
  async delete(storeName, key) {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic method to clear a store
   * @param {string} storeName - Store name
   * @returns {Promise<void>}
   */
  async clear(storeName) {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log(`[OfflineDB] Cleared store: ${storeName}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Query data using an index
   * @param {string} storeName - Store name
   * @param {string} indexName - Index name
   * @param {any} value - Value to search for
   * @returns {Promise<Array>}
   */
  async getByIndex(storeName, indexName, value) {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== CARDS ====================

  /**
   * Cache a card
   * @param {Object} card - Card data
   * @returns {Promise<any>}
   */
  async cacheCard(card) {
    const cardWithMeta = {
      ...card,
      lastAccessed: new Date().toISOString(),
      cachedAt: card.cachedAt || new Date().toISOString()
    };

    return this.put(STORES.CARDS, cardWithMeta);
  }

  /**
   * Get cached card by ID
   * @param {string} cardId - Card ID
   * @returns {Promise<Object|undefined>}
   */
  async getCachedCard(cardId) {
    const card = await this.get(STORES.CARDS, cardId);

    if (card) {
      // Update last accessed time
      await this.put(STORES.CARDS, {
        ...card,
        lastAccessed: new Date().toISOString()
      });
    }

    return card;
  }

  /**
   * Search cached cards by name
   * @param {string} query - Search query
   * @returns {Promise<Array>}
   */
  async searchCachedCards(query) {
    const allCards = await this.getAll(STORES.CARDS);
    const normalizedQuery = query.toLowerCase();

    return allCards.filter(card =>
      card.name.toLowerCase().includes(normalizedQuery)
    );
  }

  /**
   * Get cards by set code
   * @param {string} setCode - Set code
   * @returns {Promise<Array>}
   */
  async getCardsBySet(setCode) {
    return this.getByIndex(STORES.CARDS, 'setCode', setCode);
  }

  // ==================== DECKS ====================

  /**
   * Cache a deck
   * @param {Object} deck - Deck data
   * @param {boolean} isPendingSync - Whether deck has unsaved changes
   * @returns {Promise<any>}
   */
  async cacheDeck(deck, isPendingSync = false) {
    const deckWithMeta = {
      ...deck,
      lastModified: new Date().toISOString(),
      isPendingSync,
      cachedAt: deck.cachedAt || new Date().toISOString()
    };

    return this.put(STORES.DECKS, deckWithMeta);
  }

  /**
   * Get cached deck by ID
   * @param {string} deckId - Deck ID
   * @returns {Promise<Object|undefined>}
   */
  async getCachedDeck(deckId) {
    return this.get(STORES.DECKS, deckId);
  }

  /**
   * Get all cached decks for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>}
   */
  async getUserDecks(userId) {
    return this.getByIndex(STORES.DECKS, 'userId', userId);
  }

  /**
   * Get all decks pending sync
   * @returns {Promise<Array>}
   */
  async getPendingDecks() {
    return this.getByIndex(STORES.DECKS, 'isPendingSync', true);
  }

  // ==================== COMMENTS ====================

  /**
   * Cache a comment
   * @param {Object} comment - Comment data
   * @returns {Promise<any>}
   */
  async cacheComment(comment) {
    return this.put(STORES.COMMENTS, comment);
  }

  /**
   * Get comments for a card
   * @param {string} cardId - Card ID
   * @returns {Promise<Array>}
   */
  async getCardComments(cardId) {
    return this.getByIndex(STORES.COMMENTS, 'cardId', cardId);
  }

  /**
   * Get comments for a deck
   * @param {string} deckId - Deck ID
   * @returns {Promise<Array>}
   */
  async getDeckComments(deckId) {
    return this.getByIndex(STORES.COMMENTS, 'deckId', deckId);
  }

  // ==================== PENDING ACTIONS ====================

  /**
   * Add a pending action
   * @param {Object} action - Action data
   * @returns {Promise<number>} Action ID
   */
  async addPendingAction(action) {
    const actionWithMeta = {
      ...action,
      createdAt: new Date().toISOString(),
      attempts: 0,
      lastAttempt: null,
      error: null
    };

    return this.put(STORES.PENDING_ACTIONS, actionWithMeta);
  }

  /**
   * Get all pending actions
   * @returns {Promise<Array>}
   */
  async getPendingActions() {
    return this.getAll(STORES.PENDING_ACTIONS);
  }

  /**
   * Delete a pending action
   * @param {number} actionId - Action ID
   * @returns {Promise<void>}
   */
  async deletePendingAction(actionId) {
    return this.delete(STORES.PENDING_ACTIONS, actionId);
  }

  /**
   * Clear all pending actions
   * @returns {Promise<void>}
   */
  async clearPendingActions() {
    return this.clear(STORES.PENDING_ACTIONS);
  }

  // ==================== USER PREFERENCES ====================

  /**
   * Set a user preference
   * @param {string} key - Preference key
   * @param {any} value - Preference value
   * @returns {Promise<any>}
   */
  async setPreference(key, value) {
    return this.put(STORES.USER_PREFERENCES, { key, value });
  }

  /**
   * Get a user preference
   * @param {string} key - Preference key
   * @returns {Promise<any>}
   */
  async getPreference(key) {
    const pref = await this.get(STORES.USER_PREFERENCES, key);
    return pref ? pref.value : null;
  }

  // ==================== CACHE MANAGEMENT ====================

  /**
   * Get cache size estimate
   * @returns {Promise<Object>} Size estimates by store
   */
  async getCacheSize() {
    if (!navigator.storage || !navigator.storage.estimate) {
      console.warn('[OfflineDB] Storage API not available');
      return null;
    }

    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;

    return {
      usage: Math.round(usage / (1024 * 1024)), // MB
      quota: Math.round(quota / (1024 * 1024)), // MB
      percentage: quota > 0 ? Math.round((usage / quota) * 100) : 0
    };
  }

  /**
   * Clean up old cached cards (LRU)
   * @param {number} keepCount - Number of cards to keep
   * @returns {Promise<number>} Number of cards deleted
   */
  async cleanupOldCards(keepCount = 1000) {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CARDS], 'readwrite');
      const store = transaction.objectStore(STORES.CARDS);
      const index = store.index('lastAccessed');
      const request = index.openCursor(null, 'prev'); // Newest first

      let count = 0;
      let deleted = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
          count++;

          if (count > keepCount) {
            cursor.delete();
            deleted++;
          }

          cursor.continue();
        } else {
          console.log(`[OfflineDB] Cleaned up ${deleted} old cards`);
          resolve(deleted);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all offline data
   * @returns {Promise<void>}
   */
  async clearAllData() {
    await Promise.all([
      this.clear(STORES.CARDS),
      this.clear(STORES.DECKS),
      this.clear(STORES.COMMENTS),
      this.clear(STORES.PENDING_ACTIONS),
      this.clear(STORES.USER_PREFERENCES)
    ]);

    console.log('[OfflineDB] All data cleared');
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('[OfflineDB] Database closed');
    }
  }
}

// Singleton instance
const offlineDb = new OfflineDB();

export default offlineDb;
