# CMMS Hospitalario Enterprise

Sistema de gestión de mantenimiento (CMMS) empresarial para entidades hospitalarias, con arquitectura multi-tenant y características avanzadas para distribución comercial.

## 🚀 Características Enterprise

### Multi-Tenant / Multi-Sede
- **Arquitectura multi-tenant**: Un solo despliegue sirve a múltiples hospitales/entidades
- **Gestión de sedes**: Las organizaciones pueden tener múltiples sedes con aislamiento de datos
- **Aislamiento de datos**: Garantía de que cada organización solo accede a sus propios datos
- **Personalización por organización**: Logo, colores, datos institucionales

### Gestión de Contratos
- **Contratos con proveedores**: Gestión integral de contratos de mantenimiento externo
- **SLA management**: Definición y seguimiento de acuerdos de nivel de servicio
- **Asignación de equipos**: Vinculación de contratos a equipos específicos
- **Generación de OTs**: Órdenes de trabajo automáticas según contrato
- **Evaluación de proveedores**: Sistema de calificación y ranking

### Garantías Avanzadas
- **Tipos de garantía**: Fabricante, extendida, proveedor, contrato de servicio
- **Alertas de vencimiento**: Notificaciones automáticas antes de vencer garantías
- **Reclamaciones**: Sistema completo de gestión de reclamaciones de garantía
- **Ahorros tracked**: Registro de costos ahorrados por reclamaciones exitosas
- **Dashboard de garantías**: Vista consolidada de garantías activas, vencidas y por vencer

### Sistema de Tickets
- **Portal de autoservicio**: Personal clínico puede solicitar mantenimiento directamente
- **Flujo de estados**: OPEN → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED
- **Escalado automático**: Sistema de escalado por SLA
- **Conversión a OT**: Los tickets pueden convertirse en órdenes de trabajo formales
- **Alertas de vencimiento**: Notificaciones de tickets vencidos

### Notificaciones
- **Notificaciones in-app**: Centro de notificaciones en tiempo real
- **Multiple canales**: Email, in-app, SMS (extensible)
- **Eventos configurables**: OTs asignadas, PMs vencidos, garantías por expirar, etc.
- **Historial de notificaciones**: Registro completo de todas las notificaciones
- **Mark as read**: Sistema de lectura y archivado

### Stack Tecnológico

- **Next.js 16 (App Router) + TypeScript** - UI y backend en un solo proyecto
- **Prisma 6 + SQLite** - Base de datos (fácil migración a PostgreSQL)
- **Auth propia** - Cookie httpOnly firmada con JWT + bcryptjs
- **Tailwind CSS** - Estilos modernos y responsivos
- **Zod** - Validación de datos
- **Docker + Docker Compose** - Despliegue simplificado

## 📦 Instalación

### Requisitos
- Node.js 20+
- Docker y Docker Compose (para despliegue en producción)

### Desarrollo

```bash
# Clonar el repositorio
git clone <repo-url>
cd cmms-web

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Migrar base de datos
npx prisma migrate dev

# Sembrar datos de prueba
npm run db:seed

# Iniciar servidor de desarrollo
npm run dev
```

Abre http://localhost:3000

### Producción con Docker

```bash
# Configurar variables de entorno
cp .env.example .env
# Editar .env con valores de producción

# Ejecutar script de despliegue
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# O manualmente:
docker-compose build
docker-compose up -d
```

## 👥 Usuarios de Prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@hospital.local | Cambiar123! |
| Jefe de mantenimiento | jefe.mantenimiento@hospital.local | Cambiar123! |
| Técnico | tecnico@hospital.local | Cambiar123! |

## 🏢 Gestión Multi-Tenant

### Crear Nueva Organización

```typescript
const organization = await db.organization.create({
  data: {
    name: "Hospital Nuevo",
    taxId: "900123456-2",
    address: "Dirección del hospital",
    phone: "+57 1 555-5678",
    email: "contacto@hospitalnuevo.local",
    healthRegistryCode: "REPS-67890",
    primaryColor: "#0f172a",
    secondaryColor: "#2563eb",
    maxUsers: 100,
    maxAssets: 1000,
  },
});
```

### Crear Sede

```typescript
const site = await db.site.create({
  data: {
    organizationId: organization.id,
    name: "Sede Norte",
    code: "SEDE-002",
    address: "Dirección de la sede",
    phone: "+57 1 555-9999",
  },
});
```

## 🔔 Sistema de Notificaciones

### Crear Notificación

