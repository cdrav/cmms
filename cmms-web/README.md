# CMMS Hospitalario

Sistema de gestión de mantenimiento (CMMS) para equipos e infraestructura hospitalaria: equipos/activos, órdenes de trabajo, mantenimiento preventivo programado e inventario de repuestos.

Reconstrucción moderna (Next.js + Prisma) del proyecto original en Rails (`../CMMS`), que quedó abandonado en 2013. Se conserva ese proyecto solo como referencia histórica del modelo de datos.

## Stack

- **Next.js 16 (App Router) + TypeScript** — UI y backend en un solo proyecto.
- **Prisma 6 + SQLite** — un solo archivo de base de datos (`prisma/dev.db`), sin servicio de BD que instalar. Para escalar a multi-sede o más concurrencia, cambiar `provider` a `postgresql` en `prisma/schema.prisma` y ajustar `DATABASE_URL`.
- **Auth propia**: cookie httpOnly firmada con JWT (`jose`) + contraseñas con `bcryptjs`. Sin login social ni SSO (fuera de alcance del piloto).
- **Tailwind CSS**, **Zod** para validación.

## Requisitos

- Node.js 20+

## Poner en marcha (desarrollo)

```bash
npm install
cp .env.example .env   # si no existe .env, o edita el .env ya generado
npx prisma migrate dev
npm run db:seed
npm run dev
```

Abre http://localhost:3000. Usuarios de prueba creados por el seed (cambiar la contraseña en producción):

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@hospital.local | Cambiar123! |
| Jefe de mantenimiento | jefe.mantenimiento@hospital.local | Cambiar123! |
| Técnico | tecnico@hospital.local | Cambiar123! |

## Módulos (v1)

- **Equipos** (`/assets`): inventario de activos, jerarquía padre-hijo, ficha técnica, historial de órdenes de trabajo.
- **Órdenes de trabajo** (`/work-orders`): solicitud, aprobación/asignación, flujo de estados (`REQUESTED → IN_PROGRESS → WAITING_PARTS/COMPLETED → CLOSED`, o `REJECTED`), auditoría completa de cada cambio de estado, registro de repuestos consumidos (descuenta inventario automáticamente).
- **Mantenimiento preventivo** (`/pm-schedules`): programas recurrentes por frecuencia en días, indicador de vencidos, botón para generar la orden de trabajo correspondiente.
- **Inventario** (`/inventory`): repuestos/insumos, punto de reorden, historial de movimientos (entradas, salidas, ajustes).
- **Usuarios** (`/users`, solo Administrador): alta de personal con rol (Administrador, Jefe de mantenimiento, Técnico).
- **Reportes** (`/reports`): órdenes por estado/tipo, historial y costo de materiales por equipo.
- **Calibración** (dentro de la ficha del equipo): frecuencia de calibración, próximo vencimiento, historial de calibraciones con certificado adjunto. Solo aparece en equipos donde se definió una frecuencia.
- **Adjuntos**: manuales, fotos, garantías y certificados en equipos, órdenes de trabajo y registros de calibración. Se guardan en `storage/uploads/` (fuera de `public/`) y solo se sirven a usuarios con sesión iniciada vía `/api/attachments/[id]`.
- **Código QR por equipo**: botón "Etiqueta QR" en la ficha del equipo (`/print/assets/[id]`) — genera una etiqueta imprimible que al escanearla lleva directo a la ficha del equipo. Un middleware (`src/proxy.ts`) preserva ese destino si hay que iniciar sesión primero.
- **RIF (Relative Importance Factor)**: cada orden de trabajo muestra `RIF = Prioridad × Criticidad del equipo`; el listado de OTs y el panel ordenan el backlog abierto por ese valor en vez de solo por fecha o prioridad.
- **Checklist y mediciones en la OT**: actividades tipo checkbox (con sugerencias como "Verificar Accesorios", "Pruebas Eléctricas", "Limpieza") y mediciones cuantitativas (variable, valor de referencia vs. valor medido) — reemplaza el texto libre para dejar evidencia estructurada de lo que realmente se hizo.
- **Firma digital en la OT**: captura de firma dibujada a mano (canvas, `src/components/signature-pad.tsx`) de quien entrega el trabajo y de quien lo recibe conforme, con nombre y cargo — trazabilidad de responsabilidad.
- **PDF de la orden de trabajo**: botón "Descargar PDF" en cada OT (`/api/work-orders/[id]/pdf`), con logo y colores propios del hospital configurables en `/settings` (solo Administrador).
- **Tecnovigilancia** (`/adverse-events`): registro de eventos e incidentes adversos de dispositivos médicos (tipo de evento, momento, causa probable, desenlace, notificación al distribuidor). Deliberadamente **no** guarda el nombre del paciente — solo datos demográficos mínimos (tipo de documento, sexo, edad). Revisar con el área legal/de calidad del hospital el marco regulatorio aplicable (tipo INVIMA u homólogo) antes de usarlo con casos reales.
- **Gráficos en el panel**: barras (estado de equipos) y donas de progreso (mantenimientos preventivos y calibraciones, programados vs. realizados en el año), en SVG propio sin librería externa.
- **Tiempo de respuesta promedio**: tiempo entre solicitud y cierre de órdenes correctivas/de emergencia, mostrado en el panel.
- **Análisis de obsolescencia** (`/reports`): heurística explícita (no IA) que marca equipos candidatos a evaluación de reemplazo por antigüedad, frecuencia de correctivos en los últimos 12 meses, o costo de mantenimiento acumulado frente al valor de compra (`purchaseCost` en la ficha del equipo). Ver `src/lib/obsolescence.ts` para ajustar los umbrales.
- **Ficha institucional ampliada** (`/settings`): NIT, dirección, teléfono, email y código de registro sanitario (ej. REPS), además del logo/colores de PDF — esos datos también aparecen en el pie del PDF de cada OT.
- **Tipo de documento en adjuntos**: al subir un archivo a un equipo, se puede clasificar (Manual de Usuario, Factura, Registro Sanitario, Acta de Entrega, Contrato, etc.); los certificados de calibración se etiquetan automáticamente.
- **Programación mensual** (`/pm-schedules/calendar`): calendario mes por mes con los mantenimientos preventivos y calibraciones pendientes, navegable entre meses. Se basa en la próxima fecha de vencimiento de cada programa (no expande recurrencias futuras más allá del ciclo pendiente actual).
- **Tareas** (`/tasks`): pendientes del equipo de mantenimiento no atados a un equipo específico (ej. "hacer ronda de inspección"), con responsable, fecha límite y estado.
- **Solicitudes de compra** (`/purchase-requests`): compra **interna** de repuestos o equipos — sin marketplace externo. Alguien solicita con justificación e ítems (cantidad, costo estimado), un Jefe/Admin aprueba o rechaza; al marcarla "Recibida", si el ítem estaba vinculado a un repuesto existente, el stock se suma automáticamente vía una transacción de inventario. Desde la ficha de un repuesto con stock bajo hay un botón "Solicitar reposición" que prellena la solicitud.
- **Colores de marca dinámicos**: el color primario/secundario configurado en `/settings` se aplica en vivo a toda la app (sidebar, botones, login) vía variables CSS (`src/lib/color.ts` calcula el tono de `:hover` automáticamente) — no hay que tocar código para adaptar la app a los colores de cada institución.
- **Tarjeta de perfil institucional**: destacada en la parte superior del panel — logo (o iniciales si aún no se sube uno) en círculo, nombre, sede, NIT, dirección, email, teléfono y código de registro sanitario, con franja de color de marca arriba.

