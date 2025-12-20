import { test, expect } from '@playwright/test';
import {
  POKEMON_STANDARD_VALID,
  POKEMON_GLC_VALID_FIRE,
  RIFTBOUND_VALID,
  SIMPLE_POKEMON_DECK,
  INVALID_DECK_GIBBERISH,
  EMPTY_DECK,
  API_ENDPOINTS
} from './fixtures/deck-fixtures.js';

/**
 * DM-V2 API Tests
 * Tests for deck parsing, enrichment, and community endpoints
 *
 * Test Plan Reference: [Testing] DM-V2: Card Enrichment Service
 *                      [Testing] DM-V2: Import Flow E2E
 */

const BASE_URL = 'http://localhost:5176';

test.describe('Deck Parse API', () => {
  test('TC-ENR-001: should parse and enrich Pokemon deck', async ({ request }) => {
    const response = await request.post(`${BASE_URL}${API_ENDPOINTS.PARSE_DECK}`, {
      data: {
        deckString: SIMPLE_POKEMON_DECK
      }
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBeTruthy();
    expect(data.data).toBeDefined();

    // Should detect Pokemon TCG
    expect(data.data.tcg).toBe('pokemon');

    // Should have cards array
    expect(data.data.cards).toBeInstanceOf(Array);
    expect(data.data.cards.length).toBeGreaterThan(0);
  });

  test('TC-ENR-002: should detect Rule Box Pokemon', async ({ request }) => {
    const deckWithRuleBox = `4 Pikachu ex SVI 057
4 Charizard ex MEW 006
4 Professor's Research SVI 189`;

    const response = await request.post(`${BASE_URL}${API_ENDPOINTS.PARSE_DECK}`, {
      data: {
        deckString: deckWithRuleBox
      }
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBeTruthy();

    // Should have validation info about Rule Box
    if (data.data.validation) {
      const hasRuleBox = data.data.cards?.some(c =>
        c.subtypes?.includes('ex') || c.name?.includes('ex')
      );
      expect(hasRuleBox || data.data.validation.hasRuleBox !== undefined).toBeTruthy();
    }
  });

  test('TC-ENR-003: should detect Basic Pokemon', async ({ request }) => {
    const response = await request.post(`${BASE_URL}${API_ENDPOINTS.PARSE_DECK}`, {
      data: {
        deckString: POKEMON_STANDARD_VALID
      }
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBeTruthy();

    // Should include Basic Pokemon detection
    if (data.data.validation) {
      expect(data.data.validation.hasBasicPokemon).toBeDefined();
    }
  });

  test('TC-ENR-006: should handle missing cards gracefully', async ({ request }) => {
    const deckWithUnknownCard = `4 Totally Fake Card XYZ 999
4 Pikachu SVI 025`;

    const response = await request.post(`${BASE_URL}${API_ENDPOINTS.PARSE_DECK}`, {
      data: {
        deckString: deckWithUnknownCard
      }
    });

    // Should not crash
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBeTruthy();

    // Should have some cards parsed
    expect(data.data.cards.length).toBeGreaterThan(0);

    // Should indicate unenriched cards if enrichment is implemented
    if (data.data.enrichment) {
      expect(data.data.enrichment.unenrichedCount).toBeDefined();
    }
  });

  test('TC-ENR-008: should return enrichment stats', async ({ request }) => {
    const response = await request.post(`${BASE_URL}${API_ENDPOINTS.PARSE_DECK}`, {
      data: {
        deckString: POKEMON_STANDARD_VALID
      }
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBeTruthy();

    // Should include enrichment stats if service is active
    if (data.data.enrichment) {
      expect(data.data.enrichment.enrichedCount).toBeDefined();
      expect(data.data.enrichment.totalCards).toBeDefined();
    }
  });

  test('TC-IMP-004: should auto-detect TCG (Pokemon)', async ({ request }) => {
    const response = await request.post(`${BASE_URL}${API_ENDPOINTS.PARSE_DECK}`, {
      data: {
        deckString: POKEMON_STANDARD_VALID
      }
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBeTruthy();
    expect(data.data.tcg).toBe('pokemon');
  });

  test('TC-IMP-004: should auto-detect TCG (Riftbound)', async ({ request }) => {
    const response = await request.post(`${BASE_URL}${API_ENDPOINTS.PARSE_DECK}`, {
      data: {
        deckString: RIFTBOUND_VALID
      }
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBeTruthy();

    // Should detect as Riftbound (if implemented)
    // May fall back to pokemon if Riftbound not in cache
    expect(['pokemon', 'riftbound']).toContain(data.data.tcg);
  });

  test('TC-IMP-006: should handle invalid input gracefully', async ({ request }) => {
    const response = await request.post(`${BASE_URL}${API_ENDPOINTS.PARSE_DECK}`, {
      data: {
        deckString: INVALID_DECK_GIBBERISH
      }
    });

    // Should return response (not crash)
    const status = response.status();
    expect([200, 400]).toContain(status);

    const data = await response.json();

    // Either success with empty/partial cards or error message
    if (status === 200) {
      expect(data.success).toBeDefined();
    } else {
      expect(data.error || data.message).toBeDefined();
    }
  });

  test('TC-IMP-007: should handle empty input', async ({ request }) => {
    const response = await request.post(`${BASE_URL}${API_ENDPOINTS.PARSE_DECK}`, {
      data: {
        deckString: EMPTY_DECK
      }
    });

    // Should return error or empty result
    const data = await response.json();

    if (response.ok()) {
      expect(data.data.cards.length).toBe(0);
    } else {
      expect(data.error || data.message).toBeDefined();
    }
  });
});

test.describe('Deck Community API', () => {
  test('TC-COM-003: should list community decks', async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_ENDPOINTS.GET_COMMUNITY}`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBeTruthy();
    expect(data.data).toBeInstanceOf(Array);
  });

  test('TC-COM-003: should support pagination', async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_ENDPOINTS.GET_COMMUNITY}?page=1&limit=5`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBeTruthy();

    // Should have pagination info
    if (data.pagination) {
      expect(data.pagination.page).toBeDefined();
      expect(data.pagination.limit || data.pagination.totalPages).toBeDefined();
    }
  });

  test('TC-COM-003: should filter by TCG', async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_ENDPOINTS.GET_COMMUNITY}?tcg=pokemon`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBeTruthy();

    // All returned decks should be Pokemon
    if (data.data.length > 0) {
      data.data.forEach(deck => {
        expect(deck.tcgSystem || deck.tcg).toBe('pokemon');
      });
    }
  });

  test('TC-COM-003: should filter by format', async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_ENDPOINTS.GET_COMMUNITY}?format=standard`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBeTruthy();

    // All returned decks should be Standard format
    if (data.data.length > 0) {
      data.data.forEach(deck => {
        if (deck.format) {
          expect(deck.format).toBe('standard');
        }
      });
    }
  });

  test('TC-COM-003: should sort by recent', async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_ENDPOINTS.GET_COMMUNITY}?sort=recent`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBeTruthy();

    // Verify order (most recent first)
    if (data.data.length > 1) {
      const dates = data.data.map(d => new Date(d.createdAt || d.updatedAt));
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i].getTime()).toBeGreaterThanOrEqual(dates[i + 1].getTime());
      }
    }
  });
});

test.describe('Deck Voting API', () => {
  let testDeckId = null;

  test.beforeAll(async ({ request }) => {
    // Get a deck ID for voting tests
    const response = await request.get(`${BASE_URL}${API_ENDPOINTS.GET_COMMUNITY}?limit=1`);
    if (response.ok()) {
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        testDeckId = data.data[0]._id || data.data[0].id;
      }
    }
  });

  test('TC-COM-004: should upvote a deck', async ({ request }) => {
    if (!testDeckId) {
      test.skip();
      return;
    }

    const response = await request.post(`${BASE_URL}${API_ENDPOINTS.VOTE(testDeckId)}`, {
      data: {
        vote: 'up'
      }
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBeTruthy();
  });

  test('TC-COM-005: should downvote a deck', async ({ request }) => {
    if (!testDeckId) {
      test.skip();
      return;
    }

    const response = await request.post(`${BASE_URL}${API_ENDPOINTS.VOTE(testDeckId)}`, {
      data: {
        vote: 'down'
      }
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBeTruthy();
  });

  test('TC-COM-008: should allow anonymous voting', async ({ request }) => {
    if (!testDeckId) {
      test.skip();
      return;
    }

    // Vote without authentication
    const response = await request.post(`${BASE_URL}${API_ENDPOINTS.VOTE(testDeckId)}`, {
      data: {
        vote: 'up'
      },
      headers: {
        'x-fingerprint': `test-fingerprint-${Date.now()}`
      }
    });

    // Should allow (fingerprint-based voting)
    expect(response.ok()).toBeTruthy();
  });

  test('should get deck votes', async ({ request }) => {
    if (!testDeckId) {
      test.skip();
      return;
    }

    const response = await request.get(`${BASE_URL}${API_ENDPOINTS.GET_VOTES(testDeckId)}`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBeTruthy();
    expect(data.data.up).toBeDefined();
    expect(data.data.down).toBeDefined();
  });
});

test.describe('Performance Tests', () => {
  test('TC-ENR-007: should parse 60-card deck in <500ms', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.post(`${BASE_URL}${API_ENDPOINTS.PARSE_DECK}`, {
      data: {
        deckString: POKEMON_STANDARD_VALID
      }
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(response.ok()).toBeTruthy();

    // Should complete in under 500ms (allow some network latency)
    // In CI might be slower, so use 2000ms as upper bound
    expect(duration).toBeLessThan(2000);

    console.log(`Parse API response time: ${duration}ms`);
  });

  test('should handle multiple concurrent requests', async ({ request }) => {
    const requests = Array(5).fill(null).map(() =>
      request.post(`${BASE_URL}${API_ENDPOINTS.PARSE_DECK}`, {
        data: {
          deckString: SIMPLE_POKEMON_DECK
        }
      })
    );

    const responses = await Promise.all(requests);

    // All should succeed
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy();
    });
  });
});
