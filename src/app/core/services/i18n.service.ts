import { Injectable, signal, computed } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import localeEn from '@angular/common/locales/en';

export type SupportedLanguage = 'es' | 'en';

export interface TranslationKeys {
  [key: string]: string | TranslationKeys;
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly STORAGE_KEY = 'carddemo_language';
  private currentLanguageSignal = signal<SupportedLanguage>('es');
  private translationsSignal = signal<TranslationKeys>({});

  currentLanguage = this.currentLanguageSignal.asReadonly();
  translations = computed(() => this.translationsSignal());

  constructor() {
    // Register locale data for Angular pipes
    registerLocaleData(localeEs, 'es');
    registerLocaleData(localeEn, 'en');

    // Load saved language preference or default to Spanish
    const savedLanguage = this.loadLanguagePreference();
    this.setLanguage(savedLanguage);
  }

  /**
   * Set the current language and load translations
   */
  setLanguage(language: SupportedLanguage): void {
    this.currentLanguageSignal.set(language);
    this.saveLanguagePreference(language);
    this.loadTranslations(language);
  }

  /**
   * Get the current language
   */
  getLanguage(): SupportedLanguage {
    return this.currentLanguageSignal();
  }

  /**
   * Toggle between Spanish and English
   */
  toggleLanguage(): void {
    const newLanguage = this.currentLanguageSignal() === 'es' ? 'en' : 'es';
    this.setLanguage(newLanguage);
  }

  /**
   * Translate a key to the current language
   */
  translate(key: string, params?: Record<string, string | number>): string {
    const translation = this.getNestedTranslation(key);
    
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }

    // Replace parameters in translation
    if (params) {
      return this.replaceParams(translation, params);
    }

