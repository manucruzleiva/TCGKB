# Deck Builder - Batch Import Optimization

## Date: 2025-12-17

## Problem
The Deck Builder import feature was extremely slow because it fetched card details one by one using sequential API calls. A typical deck with 15-30 unique cards would take 5-10+ seconds to import.

## Solution
Created a batch endpoint `/api/cards/batch` that accepts an array of card IDs and returns all card data in a single request with parallel internal fetches.

## Changes Made

### Backend

#### `backend/src/controllers/cards.controller.js`
- Added `getCardsByIds` function
- Accepts POST request with `{ ids: string[] }`
- Uses `Promise.allSettled` to fetch cards in parallel
- Returns `{ cards: {[cardId]: CardData}, notFound: string[] }`
- Limited to 60 cards max (one deck)

#### `backend/src/routes/cards.routes.js`
- Added route: `POST /cards/batch`
- Uses existing `generalLimiter` rate limiting

### Frontend

#### `frontend/src/services/cardService.js`
- Added `getCardsByIds(ids: string[])` method

#### `frontend/src/pages/DeckBuilder.jsx`
- Refactored `handleImport` to use batch endpoint
- Added `importing` state for loading indicator
- Shows spinner and "Importing..." text during import
- Disabled cancel/import buttons during import

## Performance Impact
- **Before**: ~250ms per card * 20 unique cards = ~5 seconds
- **After**: Single batch request ~500-1000ms (parallel fetches internally)
- **Improvement**: ~5-10x faster

## API Contract

### Request
```http
POST /api/cards/batch
Content-Type: application/json

{
  "ids": ["sv1-25", "sv1-189", "sv1-257"]
}
```

### Response
```json
{
  "success": true,
  "data": {
    "cards": {
      "sv1-25": {
        "id": "sv1-25",
        "name": "Pikachu ex",
        "supertype": "Pokemon",
        "images": { "small": "...", "large": "..." },
        "set": { "name": "Scarlet & Violet" },
        "tcgSystem": "pokemon"
      }
    },
    "notFound": ["invalid-id"]
  }
}
```

## Notes
- The batch endpoint uses the existing `unifiedTCGService.getCardById` which has 3-level caching (memory, MongoDB, API)
- Cards in cache will be returned nearly instantly
- Non-cached cards are fetched in parallel from external APIs
