# Análisis de requerimientos --- Catálogo online para supermercado

**Estado:** alcance funcional del MVP\
**Fecha:** 18 de noviembre de 2026

## 1. Propósito del proyecto

Desarrollar un catálogo online para un supermercado/autoservicio con un
único local físico. El objetivo principal es permitir que los clientes
consulten los productos y sus precios, armen un carrito y envíen el
pedido al comercio mediante WhatsApp para coordinar posteriormente la
entrega a domicilio.

El catálogo será un canal complementario de venta. No reemplazará la
atención presencial ni funcionará como un sistema integral de gestión
comercial.

## 2. Alcance general del MVP

El MVP contempla:

-   Catálogo público de productos, sin fotografías.
-   Visualización de precios.
-   Organización de productos mediante categorías y subcategorías.
-   Búsqueda por nombre y filtrado por categorías, combinables entre sí.
-   Carrito de compras sin necesidad de registro.
-   Productos vendidos por unidad y por peso.
-   Actualización de precios para carritos que hayan sido armados antes
    de un cambio.
-   Generación de un mensaje predeterminado para enviar el pedido por
    WhatsApp.
-   Administración básica de productos, precios, categorías y
    disponibilidad por una única persona.

El MVP no contempla pagos online, gestión de entregas, gestión de
pedidos dentro del catálogo ni control de stock.

## 3. Actores

### 3.1. Cliente

Persona que visita el catálogo para consultar productos, seleccionar
cantidades, armar un pedido y enviarlo al supermercado mediante
WhatsApp.

No necesita crear una cuenta ni iniciar sesión.

### 3.2. Administrador

Una única persona responsable de mantener actualizado el catálogo. Puede
crear, modificar, activar, desactivar y eliminar productos, además de
administrar categorías y subcategorías.

## 4. Catálogo de productos

### 4.1. Información de los productos

Cada producto tendrá, como mínimo, los siguientes datos:

  Dato              Descripción
  ----------------- -----------------------------------------------
  Nombre            Nombre visible del producto.
  Categoría         Categoría a la que pertenece.
  Precio            Precio vigente del producto.
  Unidad de venta   Define si se vende por unidad o por peso.
  Estado            Indica si el producto está activo o inactivo.

No se incluirán fotografías ni descripciones en el MVP.

### 4.2. Tipos de productos y cantidades

Se contemplan dos modalidades de venta:

**Productos por unidad**

-   El cliente selecciona una cantidad entera.
-   El precio publicado corresponde a una unidad.
-   El importe de la línea se calcula multiplicando el precio por la
    cantidad.

**Productos por peso**

-   El precio publicado corresponde a un kilogramo.
-   El cliente ingresa directamente la cantidad deseada en gramos.
-   No se impondrán incrementos fijos de 150 gramos.
-   La cantidad debe ser un número entero mayor que cero.
-   El importe estimado se calcula proporcionalmente al peso solicitado.

Ejemplo: si el precio es de \$10.000 por kilogramo y el cliente solicita
450 gramos, el importe estimado será de \$4.500.

El peso finalmente preparado por el supermercado podría diferir del
solicitado. Por lo tanto, el importe del carrito es estimativo y el
comercio deberá confirmar el pedido y su importe final por WhatsApp.

### 4.3. Presentaciones

Cada presentación comercial se tratará como un producto independiente.

Ejemplo:

-   Coca-Cola 500 ml.
-   Coca-Cola 1,5 litros.
-   Coca-Cola 2,25 litros.

No se implementará un sistema de variantes de un mismo producto en el
MVP.

### 4.4. Categorías y subcategorías

Los productos se organizarán mediante categorías y subcategorías, con
una profundidad máxima de dos niveles.

Ejemplo orientativo:

-   Almacén
    -   Aceites
    -   Arroz
    -   Fideos
-   Bebidas
    -   Gaseosas
    -   Aguas
-   Limpieza
-   Perfumería
-   Carnicería
-   Fiambrería
-   Verdulería

La estructura definitiva de categorías podrá ser administrada por el
responsable del catálogo.

## 5. Navegación y consulta del catálogo

Al ingresar, el cliente podrá visualizar una cantidad limitada de
productos, ordenados alfabéticamente. La cantidad inicial deberá evitar
cargar todos los productos de una sola vez y perjudicar la agilidad de
la página. La forma de mostrar el resto de los resultados queda
pendiente de definición funcional detallada.

El catálogo contará con:

-   **Listado de productos:** muestra los productos activos y sus
    precios.
-   **Búsqueda por nombre:** el listado se actualiza a medida que el
    cliente escribe.
-   **Filtro por categorías:** permite limitar los productos a una
    categoría o subcategoría.
-   **Búsqueda combinada:** la búsqueda por nombre y el filtro por
    categoría pueden utilizarse simultáneamente.

No se contemplan fotografías, recomendaciones, filtros avanzados ni
ordenamientos elegibles por el cliente en el MVP. El orden alfabético
será el criterio de visualización definido.