    return translation;
  }

  /**
   * Get translation for a specific language (useful for testing)
   */
  translateForLanguage(key: string, language: SupportedLanguage, params?: Record<string, string | number>): string {
    const translations = this.getTranslationsForLanguage(language);
    const translation = this.getNestedValue(translations, key);
    
    if (!translation) {
      return key;
    }

    if (params) {
      return this.replaceParams(translation, params);
    }

    return translation;
  }

  /**
   * Get locale string for Angular pipes
   */
  getLocale(): string {
    return this.currentLanguageSignal() === 'es' ? 'es-ES' : 'en-US';
  }

  /**
   * Format date according to current locale
   */
  formatDate(date: Date | string, format: 'short' | 'medium' | 'long' | 'full' = 'medium'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const locale = this.getLocale();
    
    let options: Intl.DateTimeFormatOptions;
    
    switch (format) {
      case 'short':
        options = { year: 'numeric', month: 'numeric', day: 'numeric' };
        break;
      case 'medium':
        options = { year: 'numeric', month: 'short', day: 'numeric' };
        break;
      case 'long':
        options = { year: 'numeric', month: 'long', day: 'numeric' };
        break;
      case 'full':
        options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        break;
    }

    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  }

  /**
   * Format number according to current locale
   */
  formatNumber(value: number, decimals: number = 2): string {
    const locale = this.getLocale();
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }

  /**
   * Format currency according to current locale
   */
  formatCurrency(value: number, currency: string = 'USD'): string {
    const locale = this.getLocale();
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(value);
  }

  private loadLanguagePreference(): SupportedLanguage {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved === 'es' || saved === 'en') {
        return saved;
      }
    } catch (error) {
      console.warn('Failed to load language preference:', error);
    }
    return 'es'; // Default to Spanish
  }

  private saveLanguagePreference(language: SupportedLanguage): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, language);
      sessionStorage.setItem(this.STORAGE_KEY, language);
    } catch (error) {
      console.warn('Failed to save language preference:', error);
    }
  }

  private loadTranslations(language: SupportedLanguage): void {
    const translations = this.getTranslationsForLanguage(language);
    this.translationsSignal.set(translations);
  }

  private getTranslationsForLanguage(language: SupportedLanguage): TranslationKeys {
    // Import translations based on language
    return language === 'es' ? this.getSpanishTranslations() : this.getEnglishTranslations();
  }

  private getNestedTranslation(key: string): string {
    return this.getNestedValue(this.translationsSignal(), key);
  }

  private getNestedValue(obj: TranslationKeys, path: string): string {
    const keys = path.split('.');
    let current: any = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return '';
      }
    }

    return typeof current === 'string' ? current : '';
  }

  private replaceParams(text: string, params: Record<string, string | number>): string {
    let result = text;
    Object.keys(params).forEach(key => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(params[key]));
    });
    return result;
  }

  private getSpanishTranslations(): TranslationKeys {
    return {
      common: {
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        edit: 'Editar',
        add: 'Agregar',
        search: 'Buscar',
        filter: 'Filtrar',
        clear: 'Limpiar',
        close: 'Cerrar',
        back: 'Volver',
        next: 'Siguiente',
        previous: 'Anterior',
        submit: 'Enviar',
        loading: 'Cargando...',
        noData: 'No hay datos disponibles',
        error: 'Error',
        success: 'Éxito',
        warning: 'Advertencia',
        info: 'Información',
        confirm: 'Confirmar',
        yes: 'Sí',
        no: 'No',
        ok: 'Aceptar',
        actions: 'Acciones',
        details: 'Detalles',
        view: 'Ver',
        update: 'Actualizar',
        refresh: 'Actualizar',
        export: 'Exportar',
        print: 'Imprimir',
        download: 'Descargar'
      },
      auth: {
        login: 'Iniciar Sesión',
        logout: 'Cerrar Sesión',
        username: 'Usuario',
        password: 'Contraseña',
        rememberMe: 'Recordarme',
        forgotPassword: 'Olvidé mi contraseña',
        loginError: 'Usuario o contraseña incorrectos',
        sessionExpired: 'Su sesión ha expirado',
        welcomeBack: 'Bienvenido de nuevo',
        pleaseLogin: 'Por favor inicie sesión para continuar'
      },
      navigation: {
        home: 'Inicio',
        dashboard: 'Panel de Control',
        accounts: 'Cuentas',
        cards: 'Tarjetas',
        transactions: 'Transacciones',
        reports: 'Reportes',
        payments: 'Pagos',
        authorizations: 'Autorizaciones',
        admin: 'Administración',
        users: 'Usuarios',
        transactionTypes: 'Tipos de Transacción',
        settings: 'Configuración',
        profile: 'Perfil',
        help: 'Ayuda'
      },
      account: {
        title: 'Gestión de Cuentas',
        list: 'Lista de Cuentas',
        details: 'Detalles de Cuenta',
        add: 'Agregar Cuenta',
        edit: 'Editar Cuenta',
        accountNumber: 'Número de Cuenta',
        accountType: 'Tipo de Cuenta',
        balance: 'Saldo',
        status: 'Estado',
        openDate: 'Fecha de Apertura',
        lastActivity: 'Última Actividad',
        customer: 'Cliente',
        customerId: 'ID de Cliente',
        active: 'Activa',
        inactive: 'Inactiva',
        closed: 'Cerrada',
        suspended: 'Suspendida'
      },
      card: {
        title: 'Gestión de Tarjetas',
        list: 'Lista de Tarjetas',
        details: 'Detalles de Tarjeta',
        add: 'Agregar Tarjeta',
        edit: 'Editar Tarjeta',
        cardNumber: 'Número de Tarjeta',
        cardType: 'Tipo de Tarjeta',
        expirationDate: 'Fecha de Vencimiento',
        creditLimit: 'Límite de Crédito',
        availableCredit: 'Crédito Disponible',
        lastUsed: 'Último Uso',
        status: 'Estado',
        active: 'Activa',
        blocked: 'Bloqueada',
        expired: 'Vencida',
        pending: 'Pendiente',
        block: 'Bloquear',
        activate: 'Activar'
      },
      transaction: {
        title: 'Gestión de Transacciones',
        list: 'Lista de Transacciones',
        details: 'Detalles de Transacción',
        add: 'Agregar Transacción',
        transactionId: 'ID de Transacción',
        amount: 'Monto',
        type: 'Tipo',
        description: 'Descripción',
        merchant: 'Comercio',
        date: 'Fecha',
        status: 'Estado',
        authorizationCode: 'Código de Autorización',
        fraudIndicator: 'Indicador de Fraude',
        completed: 'Completada',
        pending: 'Pendiente',
        failed: 'Fallida',
        cancelled: 'Cancelada',
        filterByDate: 'Filtrar por Fecha',
        filterByAmount: 'Filtrar por Monto',
        filterByType: 'Filtrar por Tipo'
      },
      report: {
        title: 'Reportes',
        generate: 'Generar Reporte',
        configuration: 'Configuración de Reporte',
        dateRange: 'Rango de Fechas',
        startDate: 'Fecha Inicio',
        endDate: 'Fecha Fin',
        format: 'Formato',
        exportPdf: 'Exportar a PDF',
        exportCsv: 'Exportar a CSV',
        noDataAvailable: 'No hay datos disponibles para el criterio seleccionado',
        generationError: 'Error al generar el reporte'
      },
      payment: {
        title: 'Pagos de Facturas',
        makePayment: 'Realizar Pago',
        currentBalance: 'Saldo Actual',
        paymentAmount: 'Monto del Pago',
        paymentMethod: 'Método de Pago',
        paymentDate: 'Fecha de Pago',
        confirmation: 'Confirmación de Pago',
        success: 'Pago procesado exitosamente',
        failed: 'Error al procesar el pago',
        retry: 'Reintentar'
      },
      authorization: {
        title: 'Gestión de Autorizaciones',
        pending: 'Autorizaciones Pendientes',
        details: 'Detalles de Autorización',
        approve: 'Aprobar',
        deny: 'Denegar',
        requestDate: 'Fecha de Solicitud',
        riskScore: 'Puntuación de Riesgo',
        fraudIndicators: 'Indicadores de Fraude',
        approved: 'Aprobada',
        denied: 'Denegada',
        expired: 'Expirada',
        auditTrail: 'Registro de Auditoría'
      },
      admin: {
        title: 'Administración',
        userManagement: 'Gestión de Usuarios',
        transactionTypeManagement: 'Gestión de Tipos de Transacción',
        addUser: 'Agregar Usuario',
        editUser: 'Editar Usuario',
        deleteUser: 'Eliminar Usuario',
        role: 'Rol',
        permissions: 'Permisos',
        regular: 'Regular',
        administrator: 'Administrador'
      },
      validation: {
        required: 'Este campo es requerido',
        minLength: 'Longitud mínima: {{min}} caracteres',
        maxLength: 'Longitud máxima: {{max}} caracteres',
        email: 'Correo electrónico inválido',
        pattern: 'Formato inválido',
        min: 'Valor mínimo: {{min}}',
        max: 'Valor máximo: {{max}}',
        invalidDate: 'Fecha inválida',
        invalidAmount: 'Monto inválido'
      },
      error: {
        generic: 'Ha ocurrido un error',
        network: 'Error de conexión',
        unauthorized: 'No autorizado',
        forbidden: 'Acceso denegado',
        notFound: 'No encontrado',
        serverError: 'Error del servidor',
        timeout: 'Tiempo de espera agotado',
        retry: 'Reintentar',
        contactSupport: 'Contactar soporte'
      }
    };
  }

  private getEnglishTranslations(): TranslationKeys {
    return {
      common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        search: 'Search',
        filter: 'Filter',
        clear: 'Clear',
        close: 'Close',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        submit: 'Submit',
        loading: 'Loading...',
        noData: 'No data available',
        error: 'Error',
        success: 'Success',
        warning: 'Warning',
        info: 'Information',
        confirm: 'Confirm',
        yes: 'Yes',
        no: 'No',
        ok: 'OK',
        actions: 'Actions',
        details: 'Details',
        view: 'View',
        update: 'Update',
        refresh: 'Refresh',
        export: 'Export',
        print: 'Print',
        download: 'Download'
      },
      auth: {
        login: 'Login',
        logout: 'Logout',
        username: 'Username',
        password: 'Password',
        rememberMe: 'Remember Me',
        forgotPassword: 'Forgot Password',
        loginError: 'Invalid username or password',
        sessionExpired: 'Your session has expired',
        welcomeBack: 'Welcome back',
        pleaseLogin: 'Please login to continue'
      },
      navigation: {
        home: 'Home',
        dashboard: 'Dashboard',
        accounts: 'Accounts',
        cards: 'Cards',
        transactions: 'Transactions',
        reports: 'Reports',
        payments: 'Payments',
        authorizations: 'Authorizations',
        admin: 'Administration',
        users: 'Users',
        transactionTypes: 'Transaction Types',
        settings: 'Settings',
        profile: 'Profile',
        help: 'Help'
      },
      account: {
        title: 'Account Management',
        list: 'Account List',
        details: 'Account Details',
        add: 'Add Account',
        edit: 'Edit Account',
        accountNumber: 'Account Number',
        accountType: 'Account Type',
        balance: 'Balance',
        status: 'Status',
        openDate: 'Open Date',
        lastActivity: 'Last Activity',
        customer: 'Customer',
        customerId: 'Customer ID',
        active: 'Active',
        inactive: 'Inactive',
        closed: 'Closed',
        suspended: 'Suspended'
      },
      card: {
        title: 'Card Management',
        list: 'Card List',
        details: 'Card Details',
        add: 'Add Card',
        edit: 'Edit Card',
        cardNumber: 'Card Number',
        cardType: 'Card Type',
        expirationDate: 'Expiration Date',
        creditLimit: 'Credit Limit',
        availableCredit: 'Available Credit',
        lastUsed: 'Last Used',
        status: 'Status',
        active: 'Active',
        blocked: 'Blocked',
        expired: 'Expired',
        pending: 'Pending',
        block: 'Block',
        activate: 'Activate'
      },
      transaction: {
        title: 'Transaction Management',
        list: 'Transaction List',
        details: 'Transaction Details',
        add: 'Add Transaction',
        transactionId: 'Transaction ID',
        amount: 'Amount',
        type: 'Type',
        description: 'Description',
        merchant: 'Merchant',
        date: 'Date',
        status: 'Status',
        authorizationCode: 'Authorization Code',
        fraudIndicator: 'Fraud Indicator',
        completed: 'Completed',
        pending: 'Pending',
        failed: 'Failed',
        cancelled: 'Cancelled',
        filterByDate: 'Filter by Date',
        filterByAmount: 'Filter by Amount',
        filterByType: 'Filter by Type'
      },
      report: {
        title: 'Reports',
        generate: 'Generate Report',
        configuration: 'Report Configuration',
        dateRange: 'Date Range',
        startDate: 'Start Date',
        endDate: 'End Date',
        format: 'Format',
        exportPdf: 'Export to PDF',
        exportCsv: 'Export to CSV',
        noDataAvailable: 'No data available for the selected criteria',
        generationError: 'Error generating report'
      },
      payment: {
        title: 'Bill Payments',
        makePayment: 'Make Payment',
        currentBalance: 'Current Balance',
        paymentAmount: 'Payment Amount',
        paymentMethod: 'Payment Method',
        paymentDate: 'Payment Date',
        confirmation: 'Payment Confirmation',
        success: 'Payment processed successfully',
        failed: 'Payment processing failed',
        retry: 'Retry'
      },
      authorization: {
        title: 'Authorization Management',
        pending: 'Pending Authorizations',
        details: 'Authorization Details',
        approve: 'Approve',
        deny: 'Deny',
        requestDate: 'Request Date',
        riskScore: 'Risk Score',
        fraudIndicators: 'Fraud Indicators',
        approved: 'Approved',
        denied: 'Denied',
        expired: 'Expired',
        auditTrail: 'Audit Trail'
      },
      admin: {
        title: 'Administration',
        userManagement: 'User Management',
        transactionTypeManagement: 'Transaction Type Management',
        addUser: 'Add User',
        editUser: 'Edit User',
        deleteUser: 'Delete User',
        role: 'Role',
        permissions: 'Permissions',
        regular: 'Regular',
        administrator: 'Administrator'
      },
      validation: {
        required: 'This field is required',
        minLength: 'Minimum length: {{min}} characters',
        maxLength: 'Maximum length: {{max}} characters',
        email: 'Invalid email address',
        pattern: 'Invalid format',
        min: 'Minimum value: {{min}}',
        max: 'Maximum value: {{max}}',
        invalidDate: 'Invalid date',
        invalidAmount: 'Invalid amount'
      },
      error: {
        generic: 'An error has occurred',
        network: 'Connection error',
        unauthorized: 'Unauthorized',
        forbidden: 'Access denied',
        notFound: 'Not found',
        serverError: 'Server error',
        timeout: 'Request timeout',
        retry: 'Retry',
        contactSupport: 'Contact support'
      }
    };
  }
}
