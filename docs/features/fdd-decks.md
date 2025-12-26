# Feature Specification: Deck Manager

**Status:** Approved for Manu

## 1. Overview

Deck Manager V3 transforms the deck experience from a simple list to a **Unified Ecosystem**. It introduces a restrictive "Building" mechanic with **Smart Reprint Substitution**, a "Live Sync" feature, and an automated metadata engine (`AutoDeckTagger`).

**Base URL:** `tcgkb.app/decks`

---

## 2. User Roles & Access

| Role | Access Level |
| --- | --- |
| **Anon** | **Read-Only**: Community Decks, View Mode, FilterBar, SearchDeckBar. No Import/Create. |
| **User** | **Full Access**: My Decks, Collection Sync, Build/Disarm, Import, Create, Clone, Sync. |
| **User-Restricted** | **Full Access***: Same as User, but cannot Comment on decks. |

### 2.1 Devices

All features need to be design with mobile and desktop aspect ratios in mind and visbilitiby in mind.

---

## 3. UI/UX: The Dashboard (`/decks`)

### 3.1. FilterBar Logic (Visual)

A hierarchical, visual filtering system.

* **Default State:** All icons in **Color** (Nothing filtered, everything visible).
* **Active State:** Clicking an icon turns others to **Grayscale**. Multiple selection allowed.

| Level | Component | Options |
| --- | --- | --- |
| **L1: TCG** | Toggle Switch | `Pokemon` `Riftbound`|
| **L2: Card Type** | Icon Row (Poke) | Supporters, Items, Tools, Stadiums, Energy, Pokemon |
| **L2: Card Type** | Icon Row (Rift) | Legends, Gears, Units, Champions, Spells, Battlefields, Runes |
| **L3: Sub-Type** | Icon Row | **Poke:** Energy Types (Fire, Water, etc.) |
| **L3: Sub-Type** | Icon Row | **Rift:** Domains (Chaos, Fury, Calm, Order, Mind, Body) |

### 3.2. SearchDeckBar

* **Inputs:** Text search (Name/Author).
* **Sort Options:** `Popularity`, `Recent`, `Most Copies`, `Synced`, `Format`.
* **Filter Options** using the FilterBar.

---

## 4. UI/UX: Deck Importer

**Trigger Locations:** `/decks` (Dashboard) and `/decks/create` (Builder).

**Inputs:**

1. **Deck Name:** Text (Optional). Placeholder: "Untitled Deck". **Hidden** if called from `/decks/create`.
2. **Deck String:** Textarea (Required).

**Parsing Rules:**

* **Riftbound:** `<qty> <card name>`.
* *Ambiguity:* Defaults to most recent print. User can swap art in Builder.


* **Pokemon:** `<qty> <cardname> <set> <coll_num>` (PTCGL Format).
* **Low Rarity Rule:** If the string is generic or ambiguous regarding the specific card version, the system **must fetch the lowest rarity version of all reprints** available in the database (e.g., prefer "Common" over "Illustration Rare" or "Secret Rare"). This ensures the deck list defaults to the most accessible version of the card.

**Post-Action Flow:**

* **From Dashboard:** Redirects to `/decks/create`.
* **From Builder:** **Replaces** current deck content (triggers confirmation). Auto-closes modal.

---

## 5. UI/UX: The Builder (`/decks/create`)

**Persistence:** Changes are **auto-saved** to "Draft".

### 5.1. View States

1. **Draft Mode:** Full editing enabled.
2. **Built Mode:** **Read-Only**. Visual indicator "Deck is Built". Must click **[DISARM]** to edit.

### 5.2. Component: DeckInfo (Top Pane)

Contains metadata and system feedback.

* **Validation Status (`DeckValidator`):**
* **Notification Messages:** Real-time feedback box that verifies **gameplay rules and format composition** (ensuring the deck complies with specific game restrictions).
* **Valid:** Green checkmark "Tournament Legal (Standard)" or "Legal (GLC)", etc...
* **Invalid:** Red warning list detailing specific rule violations (e.g., "Deck has 56/60 cards", "More than 4 copies of Pikachu", "Card [Name] is banned in Standard format").
* **Resctrictions** a invalid deck cannot be push to public, it auto changes to private.


