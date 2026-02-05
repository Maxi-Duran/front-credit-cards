export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',
  endpoints: {
    auth: {
      login: '/auth/login',
      logout: '/auth/logout',
      me: '/auth/me',
      refresh: '/auth/refresh',
      profile: '/auth/profile'
    },
    accounts: {
      me: '/accounts/me',
      list: '/accounts',
      detail: '/accounts/:id',
      update: '/accounts/:id',
      search: '/accounts/search'
    },
    cards: {
      list: '/cards',
      detail: '/cards/:id',
      update: '/cards/:id',
      operations: '/cards/:id/operations',
      search: '/cards/search',
      byAccount: '/accounts/:accountId/cards'
    },
    transactions: {
      list: '/transactions',
      detail: '/transactions/:id',
      create: '/transactions',
      byCard: '/cards/:cardId/transactions',
      types: '/transaction-types'
    },
    reports: {
      generate: '/reports/generate',
      download: '/reports/:id/download',
      list: '/reports'
    },
    payments: {
      process: '/payments',
      history: '/payments/history',
      methods: '/payment-methods'
    },
    authorizations: {
      pending: '/authorizations/pending',
      detail: '/authorizations/:id',
      approve: '/authorizations/:id/approve',
      deny: '/authorizations/:id/deny'
    },
    admin: {
      users: '/admin/users',
      userDetail: '/admin/users/:id',
      transactionTypes: '/admin/transaction-types',
      systemConfig: '/admin/config'
    }
  },
  features: {
    fraudDetection: true,
    realTimeUpdates: true,
    multiLanguage: true,
    mobileSupport: true
  },
  ui: {
    defaultLanguage: 'es',
    supportedLanguages: ['es', 'en'],
    theme: 'indigo-pink',
    pageSize: 10,
    maxPageSize: 100
  },
  security: {
    tokenKey: 'carddemo_token',
    refreshTokenKey: 'carddemo_refresh_token',
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    maxLoginAttempts: 3
  }
};