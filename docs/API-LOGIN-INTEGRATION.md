# Integración de API de Login

## Descripción

El servicio de autenticación ha sido actualizado para integrarse con la API real de login del backend.

## Endpoint de Login

```
POST /auth/login
```

### Request Body

```json
{
  "username": "string",
  "password": "string"
}
```

### Response

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": 1,
    "username": "usuario",
    "email": "usuario@example.com",
    "is_active": true
  }
}
```

## Almacenamiento en LocalStorage

El servicio guarda automáticamente los siguientes datos en localStorage:

1. **Token de acceso**: `carddemo_token`
2. **Token de refresco**: `carddemo_refresh_token`
3. **Datos del usuario**: `carddemo_user`

### Estructura de datos del usuario en localStorage

```json
{
  "id": "1",
  "name": "usuario",
  "role": "regular",
  "permissions": [
    "view_accounts",
    "update_accounts",
    "view_cards",
    "update_cards",
    "view_transactions",
    "add_transactions",
    "view_reports"
  ],
  "language": "es",
  "lastLogin": "2024-01-15T10:30:00.000Z",
  "sessionTimeout": 1800000
}
```

## Uso del Servicio

### Login

```typescript
import { AuthenticationService } from '@core/services';

constructor(private authService: AuthenticationService) {}

login() {
  const credentials = {
    userId: 'usuario',
    password: 'password123',
    language: 'es'
  };

  this.authService.login(credentials).subscribe({
    next: (response) => {
      console.log('Login exitoso:', response);
      // El token y los datos del usuario ya están guardados en localStorage
      // Redirigir al dashboard
    },
    error: (error) => {
      console.error('Error en login:', error);
      // Mostrar mensaje de error al usuario
    }
  });
}
```

### Verificar autenticación

```typescript
// Verificar si el usuario está autenticado
const isAuthenticated = this.authService.isAuthenticated();

// Obtener usuario actual
this.authService.getCurrentUser().subscribe(user => {
  if (user) {
    console.log('Usuario actual:', user);
  }
});

// Obtener usuario de forma síncrona
const currentUser = this.authService.getCurrentUserValue();
```

### Logout

```typescript
logout() {
  this.authService.logout().subscribe({
    next: () => {
      console.log('Logout exitoso');
      // El servicio automáticamente limpia localStorage y redirige al login
    },
    error: (error) => {
      console.error('Error en logout:', error);
    }
  });
}
```

### Verificar permisos

```typescript
// Verificar si el usuario tiene un permiso específico
const canViewAccounts = this.authService.hasPermission(Permission.VIEW_ACCOUNTS);

// Verificar si el usuario tiene un rol específico
const isAdmin = this.authService.hasRole(UserRole.ADMIN);

// Verificar si el usuario tiene alguno de varios permisos
const canManage = this.authService.hasAnyPermission([
  Permission.MANAGE_USERS,
  Permission.MANAGE_TRANSACTION_TYPES
]);
```

## Permisos por Rol

### Usuario Regular
- `view_accounts`
- `update_accounts`
- `view_cards`
- `update_cards`
- `view_transactions`
- `add_transactions`
- `view_reports`

### Usuario Admin
Todos los permisos del usuario regular más:
- `manage_users`
- `manage_transaction_types`

## Manejo de Sesión

El servicio automáticamente:

1. **Guarda el token JWT** en localStorage al hacer login
2. **Restaura la sesión** al recargar la página si el token es válido
3. **Verifica la expiración** del token
4. **Limpia la sesión** al hacer logout o cuando el token expira
5. **Monitorea el timeout** de la sesión (30 minutos por defecto)

## Interceptor HTTP

El token se agrega automáticamente a todas las peticiones HTTP mediante el `AuthInterceptor`:

```typescript
// No es necesario agregar el token manualmente
this.http.get('/api/accounts/me').subscribe(...);
// El interceptor agrega: Authorization: Bearer {token}
```

## Configuración

La configuración se encuentra en `environment.ts`:

```typescript
security: {
  tokenKey: 'carddemo_token',
  refreshTokenKey: 'carddemo_refresh_token',
  sessionTimeout: 30 * 60 * 1000, // 30 minutos
  maxLoginAttempts: 3
}
```

## Notas Importantes

1. **Seguridad**: Los tokens se almacenan en localStorage. Para mayor seguridad en producción, considerar usar httpOnly cookies.

2. **Expiración**: El token expira según el valor `expires_in` de la respuesta del backend (1800 segundos = 30 minutos).

3. **Refresh Token**: Actualmente se usa el mismo token como refresh token. Implementar lógica de refresh cuando el backend lo soporte.

4. **SSR**: El servicio verifica si está en entorno de navegador antes de acceder a localStorage para compatibilidad con Server-Side Rendering.

5. **Roles**: Los roles se determinan automáticamente basándose en el username (si contiene "admin" se asigna rol de admin).