## 6. Carrito de compras

### 6.1. Comportamiento general

El cliente podrá agregar productos al carrito, modificar sus cantidades
y eliminarlos.

-   No se requiere registro ni inicio de sesión.
-   El carrito debe conservarse aunque el cliente cierre la página y
    vuelva posteriormente.
-   Si el mismo producto se agrega más de una vez, se acumularán las
    cantidades en una única línea.
-   En productos por peso, se acumularán los gramos solicitados.
-   El cliente podrá modificar la cantidad o eliminar una línea del
    carrito.

### 6.2. Total estimativo

El carrito mostrará el subtotal de cada producto y un total estimado del
pedido.

Se deberá informar claramente que el total es **estimativo**, porque:

-   Los precios pueden cambiar.
-   En los productos vendidos por peso, el peso final preparado puede
    diferir del solicitado.
-   El pedido todavía debe ser revisado y confirmado por el comercio.

No habrá un monto mínimo de compra en el MVP.

### 6.3. Actualización de precios

Si un producto cambia de precio después de que el cliente lo agregó al
carrito, el carrito deberá actualizarse al precio vigente.

El importe mostrado no debe conservar un precio anterior como si todavía
estuviera vigente. El total estimativo deberá recalcularse con los
precios actualizados antes de generar el mensaje del pedido.

### 6.4. Productos desactivados o eliminados

Si un producto deja de estar disponible:

-   Dejará de aparecer en el catálogo público.
-   Si estaba incluido en un carrito existente, se informará al cliente
    que ya no está disponible.
-   Se impedirá enviar el pedido mientras ese producto permanezca en el
    carrito.
-   El cliente deberá quitarlo del carrito para continuar.

Si el administrador elimina un producto, también deberá quitarse de los
carritos existentes en los que estuviera incluido. La eliminación no
debe dejar una línea de carrito inválida.

## 7. Envío de pedidos por WhatsApp

### 7.1. Flujo principal

1.  El cliente navega por el catálogo.
2.  Agrega productos al carrito y define las cantidades.
3.  Consulta el carrito y el total estimativo.
4.  Presiona la acción para enviar el pedido.
5.  El sistema verifica que los productos continúen disponibles y
    actualiza los precios vigentes.
6.  Se genera un mensaje predeterminado con el detalle del pedido.
7.  Se abre WhatsApp con el mensaje preparado.
8.  El cliente envía el mensaje al supermercado.
9.  El comerciante recibe el pedido y se comunica con el cliente para
    solicitar los datos necesarios y coordinar la entrega.

La apertura de WhatsApp no significa que el pedido haya sido recibido o
confirmado: el cliente debe enviar el mensaje desde WhatsApp.

### 7.2. Contenido del mensaje

El mensaje deberá incluir, como mínimo:

-   Nombre de cada producto.
-   Cantidad solicitada.
-   Unidad correspondiente (unidades o gramos).
-   Precio utilizado para el cálculo.
-   Importe estimado por línea.
-   Total estimado del pedido.

El mensaje deberá dejar claro que los importes son estimativos y están
sujetos a confirmación por parte del supermercado.

### 7.3. Datos de entrega y retiro

En el MVP, el catálogo no solicitará nombre, teléfono ni dirección del
cliente.

El comerciante solicitará esos datos posteriormente por WhatsApp.

La entrega a domicilio es la modalidad principal. Si el cliente desea
retirar el pedido en el local, también lo coordinará directamente por
WhatsApp.

## 8. Administración del catálogo

La administración será utilizada por una única persona.

### 8.1. Gestión de productos

El administrador podrá:

-   Crear productos.
-   Editar productos.
-   Modificar precios.
-   Activar productos.
-   Desactivar productos.
-   Eliminar productos.
-   Asignar o cambiar la categoría de un producto.

No se administrarán fotografías ni descripciones en el MVP.

La eliminación estará disponible como operación. Cuando un producto se
elimine, deberá quitarse de los carritos existentes en los que estuviera
incluido.

### 8.2. Gestión de categorías

El administrador podrá:

-   Crear categorías y subcategorías.
-   Modificar sus nombres.
-   Ordenarlas.
-   Eliminar categorías y subcategorías.

La administración respetará la estructura de hasta dos niveles definida
para el catálogo. Al eliminar una categoría, deberá contemplarse qué
sucede con los productos asociados para evitar que queden sin una
clasificación válida.

### 8.3. Actualización de precios

El administrador podrá modificar manualmente el precio de cada producto
cuando lo necesite, sin tener que actualizar el catálogo completo.

Los cambios deberán reflejarse en el catálogo público y en los carritos
existentes, de acuerdo con la regla de actualización de precios definida
anteriormente.

### 8.4. Disponibilidad de productos

En el MVP no se gestionará stock ni cantidades disponibles.

La disponibilidad se controlará manualmente mediante el estado del
producto:

-   **Activo:** se muestra en el catálogo y puede agregarse al carrito.
-   **Inactivo:** no se muestra en el catálogo y no puede incluirse en
    un nuevo pedido.

## 9. Gestión de stock y sistemas futuros

El catálogo no será responsable de administrar existencias.

En una etapa posterior se prevé incorporar un sistema independiente de
gestión comercial o de inventario, que centralice información de
productos, precios y stock.

Una vez implementado ese sistema, el catálogo podrá conectarse a esa
fuente de información.

Por lo tanto, quedan fuera del MVP:

-   Control de stock.
-   Descuento o reserva de existencias al armar un carrito.
-   Movimientos de inventario.
-   Compras a proveedores.
-   Reposición de productos.
-   Gestión de depósitos.
-   Sincronización con un sistema externo.

La futura integración no forma parte del alcance actual.

## 10. Funcionalidades explícitamente fuera del MVP

Para mantener acotado el alcance, no se incluirán:

-   Registro, inicio de sesión ni perfiles de clientes.
-   Fotografías de productos.
-   Descripciones de productos.
-   Pagos online.
-   Confirmación automática de pagos.
-   Gestión interna de pedidos.
-   Estados de pedidos o seguimiento de entregas.
-   Gestión de repartidores.
-   Cálculo automático de costos de envío.
-   Captura de dirección y datos personales dentro del catálogo.
-   Compra mínima.
-   Control de stock.
-   Variantes de productos.
-   Promociones, cupones o descuentos.
-   Historial de compras del cliente.
-   Notificaciones automáticas.
-   Integración con sistemas externos de inventario o gestión comercial.

Estas funcionalidades podrán evaluarse en futuras versiones, según las
necesidades reales del negocio.

## 11. Reglas de negocio consolidadas

1.  El catálogo es público y no requiere autenticación para los
    clientes.
2.  El supermercado tiene un único local.
3.  Solo los productos activos se muestran en el catálogo.
4.  Cada producto tiene una única modalidad de venta: por unidad o por
    peso.
5.  Los productos por unidad admiten cantidades enteras.
6.  Los productos por peso muestran su precio por kilogramo y reciben
    cantidades en gramos.
7.  El importe de los productos por peso se calcula proporcionalmente al
    peso solicitado.
8.  Cada presentación comercial se registra como un producto
    independiente.
9.  El carrito agrupa líneas del mismo producto y acumula sus
    cantidades.
10. El carrito se conserva al cerrar y volver a abrir la página.
11. Los precios pueden cambiar y los carritos deben actualizarse al
    precio vigente.
12. El total del carrito es estimativo y debe identificarse claramente
    como tal.
13. No existe un monto mínimo de compra en el MVP.
14. Los productos desactivados no pueden formar parte de un nuevo
    pedido.
15. Un producto desactivado o eliminado que ya estaba en un carrito debe
    ser informado y quitado antes de enviar el pedido.
16. El pedido se envía mediante un mensaje preparado para WhatsApp.
17. El cliente debe enviar el mensaje manualmente desde WhatsApp.
18. El pedido no se considera confirmado por el solo hecho de abrir
    WhatsApp.
19. Los datos de entrega y el importe final se coordinan posteriormente
    entre el cliente y el comerciante.
20. La disponibilidad se administra manualmente; no hay control de
    stock.

## 12. Puntos pendientes de definición

El alcance funcional principal está definido. Los siguientes detalles
pueden resolverse en una especificación más detallada o durante el
diseño funcional, sin impedir el cierre de esta etapa:

-   Cantidad exacta de productos que se mostrarán inicialmente y
    mecanismo para consultar el resto.
-   Comportamiento de búsqueda cuando no existan coincidencias.
-   Reglas de validación y presentación de importes y redondeos.
-   Comportamiento ante errores al abrir WhatsApp o generar el mensaje.
-   Tratamiento de categorías que tengan productos asociados al momento
    de eliminarlas.
-   Momento y forma exactos en que se actualizan los precios de un
    carrito persistido, garantizando en todo caso que se utilice el
    precio vigente antes de generar el pedido.

## 13. Criterio de aceptación general del MVP

El MVP podrá considerarse funcionalmente completo cuando:

-   El administrador pueda mantener productos, precios, categorías y
    disponibilidad.
-   Un cliente pueda consultar y encontrar productos mediante búsqueda y
    categorías.
-   Pueda agregar productos por unidad o peso al carrito y modificar sus
    cantidades.
-   El carrito se conserve entre visitas.
-   Los precios se mantengan actualizados y el total se identifique como
    estimativo.
-   Los productos no disponibles no puedan enviarse en un pedido.
-   El cliente pueda generar un mensaje completo con su pedido y
    enviarlo mediante WhatsApp.
-   El supermercado pueda recibir la solicitud y continuar la
    coordinación de la entrega por ese canal.

------------------------------------------------------------------------

**Fin del documento de análisis del MVP.**
