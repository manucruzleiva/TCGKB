export const es = {
  // Navigation
  nav: {
    home: 'Inicio',
    search: 'Buscar',
    login: 'Iniciar sesión',
    register: 'Registrarse',
    logout: 'Cerrar sesión',
    profile: 'Perfil'
  },

  // Search
  search: {
    placeholder: 'Buscar cartas por nombre...',
    button: 'Buscar',
    results: 'resultados',
    noResults: 'No se encontraron cartas',
    loading: 'Buscando...',
    cached: 'En caché',
    loadingCards: 'Cargando cartas...',
    errorLoadingCards: 'Error cargando cartas. Inténtalo de nuevo.',
    tryAgain: 'Intentar de nuevo',
    cancel: 'Cancelar',
    searching: 'Buscando',
    showingRecent: 'Mostrando las cartas más recientes'
  },

  // Card Details
  card: {
    set: 'Set',
    releaseDate: 'Fecha de lanzamiento',
    enterLegal: 'Legal desde',
    regulationMark: 'Marca de regulación',
    type: 'Tipo',
    types: 'Tipos',
    hp: 'PS',
    attacks: 'Ataques',
    abilities: 'Habilidades',
    notLegal: 'No legal',
    rotatingSoon: 'Rotando pronto',
    communityActivity: 'Actividad de la comunidad',
    alternateArts: 'Artes Alternativos'
  },

  // Comments
  comments: {
    title: 'Comentarios',
    placeholder: 'Escribe tu comentario... (usa @ para mencionar cartas)',
    replyPlaceholder: 'Escribe tu respuesta... (usa @ para mencionar cartas)',
    loginPrompt: 'para dejar un comentario',
    submit: 'Comentar',
    reply: 'Responder',
    edit: 'Editar',
    delete: 'Eliminar',
    hide: 'Ocultar',
    show: 'Mostrar',
    cancel: 'Cancelar',
    save: 'Guardar',
    posting: 'Publicando...',
    replying: 'Respondiendo...',
    empty: 'El comentario no puede estar vacío',
    beFirst: 'Sé el primero en reaccionar',
    noComments: 'No hay comentarios aún',
    noCommentsPrompt: 'No hay comentarios aún. ¡Sé el primero en comentar!',
    loadingComments: 'Cargando comentarios...',
    searching: 'Buscando...',
    leaveComment: 'Deja un comentario'
  },

  // Pages
  pages: {
    cardDetails: {
      loading: 'Cargando carta...',
      errorLoading: 'Error al cargar la carta',
      backToHome: 'Volver al inicio',
      backToSearch: 'Volver a búsqueda'
    },
    home: {
      title: 'TCG Knowledge Base',
      subtitle: 'Busca, explora y comenta sobre tus juegos de cartas coleccionables favoritos'
    }
  },

  // Reactions
  reactions: {
    change: 'Cambiar reacción',
    react: 'Reaccionar'
  },

  // Auth
  auth: {
    login: 'Iniciar sesión',
    register: 'Registrarse',
    email: 'Correo electrónico',
    username: 'Usuario',
    password: 'Contraseña',
    confirmPassword: 'Confirmar contraseña',
    forgotPassword: '¿Olvidaste tu contraseña?',
    noAccount: '¿No tienes cuenta?',
    hasAccount: '¿Ya tienes cuenta?',
    signUp: 'Regístrate',
    signIn: 'Inicia sesión'
  },

  // Common
  common: {
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    close: 'Cerrar',
    back: 'Atrás',
    next: 'Siguiente',
    previous: 'Anterior',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    clear: 'Limpiar',
    retry: 'Reintentar'
  },

  // Time
  time: {
    now: 'Ahora',
    minutesAgo: 'hace unos minutos',
    hoursAgo: 'hace unas horas',
    daysAgo: 'hace unos días',
    weeksAgo: 'hace unas semanas',
    monthsAgo: 'hace unos meses',
    yearsAgo: 'hace unos años'
  },

  // Deck Import
  deckImport: {
    title: 'Importar Mazo',
    instructions: 'Pega tu lista de mazo. Formatos Pokemon TCG Live, Pokemon Pocket y Riftbound son soportados.',
    placeholder: 'Pokémon: 12\n4 Pikachu ex SVI 057\n4 Raichu SVI 058\n\nTrainer: 36\n4 Professor\'s Research SVI 189\n\nEnergy: 12\n8 Electric Energy SVE 004',
    parseError: 'Error al analizar el mazo',
    importError: 'Error al importar el mazo',
    importing: 'Importando...',
    importButton: 'Importar Mazo',
    preview: 'Vista previa',
    cards: 'cartas',
    uniqueCards: 'cartas únicas',
    pokemon: 'Pokémon',
    trainer: 'Entrenador',
    energy: 'Energía',
    unknown: 'Desconocido',
    confidence: 'confianza',
    parseWarnings: 'Advertencias de análisis',
    more: 'más',
    reprintGroups: 'Límites de copias',
    exceedLimit: 'exceden límite',
    unlimitedCopies: 'Energía Básica - copias ilimitadas',
    autoDetect: 'Auto-detectar',
    autoDetected: 'auto',
    manualOverride: 'Manual'
  },

  // Deck Validation
  deckValidation: {
    valid: 'Mazo válido',
    invalid: 'Mazo inválido',
    cards: 'cartas',
    errors: 'Errores',
    warnings: 'Advertencias',
    basicPokemon: 'Pokémon Básico',
    errorCardCount: 'El mazo debe tener exactamente {{expected}} cartas (actualmente {{current}})',
    errorCopyLimit: '"{{card}}" excede el límite de {{limit}} copias ({{current}}/{{limit}})',
    errorSingleton: '"{{card}}" excede el límite singleton ({{current}}/1)',
    errorNoBasic: 'El mazo debe tener al menos 1 Pokémon Básico',
    errorAceSpec: 'El mazo solo puede tener 1 carta ACE SPEC (actualmente {{current}})',
    errorRadiant: 'El mazo solo puede tener 1 Pokémon Radiant (actualmente {{current}})',
    errorRuleBox: 'Los Pokémon Rule Box (ex, V, VSTAR, VMAX, Radiant) no están permitidos en GLC',
    errorAceSpecGLC: 'Las cartas ACE SPEC no están permitidas en GLC'
  },

  // Support / Monetization
  support: {
    footerLink: 'Apoyar',
    buttonTooltip: 'Apoya TCGKB',
    pageTitle: 'Apoya TCGKB',
    pageSubtitle: 'Ayuda a mantener este proyecto vivo y en crecimiento',
    whySupport: {
      title: '¿Por qué apoyar?',
      reason1: 'Mantener los servidores funcionando 24/7',
      reason2: 'Desarrollar nuevas funcionalidades',
      reason3: 'Mantener la base de datos actualizada',
      reason4: 'Sin anuncios invasivos'
    },
    costs: {
      title: 'Costos mensuales',
      hosting: 'Hosting (Vercel Pro)',
      database: 'Base de datos (MongoDB Atlas)',
      apis: 'APIs externas',
      domain: 'Dominio',
      total: 'Total aproximado'
    },
    tiers: {
      title: 'Niveles de apoyo',
      supporter: {
        name: 'Supporter',
        price: '$3/mes',
        benefit1: 'Badge especial en perfil',
        benefit2: 'Nombre en lista de supporters'
      },
      champion: {
        name: 'Champion',
        price: '$5/mes',
        benefit1: 'Todo lo anterior',
        benefit2: 'Acceso anticipado a features',
        benefit3: 'Canal de Discord exclusivo'
      },
      hero: {
        name: 'Hero',
        price: '$10/mes',
        benefit1: 'Todo lo anterior',
        benefit2: 'Tu nombre en el footer',
        benefit3: 'Sugerir features prioritarias'
      }
    },
    cta: {
      primary: 'Apoyar en GitHub Sponsors',
      oneTime: 'Donación única también disponible'
    },
    thanks: {
      title: 'Gracias a nuestros supporters',
      description: 'Estas personas hacen posible que TCGKB siga creciendo'
    }
  }
}

export default es