## Roles y permisos

Definidos en `src/lib/permissions.ts`:

- **ADMIN**: acceso total, incluida gestión de usuarios y configuración institucional (logo/colores de PDF).
- **MANAGER**: gestiona equipos, PM, inventario, órdenes de trabajo y casos de tecnovigilancia; no gestiona usuarios ni configuración.
- **TECHNICIAN**: ve todo en modo lectura, puede solicitar y avanzar sus propias órdenes de trabajo, registrar consumo de repuestos, y reportar (pero no editar/cerrar) casos de tecnovigilancia.

## Generación automática de órdenes desde PM

El listado de mantenimiento preventivo calcula "vencido" al vuelo comparando `nextDueAt` con la fecha actual, con un botón manual para generar la orden de trabajo. Si más adelante quieres automatizarlo sin intervención manual, hay un script standalone:

```bash
npm run pm:generate
```

Prográmalo con el **Programador de Tareas de Windows** (o cron en Linux) para que corra, por ejemplo, todas las mañanas. Por defecto atribuye las órdenes generadas al primer usuario `ADMIN` activo; para usar otro usuario, define la variable de entorno `PM_SYSTEM_USER_EMAIL`.

## Despliegue on-premise (servidor del hospital)

1. Copiar el proyecto completo al servidor (no solo `.next`; Prisma con SQLite necesita el motor de consultas y la carpeta `prisma/`).
2. `npm ci --omit=dev` seguido de `npm install prisma --no-save && npx prisma migrate deploy` (aplica migraciones sin generar una nueva).
3. `npm run build`
4. Configurar `.env` en el servidor con un `SESSION_SECRET` largo y aleatorio distinto al de desarrollo, y `DATABASE_URL` apuntando a la ruta definitiva del archivo SQLite.
5. Crear la carpeta `storage/uploads/` (o dejar que se cree sola en el primer adjunto) e incluirla en el respaldo periódico junto con el archivo SQLite — ahí viven los documentos y certificados subidos.
6. Ejecutar como servicio en vez de `npm start` directo, para que sobreviva reinicios:
   - **Windows**: usar [NSSM](https://nssm.cc/) para registrar `npm start` como servicio de Windows, o [PM2](https://pm2.keymetrics.io/) con `pm2-windows-startup`.
   - **Linux**: `pm2 start npm --name cmms -- start` o una unidad `systemd`.
7. Poner un reverse proxy (IIS con URL Rewrite, o nginx) delante para servir con HTTPS usando el certificado interno del hospital.
8. **Backups**: el archivo `prisma/dev.db` (SQLite) es toda la base de datos. Incluirlo en el respaldo periódico del servidor; considerar copiarlo a otra ubicación mientras la app está detenida, o usar `sqlite3 dev.db ".backup respaldo.db"` para un backup en caliente.

## Seguridad — pendiente antes de producción real

Este es un piloto. Antes de usarlo con datos reales del hospital de forma sostenida:

- Cambiar las contraseñas de los usuarios de ejemplo y `SESSION_SECRET`.
- Servir siempre bajo HTTPS (la cookie de sesión se marca `secure` en producción, lo que requiere HTTPS para funcionar).
- Revisar con TI del hospital si aplica alguna normativa local de protección de datos a la información que se registrará (ubicación de equipos médicos, nombres de personal, etc.).
- Definir una política de respaldo probada (no solo copiar el archivo, sino restaurarlo alguna vez de prueba).