* **AutoDeckTagger:**
* Dynamic chips generated automatically based on composition.
* The tags sould be individual.
* *Examples:* "Water/Metal", "Lost Zone Engine", "Single Prize", "Domain: Fury".


* **Metadata:** Name, Description.
* **Privacy:** Public/Private toggle.
* **Action Bar:**
* `[SAVE]`
* `[EXPORT]`
* `[SHARE]` (Opens native OS share dialog or copies link to clipboard).
* `[HELP]`
* `[DELETE]`



### 5.3. Component: CardSelected (The List)

* Visual list of cards. Grouped by Supertype.
* **Interaction:** `+` / `-` buttons, Drag & Drop.

### 5.4. Component: CardSearch & Playmat

* **CardFilter:** Same logic as Dashboard, plus `[x] Show Only Owned`.
* **The Playmat (Grid):** Infinite scroll, Quantity Overlay (e.g., `2/4`), Dimmed if max copies reached(maxcopies is defined by the format).

---

## 6. UI/UX: View Mode (`/decks/:id`)

Primary view for **Built Decks** and **Community Decks**.

### 6.1. Features

* **DeckInfo Read-Only:** Shows `DeckValidator` status, `AutoDeckTagger` chips, and `[SHARE]` button.
* **Social:** Comments, Reactions.
* **Collection Analysis:**
* Displays "You own X/60 cards".
* Highlight missing cards visually.



### 6.2. Action Buttons

* **CLONE:** Creates a detached draft in "My Decks".
* **SYNC:** Creates a **"Live Copy"** (auto-updates when author updates).
* **REQUEST HELP (Smart Share):**
* *Condition:* Visible only if `missing_cards > 0` based on the user's collection.
* *Action:* Auto-generates a composite **PNG Image** displaying only the missing cards and their required quantities.
* *Use Case:* Facilitates sharing on social media (Discord/WhatsApp) to request trades or loans.



---

## 7. Feature Logic: Smart Collection Integration

### 7.1. Build & Disarm (Restrictive with Smart Substitution)

This feature manages the user's digital inventory and handles card versions intelligently.

* **Action: BUILD**
* **Step 1: Exact Match Check:** System checks if `Collection` has enough quantity of the *exact* card IDs listed in the deck.
* **Step 2: Smart Reprint Substitution:**
* If the user lacks the specific version (e.g., *Charizard ex Obsidian Flames - Gold Rare*), the system checks for **any valid reprint** (e.g., *Charizard ex Obsidian Flames - Regular*) in the user's available collection.
* *Priority:* Use exact match first → then use available reprints.


* **Step 3: Execution:**
* Deducts quantities from `Collection` (Available → In Use).
* **Note:** If reprints were used, the "Built" deck visual might differ slightly from the "Draft" list (showing the cards the user *actually* owns).
* Sets Deck State to `BUILT`.


* **Feedback:** "Built successfully using 3 alternate versions from your collection" OR "Failed: Missing 2 cards."


* **Action: DISARM**
* Returns the exact cards (including specific reprints used) to `Collection` (In Use → Available).
* Sets Deck State to `DRAFT`.



### 7.2. Live Sync Conflicts

* If a synced deck is updated by the author, and the user has it `BUILT`:
* User sees notification: "Deck Updated".
* Must `DISARM` → `FORCE SYNC` → `BUILD` (triggering Smart Substitution again for the new list).



---

## 8. Technical Data Models (Updates)

### Deck Schema Extension

```javascript
{
  // ... existing fields
  status: 'draft' | 'built',
  autoTags: [String],     // Populated by AutoDeckTagger
  validationStatus: {     // Populated by DeckValidator
    isValid: Boolean,
    errors: [String],
    format: String
  },
  builtComposition: [{    // Stores the ACTUAL cards used from collection
    cardId: String,
    quantity: Number
  }]
}

```

### API Extensions

* `POST /api/decks/parse`: "Low Rarity" fetch.
* `POST /api/decks/:id/build`: Logic update for "Smart Reprint Substitution".
* `GET /api/cards/reprints/:name`: Helper to find valid alternates.
* `POST /api/decks/generate-missing-png`: Endpoint to generate the "Request Help" image asset [Optional, can be client-side canvas].
