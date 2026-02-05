# CardDemo - Modern Angular Application

CardDemo es una aplicación web moderna desarrollada en Angular que moderniza el sistema COBOL CardDemo original. La aplicación proporciona una interfaz de usuario intuitiva y responsive para la gestión de tarjetas de crédito, cuentas, transacciones y funcionalidades administrativas.

**Estado del Proyecto**: 87.5% Completo (14/16 tareas principales)  
**Última Actualización**: Febrero 2026

## Características Principales

- ✅ **Autenticación Segura**: Sistema de login con JWT, soporte multiidioma (Español/Inglés)
- ✅ **Gestión de Cuentas**: Visualización y actualización de información de cuentas de clientes
- ✅ **Gestión de Tarjetas**: Administración completa de tarjetas de crédito con activación/bloqueo
- ✅ **Gestión de Transacciones**: Listado paginado, filtrado avanzado y creación de transacciones
- ✅ **Reportes**: Generación y exportación de reportes en PDF/CSV
- ✅ **Procesamiento de Pagos**: Sistema completo de pago de facturas
- ✅ **Gestión de Autorizaciones**: Aprobación/denegación de transacciones pendientes
- ✅ **Administración**: Gestión de usuarios y configuración de tipos de transacción
- ✅ **Responsive Design**: Interfaz adaptable para desktop, tablet y móvil
- ✅ **Internacionalización**: Soporte completo para español e inglés con persistencia
- ✅ **Accesibilidad**: Cumplimiento WCAG 2.1 Level AA con soporte para lectores de pantalla
- ✅ **Manejo de Errores**: Sistema integral de manejo y recuperación de errores

## Tecnologías Utilizadas

- **Angular 21**: Framework principal
- **Angular Material**: Componentes de UI
- **TypeScript**: Lenguaje de programación
- **SCSS**: Preprocesador de CSS
- **RxJS**: Programación reactiva
- **ESLint**: Linting de código

## Estructura del Proyecto

```
src/
├── app/
│   ├── core/                 # Servicios principales y configuración
│   │   └── services/         # Servicios compartidos (API, Error Handler, etc.)
│   ├── shared/               # Componentes y módulos compartidos
│   │   └── components/       # Componentes reutilizables
│   ├── features/             # Módulos de funcionalidades
│   │   ├── auth/            # Autenticación
│   │   ├── account/         # Gestión de cuentas
│   │   ├── card/            # Gestión de tarjetas
│   │   ├── transaction/     # Gestión de transacciones
│   │   ├── reports/         # Reportes
│   │   ├── admin/           # Administración
│   │   ├── authorization/   # Autorizaciones
│   │   └── payment/         # Pagos
│   └── environments/        # Configuración de entornos
└── styles.scss             # Estilos globales
```

## Configuración de Desarrollo

### Prerrequisitos

- Node.js (versión 18 o superior)
- npm (incluido con Node.js)
- Angular CLI (`npm install -g @angular/cli`)

### Instalación

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   npm install
   ```

### Comandos de Desarrollo

- **Servidor de desarrollo**: `ng serve`
- **Build de producción**: `ng build`
- **Ejecutar tests**: `ng test`
- **Linting**: `ng lint`

### Configuración de API

La aplicación está configurada para conectarse con APIs REST. Los endpoints se configuran en:

- **Desarrollo**: `src/environments/environment.ts`
- **Producción**: `src/environments/environment.prod.ts`

## Funcionalidades por Módulo

### Autenticación
- Login con validación de credenciales
- Gestión de sesiones y tokens
- Soporte multiidioma en login

### Gestión de Cuentas
- Listado de cuentas de clientes
- Visualización de detalles de cuenta
- Actualización de información de cuenta

### Gestión de Tarjetas
- Listado de tarjetas por cuenta
- Visualización de detalles de tarjeta
- Activación/bloqueo de tarjetas

### Gestión de Transacciones
- Listado paginado de transacciones
- Filtrado por fecha, monto y tipo
- Creación de nuevas transacciones
- Indicadores de fraude

### Reportes
- Generación de reportes de transacciones
- Exportación en múltiples formatos
- Filtrado por criterios específicos

### Administración
- Gestión de usuarios del sistema
- Configuración de tipos de transacción
- Control de acceso basado en roles

## Arquitectura

La aplicación sigue una arquitectura modular con:

- **Lazy Loading**: Carga bajo demanda de módulos
- **Reactive Programming**: Uso de RxJS para manejo de estado
- **Component-Based**: Arquitectura basada en componentes reutilizables
- **Service-Oriented**: Separación de lógica de negocio en servicios

## Contribución

1. Fork del proyecto
2. Crear rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo LICENSE para más detalles.