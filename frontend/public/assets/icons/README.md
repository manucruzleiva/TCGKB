# TCGKB Icon Assets

This folder contains SVG icons for TCG card types, energy types, and domains.

## Structure

```
icons/
├── pokemon-types/       # Pokemon Energy Type Icons (for filter bar)
│   ├── fire.svg
│   ├── water.svg
│   ├── grass.svg
│   ├── electric.svg
│   ├── psychic.svg
│   ├── fighting.svg
│   ├── dark.svg
│   ├── steel.svg
│   ├── dragon.svg
│   ├── fairy.svg
│   └── colorless.svg
│
├── pokemon-cardtypes/   # Pokemon Card Type Icons (supertype)
│   ├── pokemon.svg      # Pokeball icon
│   ├── trainer.svg      # Ash's cap
│   ├── supporter.svg    # Person silhouette
│   ├── item.svg         # Rare Candy style
│   ├── tool.svg         # Wrench
│   ├── stadium.svg      # Battle arena
│   └── energy.svg       # Lightning bolt
│
├── riftbound-domains/   # Riftbound Domain Icons (for filter bar)
│   ├── fury.svg         # Fire/Flame
│   ├── calm.svg         # Water/Drop
│   ├── mind.svg         # Eye/Psychic
│   ├── body.svg         # Shield/Strength
│   ├── order.svg        # Star/Balance
│   └── chaos.svg        # Spiral/Entropy
│
└── riftbound-types/     # Riftbound Card Type Icons (supertype)
    ├── unit.svg         # Character/Unit
    ├── spell.svg        # Star/Magic
    ├── battlefield.svg  # Grid/Arena
    └── item.svg         # Artifact/Object
```

## Sources

| Category | Source | License |
|----------|--------|---------|
| Pokemon Energy | [Bulbapedia Energy Cards](https://bulbapedia.bulbagarden.net/wiki/Energy_card_(TCG)) | Fair Use |
| Pokemon Card Types | [Bulbapedia TCG](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Trading_Card_Game) | Fair Use |
| Riftbound Icons | [Google Drive - Riftbound Assets](https://drive.google.com/drive/u/0/folders/11V-sIN0JMAT-gADkSoPOhzuavmLwQUqB) | Official |

## Usage

### In React Components

```jsx
// As image
<img src="/assets/icons/pokemon-types/fire.svg" alt="Fire" width={24} />

// As background
<div style={{ backgroundImage: 'url(/assets/icons/pokemon-types/fire.svg)' }} />
```

### Icon Components

The `TypeIcon` and `DomainIcon` components in `src/components/icons/` use inline SVG for better control.
These static files can be used as fallback or for other use cases.

## Replacing Placeholder Icons

Some icons are placeholders. To replace with official assets:

1. Download from the source (Bulbapedia or Google Drive)
2. Convert to SVG if needed (use vectorizer or trace)
3. Replace the file keeping the same filename
4. Maintain 100x100 viewBox for consistency