```typescript
import { createNotification } from "@/lib/notifications";

await createNotification({
  userId: user.id,
  type: "WORK_ORDER_ASSIGNED",
  title: "Nueva orden de trabajo asignada",
  message: "Se te ha asignado la orden OT-2026-0001",
  link: "/work-orders/OT-2026-0001",
  metadata: { workOrderId: "wo-id" },
});
```

### Tipos de Notificaciones

- `WORK_ORDER_ASSIGNED` - OT asignada a usuario
- `WORK_ORDER_COMPLETED` - OT completada
- `WORK_ORDER_OVERDUE` - OT vencida
- `PM_DUE` - Mantenimiento preventivo vencido
- `WARRANTY_EXPIRING` - Garantía por vencer
- `CONTRACT_EXPIRING` - Contrato por vencer
- `INVENTORY_LOW_STOCK` - Stock bajo
- `TICKET_ASSIGNED` - Ticket asignado
- `TICKET_OVERDUE` - Ticket vencido
- `ADVERSE_EVENT_REPORTED` - Evento adverso reportado
- `ASSET_DOWN` - Equipo fuera de servicio

## 🐳 Docker y Despliegue

### Variables de Entorno

```env
NODE_ENV=production
DATABASE_URL=file:./prisma/dev.db
SESSION_SECRET=tu-secret-key-largo-y-aleatorio
```

### Comandos Docker

```bash
# Construir imagen
docker-compose build

# Levantar contenedores
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener contenedores
docker-compose down

# Reiniciar
docker-compose restart
```

### Backups

```bash
# Backup de base de datos
docker-compose exec cmms cp prisma/dev.db /tmp/backup.db
docker cp cmms:/tmp/backup.db ./backup-$(date +%Y%m%d).db

# Backup de storage (archivos subidos)
docker cp cmms:/app/storage ./storage-backup-$(date +%Y%m%d)
```

## 🔒 Seguridad

### Antes de Producción

- [ ] Cambiar contraseñas de usuarios de prueba
- [ ] Configurar `SESSION_SECRET` con valor largo y aleatorio
- [ ] Servir siempre bajo HTTPS
- [ ] Configurar políticas de respaldo
- [ ] Revisar normativa local de protección de datos
- [ ] Configurar firewall y restricciones de IP

### Mejoras de Seguridad Pendientes

- [ ] 2FA (Two-Factor Authentication)
- [ ] SSO (Single Sign-On) con SAML/OIDC
- [ ] Auditoría completa de eventos
- [ ] RBAC granular
- [ ] Encriptación de datos sensibles
- [ ] IP whitelisting para acceso administrativo

## 📊 Módulos Disponibles

- ✅ **Equipos** - Inventario, jerarquía, ficha técnica, historial
- ✅ **Órdenes de Trabajo** - Flujo completo, auditoría, checklist, firma
- ✅ **Mantenimiento Preventivo** - Programas recurrentes, calendario
- ✅ **Inventario** - Repuestos, punto de reorden, movimientos
- ✅ **Proveedores** - Gestión de proveedores y contratistas
- ✅ **Contratos** - Contratos de mantenimiento externo
- ✅ **Garantías** - Gestión de garantías y reclamaciones
- ✅ **Tickets** - Portal de autoservicio para solicitudes
- ✅ **Tecnovigilancia** - Eventos adversos de dispositivos médicos
- ✅ **Tareas** - Pendientes generales del equipo
- ✅ **Solicitudes de Compra** - Compras internas
- ✅ **Reportes** - Análisis y métricas
- ✅ **Usuarios** - Gestión de personal
- ✅ **Configuración** - Personalización institucional
- ✅ **Notificaciones** - Sistema de alertas en tiempo real

## 🎯 Roadmap

### Próximas Mejoras

- [ ] Dashboard de BI con métricas avanzadas (MTBF, MTTR, costos)
- [ ] Gestión financiera de activos (depreciación, TCO)
- [ ] API REST completa con documentación OpenAPI
- [ ] Testing automatizado (Jest + Playwright)
- [ ] App móvil para técnicos (React Native)
- [ ] Integración con sistemas hospitalarios (HL7 FHIR)
- [ ] Mantenimiento predictivo con IoT
- [ ] Machine learning para predicción de fallas
- [ ] Multi-idioma (i18n)
- [ ] Marketplace de integraciones

## 📄 Licencia

Licencia comercial - Contactar para información de licensing y distribución.

## 📞 Soporte

Para soporte empresarial, contactar a: soporte@cmms-hospitalario.com

---

**Versión**: 2.0.0 Enterprise
**Última actualización**: Septiembre 2026
