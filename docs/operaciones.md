# Operación y puesta en producción

## Entornos y secretos

Mantener proyectos Supabase distintos para desarrollo y producción. No cargar datos reales de clientes en desarrollo y ejecutar las suites de integración/E2E únicamente contra el proyecto de desarrollo. Las pruebas requieren `SUPABASE_ENVIRONMENT=development`, `SUPABASE_TEST_PROJECT_REF`, `SUPABASE_PRODUCTION_PROJECT_REF` y una URL cuyo host coincida exactamente con el ref de desarrollo; los refs deben ser distintos. La suite de integración además exige `SUPABASE_ALLOW_DEVELOPMENT_TEST_WRITES=1` como confirmación deliberada porque crea y elimina filas de prueba.

Variables de la aplicación por entorno:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `WHATSAPP_PHONE_NUMBER`

No configurar `SUPABASE_SERVICE_ROLE_KEY`: el flujo normal usa la sesión del administrador y RLS. Las credenciales temporales de integración (`SUPABASE_TEST_ADMIN_EMAIL`, `SUPABASE_TEST_ADMIN_PASSWORD`, `SUPABASE_TEST_MEMBER_EMAIL`, `SUPABASE_TEST_MEMBER_PASSWORD`) se guardan solo en el entorno local/CI de desarrollo y nunca se versionan.

## Verificación antes de desplegar

Desde un checkout limpio, ejecutar:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Para probar la base de desarrollo, crear allí un usuario administrador y otro usuario autenticado sin permisos. Copiar `.env.test.example` a `.env.local` (que está ignorado por Git), completar los valores de prueba y ejecutar `npm run test:integration`. La configuración aborta si falta la confirmación de escritura, el entorno no está identificado como desarrollo, los refs coinciden o el host no corresponde al ref declarado.

Para ejecutar Playwright, copiar `.env.test.example` a `.env.local`, completar las variables públicas del proyecto de desarrollo y crear allí las cuentas de prueba de administrador y miembro sin permisos; el proyecto debe tener aplicado el esquema y el seed de desarrollo. Ejecutar `npx playwright install chromium` una vez en la máquina y luego `npm run test:e2e`. La suite comprueba escritorio, móvil, headers, búsqueda/filtro, paginación, carrito persistente, WhatsApp y autorización. Crea y borra un producto de prueba mediante una cuenta admin de desarrollo.

La CI ejecuta lint, TypeScript, unit tests y build con variables ficticias, sin conexión a Supabase. Las suites con base de datos no se ejecutan automáticamente sobre producción.

## Migraciones y despliegue

1. Confirmar con el propietario el proyecto Supabase de producción y el proveedor/plan de hosting. Vercel es la opción propuesta, no una decisión ya autorizada.
2. Revisar el proyecto Supabase enlazado y las migraciones. Primero ejecutar `npx supabase db push --remote --dry-run` y confirmar visualmente que el destino es producción. Nunca omitir `--remote` ni aplicar el seed de desarrollo en producción.
3. Confirmar un backup recuperable y el procedimiento de restauración antes de cambios de esquema o carga inicial. Las migraciones versionadas no son backup de los datos.
4. Aplicar las migraciones aprobadas con `npx supabase db push --remote` antes del despliegue de código que las use.
5. Configurar las variables de producción en el proveedor de hosting. No guardar secretos en Git ni en variables `NEXT_PUBLIC_` salvo URL y clave anon.
6. Crear manualmente el usuario inicial en Supabase Auth, deshabilitar el registro público y registrar su UUID en `admin_users` desde un entorno confiable.
7. Cargar categorías y productos reales mediante el procedimiento acordado con el comercio; nunca importar el seed ficticio.
8. Desplegar y revisar logs de build/runtime sin compartir tokens, cookies ni credenciales.

## Smoke test de producción

Después de publicar, completar manualmente con cuentas y datos de producción controlados:

- Abrir el catálogo, buscar y filtrar un producto.
- Iniciar sesión como administrador, editar un producto de prueba aprobado y comprobar el cambio público.
- Verificar acceso al panel sin sesión y cerrar sesión al finalizar.
- Armar un carrito con un producto por unidad y otro por peso; validar que el mensaje muestra precios actuales, cantidades y total estimativo.
- Confirmar el número de WhatsApp y el contenido antes de enviar el mensaje. Abrir WhatsApp no equivale a enviar o confirmar el pedido.
- Retirar o restaurar cualquier dato de prueba y revisar logs de la aplicación y del proveedor.

No se ejecutaron migraciones, cambios de datos, despliegues ni pruebas contra producción durante esta integración. El alta del dominio, configuración de backups, credenciales, número comercial y aprobación del smoke test requieren acceso y decisión del propietario.