export const en = {
  // Navigation
  nav: {
    home: 'Home',
    search: 'Search',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    profile: 'Profile'
  },

  // Search
  search: {
    placeholder: 'Search cards by name...',
    button: 'Search',
    results: 'results',
    noResults: 'No cards found',
    loading: 'Searching...',
    cached: 'Cached',
    loadingCards: 'Loading cards...',
    errorLoadingCards: 'Error loading cards. Please try again.',
    tryAgain: 'Try again',
    cancel: 'Cancel',
    searching: 'Searching',
    showingRecent: 'Showing most recent cards'
  },

  // Card Details
  card: {
    set: 'Set',
    releaseDate: 'Release Date',
    enterLegal: 'Enter Legal Format',
    regulationMark: 'Regulation Mark',
    type: 'Type',
    types: 'Types',
    hp: 'HP',
    attacks: 'Attacks',
    abilities: 'Abilities',
    notLegal: 'Not Legal',
    rotatingSoon: 'Rotating Soon',
    communityActivity: 'Community Activity',
    alternateArts: 'Alternate Arts'
  },

  // Comments
  comments: {
    title: 'Comments',
    placeholder: 'Write your comment... (use @ to mention cards)',
    replyPlaceholder: 'Write your reply... (use @ to mention cards)',
    loginPrompt: 'to leave a comment',
    submit: 'Comment',
    reply: 'Reply',
    edit: 'Edit',
    delete: 'Delete',
    hide: 'Hide',
    show: 'Show',
    cancel: 'Cancel',
    save: 'Save',
    posting: 'Posting...',
    replying: 'Replying...',
    empty: 'Comment cannot be empty',
    beFirst: 'Be the first to react',
    noComments: 'No comments yet',
    noCommentsPrompt: 'No comments yet. Be the first to comment!',
    loadingComments: 'Loading comments...',
    searching: 'Searching...',
    leaveComment: 'Leave a comment'
  },

  // Reactions
  reactions: {
    change: 'Change reaction',
    react: 'React'
  },

  // Auth
  auth: {
    login: 'Login',
    register: 'Register',
    email: 'Email',
    username: 'Username',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    signUp: 'Sign up',
    signIn: 'Sign in'
  },

  // Common
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    clear: 'Clear',
    retry: 'Retry'
  },

  // Time
  time: {
    now: 'Now',
    minutesAgo: 'minutes ago',
    hoursAgo: 'hours ago',
    daysAgo: 'days ago',
    weeksAgo: 'weeks ago',
    monthsAgo: 'months ago',
    yearsAgo: 'years ago'
  },

  // Pages
  pages: {
    cardDetails: {
      loading: 'Loading card...',
      errorLoading: 'Error loading card',
      backToHome: 'Back to home',
      backToSearch: 'Back to search'
    },
    home: {
      title: 'TCG Knowledge Base',
      subtitle: 'Search, explore and comment on your favorite trading card games'
    },
    roadmap: {
      title: 'Roadmap',
      backToHome: 'Back to home',
      subtitle: 'Planned features and development progress',
      viewOnGithub: 'View on GitHub',
      overallProgress: 'Overall Progress',
      completed: 'completed',
      pending: 'pending',
      inProgress: 'In Progress',
      planned: 'Planned',
      backlog: 'Backlog',
      done: 'Done',
      showCompleted: 'Show completed',
      item: 'item',
      items: 'items',
      error: 'Error loading roadmap',
      autoUpdated: 'The roadmap is automatically updated from',
      emptyMessage: 'Items must be added to the GitHub Project to appear here.',
      fewItemsMessage: 'Only showing items from the GitHub Project board.'
    }
  },

  // Deck Import
  deckImport: {
    title: 'Import Deck',
    instructions: 'Paste your deck list. Pokemon TCG Live, Pokemon Pocket, and Riftbound formats are supported.',
    placeholder: 'Pokémon: 12\n4 Pikachu ex SVI 057\n4 Raichu SVI 058\n\nTrainer: 36\n4 Professor\'s Research SVI 189\n\nEnergy: 12\n8 Electric Energy SVE 004',
    parseError: 'Error parsing deck',
    importError: 'Error importing deck',
    importing: 'Importing...',
    importButton: 'Import Deck',
    preview: 'Preview',
    cards: 'cards',
    uniqueCards: 'unique cards',
    pokemon: 'Pokémon',
    trainer: 'Trainer',
    energy: 'Energy',
    unknown: 'Unknown',
    confidence: 'confidence',
    parseWarnings: 'Parse warnings',
    more: 'more',
    reprintGroups: 'Copy limits',
    exceedLimit: 'exceed limit',
    unlimitedCopies: 'Basic Energy - unlimited copies',
    autoDetect: 'Auto-detect',
    autoDetected: 'auto',
    manualOverride: 'Manual'
  },

  // Deck Validation
  deckValidation: {
    valid: 'Valid deck',
    invalid: 'Invalid deck',
    cards: 'cards',
    errors: 'Errors',
    warnings: 'Warnings',
    basicPokemon: 'Basic Pokémon',
    errorCardCount: 'Deck must have exactly {{expected}} cards (currently {{current}})',
    errorCopyLimit: '"{{card}}" exceeds {{limit}} copy limit ({{current}}/{{limit}})',
    errorSingleton: '"{{card}}" exceeds singleton limit ({{current}}/1)',
    errorNoBasic: 'Deck must have at least 1 Basic Pokémon',
    errorAceSpec: 'Deck can only have 1 ACE SPEC card (currently {{current}})',
    errorRadiant: 'Deck can only have 1 Radiant Pokémon (currently {{current}})',
    errorRuleBox: 'Rule Box Pokémon (ex, V, VSTAR, VMAX, Radiant) are not allowed in GLC',
    errorAceSpecGLC: 'ACE SPEC cards are not allowed in GLC',
    errorRegulationMark: '{{current}} card(s) are not legal in Standard (valid marks: {{validMarks}})',
    errorProfessorGroup: 'Only 1 Professor card allowed in GLC (Professor\'s Research, Juniper, or Sycamore). Currently {{current}}',
    errorBossGroup: 'Only 1 Boss card allowed in GLC (Boss\'s Orders or Lysandre). Currently {{current}}',
    errorMainDeckCount: 'Main deck must have exactly {{expected}} cards (currently {{current}})',
    errorLegendCount: 'Deck must have exactly 1 Legend (currently {{current}})',
    errorBattlefieldCount: 'Deck must have exactly 3 Battlefields (currently {{current}})',
    errorRuneCount: 'Deck must have exactly 12 Runes (currently {{current}})',
    errorSideboardCount: 'Sideboard must have exactly 8 cards if used (currently {{current}})',
    errorDomainRestriction: '{{current}} card(s) don\'t match Legend\'s domains ({{domains}})'
  },

  // Decks
  decks: {
    tabs: {
      myDecks: 'My Decks',
      community: 'Community'
    },
    title: 'Decks',
    subtitle: 'Explore community decks or create your own',
    createDeck: 'Create Deck',
    import: 'Import',
    search: 'Search decks...',
    noDecks: 'No decks found',
    noMyDecks: "You haven't created any decks yet",
    noCommunityDecks: 'No public decks yet',
    beFirst: 'Be the first to create a deck',
    sortRecent: 'Recent',
    sortPopular: 'Popular',
    sortVotes: 'Votes',
    vote: {
      upvote: 'Upvote',
      downvote: 'Downvote'
    },
    originalBadge: {
      tooltip: 'The First - This deck has a unique composition'
    },
    // List page
    tags: 'Tags',
    sortLabel: 'Sort:',
    activeFilters: 'Active filters:',
    clearAll: 'Clear all',
    public: 'Public',
    private: 'Private',
    previous: 'Previous',
    next: 'Next',
    // Import modal
    importModal: {
      title: 'Import Deck',
      deckName: 'Deck name',
      deckNamePlaceholder: 'My new deck',
      cardList: 'Card list',
      cardListPlaceholder: '4 Pikachu SV1 25\n3 Raichu SV1 26\n...',
      formatHint: 'Format: "quantity Name SET Number" or "quantity SET-Number"',
      cancel: 'Cancel',
      importBtn: 'Import',
      errorPasteCards: 'Paste the card list',
      errorNameRequired: 'Name is required',
      errorImportFailed: 'Import failed'
    },
    // Detail page
    detail: {
      backToDecks: 'Back to Decks',
      notFound: 'Deck not found',
      noAccess: 'You do not have access to this deck',
      errorLoading: 'Error loading deck',
      errorCopying: 'Error copying deck',
      copiedToClipboard: 'Copied to clipboard',
      errorDeleting: 'Error deleting',
      views: 'views',
      copies: 'copies',
      export: 'Export',
      copyDeck: 'Copy Deck',
      edit: 'Edit',
      delete: 'Delete',
      cards: 'Cards',
      emptyDeck: 'This deck is empty',
      stats: 'Stats',
      missingCards: 'Missing {count} cards',
      overLimit: '{count} cards over limit',
      deckComplete: 'Deck complete',
      deleteConfirm: {
        title: 'Delete deck?',
        message: 'This action cannot be undone. Are you sure you want to delete this deck?',
        cancel: 'Cancel',
        confirm: 'Delete'
      }
    },
    // Stats breakdown
    stats: {
      supporter: 'Supporter',
      item: 'Item',
      tool: 'Tool',
      stadium: 'Stadium'
    }
  },

  // Deck Auto Tags
  deckAutoTags: {
    title: 'Auto Tags',
    format: {
      standard: 'Standard',
      expanded: 'Expanded',
      glc: 'GLC',
      unlimited: 'Unlimited'
    },
    'energy-type': {
      fire: 'Fire',
      water: 'Water',
      grass: 'Grass',
      electric: 'Electric',
      psychic: 'Psychic',
      fighting: 'Fighting',
      dark: 'Dark',
      steel: 'Steel',
      dragon: 'Dragon',
      colorless: 'Colorless',
      fairy: 'Fairy'
    },
    mechanic: {
      'ex-focused': 'ex Focused',
      'v-focused': 'V Focused',
      'vstar': 'VSTAR',
      'vmax': 'VMAX',
      'single-prize': 'Single Prize',
      'lost-zone': 'Lost Zone',
      'rapid-strike': 'Rapid Strike',
      'single-strike': 'Single Strike'
    },
    domain: {
      fury: 'Fury',
      calm: 'Calm',
      mind: 'Mind',
      body: 'Body',
      order: 'Order',
      chaos: 'Chaos'
    }
  },

  // Support / Monetization
  support: {
    footerLink: 'Support',
    buttonTooltip: 'Support TCGKB',
    pageTitle: 'Support TCGKB',
    pageSubtitle: 'Help keep this project alive and growing',
    whySupport: {
      title: 'Why support?',
      reason1: 'Keep servers running 24/7',
      reason2: 'Develop new features',
      reason3: 'Keep the database updated',
      reason4: 'No invasive ads'
    },
    costs: {
      title: 'Monthly costs',
      hosting: 'Hosting (Vercel Pro)',
      database: 'Database (MongoDB Atlas)',
      apis: 'External APIs',
      domain: 'Domain',
      total: 'Approximate total'
    },
    tiers: {
      title: 'Support tiers',
      supporter: {
        name: 'Supporter',
        price: '$3/month',
        benefit1: 'Special profile badge',
        benefit2: 'Name on supporters list'
      },
      champion: {
        name: 'Champion',
        price: '$5/month',
        benefit1: 'All of the above',
        benefit2: 'Early access to features',
        benefit3: 'Exclusive Discord channel'
      },
      hero: {
        name: 'Hero',
        price: '$10/month',
        benefit1: 'All of the above',
        benefit2: 'Your name in the footer',
        benefit3: 'Suggest priority features'
      }
    },
    cta: {
      primary: 'Support on GitHub Sponsors',
      oneTime: 'One-time donation also available'
    },
    thanks: {
      title: 'Thanks to our supporters',
      description: 'These people make it possible for TCGKB to keep growing'
    }
  }
}

export default en
