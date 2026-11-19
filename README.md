# Autoservicio San Cayetano

Catálogo online para consultar productos y precios, preparar un carrito y coordinar el pedido por WhatsApp.

## Requisitos

- Node.js compatible con Next.js 16.
- npm.
- Un proyecto Supabase Cloud. Para pruebas y desarrollo, usar un proyecto Cloud separado del de producción.

## Configuración de la aplicación

1. Instalar dependencias con `npm install`.
2. Copiar `.env.example` a `.env.local` y completar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` con los datos del proyecto Supabase Cloud seleccionado.
3. Iniciar Next.js localmente con `npm run dev`; la aplicación local se conecta al proyecto Cloud indicado en `.env.local`.
4. Abrir `http://localhost:3000/api/health/supabase`. Una respuesta `{"status":"ok"}` confirma que la aplicación consultó la tabla `categories`.

## Migraciones a Supabase Cloud

La base de datos del proyecto vive en Supabase Cloud. No hace falta iniciar Docker ni ejecutar `supabase start` para desarrollar la aplicación. La CLI de Supabase apunta al stack local por defecto, incluso cuando hay un proyecto remoto enlazado; por eso los comandos de base de datos deben incluir `--remote` explícitamente.

1. Autenticar la CLI con `npx supabase login` si todavía no está autenticada. El token de acceso de la CLI es distinto de `NEXT_PUBLIC_SUPABASE_ANON_KEY`; no guardarlo en el repositorio ni en variables `NEXT_PUBLIC_`.
2. Enlazar este checkout al proyecto Cloud con `npx supabase link --project-ref <PROJECT_REF>`. El project ref se obtiene de la URL del proyecto en Supabase. Si la CLI solicita la contraseña de base de datos, ingresarla directamente en el terminal.
3. Revisar el destino y las migraciones antes de aplicar cambios con `npx supabase db push --remote --dry-run`.
4. Aplicar migraciones con `npx supabase db push --remote` únicamente después de verificar que el destino sea el proyecto Cloud correcto.

No usar `npx supabase db push` sin `--remote`: ese comando intenta conectarse a PostgreSQL local (`127.0.0.1:54322`). No aplicar migraciones de desarrollo directamente al proyecto de producción; el dry-run de esta sesión identificó el proyecto enlazado como `production`.

No se necesita una clave `service_role` para el funcionamiento de esta base. No se debe agregar al navegador ni versionar ningún secreto. La tabla `admin_users` queda vacía; el alta controlada del administrador se documentará al implementar el acceso administrativo.

## Comandos

- `npm run dev`: servidor local.
- `npm run lint`: ESLint.
- `npm run typecheck`: chequeo TypeScript.
- `npm run build`: build de producción.
- `npm run start`: servidor de producción local.

## Estructura inicial

- `app/`: rutas, layout y estilos globales.
- `lib/supabase/`: clientes de servidor y navegador y configuración pública.
- `supabase/migrations/`: esquema, restricciones, triggers y políticas RLS versionadas.

Las carpetas de funcionalidades y pruebas se incorporarán cuando cada integración las necesite.
