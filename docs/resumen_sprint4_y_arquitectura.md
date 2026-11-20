# Resumen técnico del sprint 4 y arquitectura integral de Trama

Este documento recopila de manera detallada todos los módulos, componentes, mejoras de arquitectura, adaptaciones para dispositivos móviles y refinamientos de diseño desarrollados durante el sprint 4 y a lo largo de las iteraciones de la red social editorial **Trama**, dejándola en estado óptimo para su evaluación y corrección final.

---

## 1. Presentación y objetivos del sprint 4

El objetivo central del sprint 4 consistió en consolidar las capacidades administrativas, de observabilidad de datos, accesibilidad multiplataforma y robustez visual del proyecto. Los hitos clave abordados comprenden:
* Panel administrativo para el directorio y control de usuarios (`/dashboard` o `/dashboard/usuarios`).
* Módulo analítico con estadísticas visuales y gráficos SVG nativos (`/dashboard/estadisticas`).
* Control de acceso basado en roles con guardias de seguridad de frontend y validadores en backend.
* Transformación a Progressive Web App (PWA) instalable en escritorio y dispositivos móviles con suite estandarizada de iconos PNG.
* Estandarización integral del sistema de modales y diálogos de confirmación.
* Rediseño del aviso de expiración de sesión como notificación flotante no bloqueante con contador dinámico en rosa de acento.
* Adaptación exhaustiva a pantallas táctiles y dispositivos móviles con barra de navegación inferior (*bottom navigation bar*).
* Cobertura de pruebas unitarias automatizadas en backend (33 pruebas) y frontend (36 pruebas).

---

## 2. Módulos y funcionalidades del sprint 4

### 2.1. Directorio y gestión administrativa de usuarios (`/dashboard`)
* **Acceso restringido:** Vista protegida por el guardia `AdminGuard` en frontend y el decorador de roles en los controladores del backend.
* **Tarjetas de métricas consolidadas:** Cuatro indicadores en la cabecera del panel que informan en tiempo real:
  * Total de usuarios registrados en el sistema.
  * Cantidad de cuentas activas.
  * Cantidad de cuentas suspendidas o deshabilitadas.
  * Cantidad de administradores con privilegios de gestión.
* **Buscador predictivo en tiempo real:** Filtro que consulta de forma simultánea nombre, apellido, nombre de usuario y correo electrónico, actualizando el listado sin recargar la página.
* **Control de estado tipo interruptor (*switch*):**
  * Control accesible con animación CSS que permite habilitar o deshabilitar usuarios con un solo toque.
  * Dispara un diálogo modal de confirmación antes de impactar el cambio en base de datos.
  * Aplica baja lógica mediante el atributo booleano `isActive: false` (sin borrado físico en MongoDB).
* **Modal de alta de usuarios:**
  * Formulario reactivo con validación de nombres, correo institucional, contraseña segura y selección explícita del rol (`usuario` o `administrador`).

### 2.2. Panel de estadísticas y métricas visuales (`/dashboard/estadisticas`)
* **Gráfico de barras SVG nativo (publicaciones por usuario):**
  * Representación visual del volumen de microensayos y crónicas publicados por los autores más activos.
  * Ejes dinámicos, escala proporcional en CSS/SVG y etiquetas descriptivas legibles.
* **Gráfico de línea temporal SVG nativo (evolución histórica de comentarios):**
  * Curva de interacción que refleja el crecimiento o descenso en las conversaciones de la comunidad a lo largo del tiempo.
  * Trazado poligonal con puntos nodales interactivos y áreas de degradado sutil en tono frambuesa.
* **Gráfico de dona SVG nativo (distribución de comentarios por historia):**
  * Cálculo geométrico de arcos mediante coordenadas polares SVG (`stroke-dasharray` y `stroke-dashoffset`).
  * Desglose porcentual con leyenda lateral organizada por título de publicación.
* **Filtros interactivos por lapso de tiempo:**
  * Filtros preconfigurados para 24 horas, 7 días, 30 días, 90 días, historial completo y rango personalizado de fechas mediante selectores de calendario.

### 2.3. Control de acceso y seguridad por roles
* **Roles definidos:** Dos perfiles claramente diferenciados: `usuario` (lector y autor estándar) y `administrador` (gestor de cuentas y estadísticas).
* **Guardias de ruta en Angular:**
  * `AuthGuard`: Redirige al inicio de sesión si no existe un token JWT válido.
  * `AdminGuard`: Verifica que el usuario autenticado posea el rol de administrador; en caso contrario, redirige al muro de publicaciones (`/posts`).
* **Seguridad en backend NestJS:**
  * `JwtAuthGuard`: Valida la firma y vigencia del token de autorización en cada petición entrante.
  * `RolesGuard`: Comprueba que el usuario solicitante cuente con el rol requerido antes de ejecutar endpoints protegidos (`/api/users/admin/*`, `/api/stats/*`).

---

## 3. Arquitectura y diseño adaptativo para móviles (*mobile responsive*)

La interfaz de **Trama** fue optimizada para garantizar una experiencia fluida, rápida e intuitiva en teléfonos inteligentes y tabletas de cualquier resolución.

### 3.1. Puntos de quiebre y enfoque adaptativo
* Se establecieron puntos de corte mediante consultas de medios (*media queries*) en `768px` (tabletas y móviles verticales) y `480px` (teléfonos pequeños).
* Ajuste de tipografía fluida y márgenes laterales seguros para evitar desbordamientos horizontales.

### 3.2. Barra de navegación inferior (*bottom navigation bar*)
* En pantallas menores a `768px`, la barra de navegación superior oculta los enlaces de texto y se complementa con una barra fija inferior anclada al pie de la ventana (`bottom: 0`).
* **Distribución ergonómica:** Botones táctiles de al menos `48px` con iconos vectoriales SVG limpios:
  * Inicio / Muro de historias (`/posts`).
  * Redactar nueva historia (botón de acción principal con realce rosa).
  * Panel de administración (visible únicamente si el usuario es administrador).
  * Perfil personal (`/profile`).
* Respeta la zona de gestos inferior de teléfonos modernos mediante la propiedad CSS `padding-bottom: env(safe-area-inset-bottom, 0.75rem)`.

### 3.3. Adaptaciones táctiles y de lectura móvil
* **Tarjetas de historias:** El tamaño de texto y el interlineado se calibran para lectura prolongada sin fatiga ocular. Las imágenes se ajustan proporcionalmente al ancho del contenedor.
* **Tablas de datos transformables:** En dispositivos móviles, la tabla de administración de usuarios adapta sus celdas para mantener legibles los datos esenciales sin requerir desplazamiento horizontal excesivo.
* **Formularios con teclado numérico y fechas nativas:** Los campos de entrada incorporan tipos semánticos (`type="email"`, `type="date"`) que abren el teclado adecuado en teclados táctiles virtuales.

---

## 4. Sistema unificado de modales y diálogos de confirmación

Para erradicar inconsistencias visuales y cumplir estrictamente con la prohibición de alertas nativas del navegador (`alert()`, `confirm()`), se diseñó un estándar transversal de ventanas modales.

### 4.1. Anatomía y clases globales del sistema modal
* `.modal-backdrop`: Capa semitransparente con efecto de desenfoque de fondo (`backdrop-filter: blur(8px)`) que cubre la totalidad de la pantalla (`position: fixed; inset: 0`).
* `.modal-dialog`: Contenedor flotante con borde sutil en color de acento, esquinas redondeadas (`16px`), fondo de superficie enriquecido y sombra profunda de elevación.
* `.modal-dialog-sm`: Variante compacta (ancho máximo de `420px`) reservada para confirmaciones de borrado, advertencias o cambios de estado.
* `.modal-header`: Encabezado con título editorial en fuente serif y botón de cierre con icono SVG nativo en cruz.
* `.modal-body`: Contenido descriptivo o formulario reactivo con espaciados calculados.
* `.modal-actions` o `.modal-footer`: Contenedor de botones alineado a la derecha (o en columna en móviles pequeños) con jerarquía estricta:
  * `.btn-secondary`: Botón de estilo fantasma o borde sutil para cancelar o volver atrás sin realizar cambios destructivos.
  * `.btn-primary`: Botón frambuesa sólido (`--color-primary`) para confirmar la acción principal (crear historia, guardar cambios, eliminar o cambiar estado).

### 4.2. Accesibilidad y bloqueo estricto de desplazamiento
* **Bloqueo de fondo:** Al abrir cualquier modal bloqueante, se inyecta la clase `modal-open` tanto en `document.body` como en `document.documentElement` (`overflow: hidden; touch-action: none;`), impidiendo que la rueda del ratón o el desplazamiento táctil muevan el fondo.
* **Cierre por teclado:** Se capturan eventos de la tecla Escape para permitir abandonar el diálogo rápidamente.
* **Cierre por clic en el fondo:** El usuario puede pulsar fuera del contenedor central para descartar la ventana de manera intuitiva.

### 4.3. Catálogo de modales implementados
1. **Modal de redacción de historias (`posts.component.html`):** Área de texto con cálculo dinámico de palabras y caracteres, selector opcional de fotografía y botón de publicación.
2. **Modal de edición de perfil (`profile.component.html`):** Formulario para actualizar nombres, biografía, fecha de nacimiento y selector de avatar con vista previa instantánea.
3. **Modal de alta de usuario (`users.component.html`):** Formulario administrativo para enrolar usuarios especificando nombre, apellido, usuario, correo, contraseña y rol.
4. **Modal de confirmación de estado (`users.component.html`):** Diálogo seguro antes de suspender o reactivar una cuenta comunitaria.
5. **Modal de confirmación de eliminación de historia (`posts.component.html` y `post-detail.component.html`):** Diálogo estandarizado con `.btn-secondary` («Cancelar») y `.btn-primary` («Eliminar»).
6. **Modal de confirmación de eliminación de comentarios (`post-detail.component.html`):** Confirmación para el autor del comentario o el administrador.
7. **Modal de instrucciones de instalación PWA (`navbar.component.html`):** Guía visual paso a paso para dispositivos iOS o navegadores que no emiten el evento nativo de instalación.

---

## 5. Sistema proactivo de expiración y control de sesión

### 5.1. Contexto y desafío
Las sesiones de usuario emplean tokens JWT con vigencia de 15 minutos. Un cierre abrupto de sesión sin previo aviso provocaría la pérdida de borradores de texto o publicaciones en curso.

### 5.2. Diseño de la notificación flotante no bloqueante
Siguiendo las mejores prácticas de experiencia de usuario y las directrices visuales del proyecto, el aviso preventivo (`SessionModalComponent`) se rediseñó como un diálogo flotante:
* **Ubicación no invasiva:** Posicionado de forma fija en la parte inferior central de la pantalla (`bottom: 2rem; left: 50%; transform: translateX(-50%);`).
* **Fondo 100% opaco:** A diferencia de modales bloqueantes, este diálogo cuenta con un fondo sólido (`#1a0b1e` en modo oscuro, `#ffffff` en modo claro) con borde sutil en color de acento y sombra profunda, permitiendo que el usuario continúe interactuando y leyendo el muro mientras el aviso está presente.
* **Sin bloqueo de scroll:** No congela el desplazamiento del documento ni oscurece la pantalla, respetando el flujo de lectura del usuario.
* **Identidad visual refinada:**
  * Icono de cuatro puntas (*sparkle*) en vector SVG.
  * Título editorial en fuente serif: «Tu sesión está por expirar».
  * Botón de cierre en cruz para descartar la notificación temporalmente.

### 5.3. Contador dinámico en rosa de acento
* Mensaje informativo: «Por tu seguridad, se cerrará tu sesión en [tiempo].».
* El tiempo restante se actualiza segundo a segundo y se resalta mediante la clase `.countdown-highlight` con el color rosa luminoso de la paleta (`--color-accent, #fb7185`), logrando máxima visibilidad sin saturación.

### 5.4. Acciones disponibles
* **Botón primario «Mantener sesión activa»:** Realiza una petición `POST` al endpoint `/api/auth/refresh`, renovando el token JWT de manera silenciosa y reiniciando el temporizador sin interrumpir al usuario.
* **Botón fantasma «Cerrar sesión»:** Termina la sesión de forma inmediata y limpia el almacenamiento local, redirigiendo a `/login`.

---

## 6. Progressive Web App (PWA) e instalación en celular

Trama fue convertida en una Progressive Web App de primer nivel, capaz de instalarse directamente desde el navegador en computadoras de escritorio, teléfonos Android y dispositivos iOS.

### 6.1. Manifiesto web estandarizado y suite de iconos PNG
* Se configuró el archivo `frontend/public/manifest.webmanifest` con los metadatos oficiales:
  * `name`: «Trama: Red social editorial»
  * `short_name`: «Trama»
  * `start_url`: `/`
  * `scope`: `/`
  * `display`: `standalone`
  * `background_color`: `#120815`
  * `theme_color`: `#120815`
* Para cumplir estrictamente con los criterios de instalabilidad de Google Chrome y Android, se generó una suite completa de 8 iconos PNG transparentes y nítidos a partir de la identidad tipográfica editorial (`frontend/public/icons/`):
  * `icon-72x72.png`
  * `icon-96x96.png`
  * `icon-128x128.png`
  * `icon-144x144.png`
  * `icon-152x152.png`
  * `icon-192x192.png` (estándar para menú de inicio y notificación de instalación)
  * `icon-384x384.png`
  * `icon-512x512.png` (estándar para pantalla de bienvenida *splash screen*)

### 6.2. Servicio `PwaService` y captura del evento `beforeinstallprompt`
* Se creó el servicio singleton `PwaService` (`frontend/src/app/core/services/pwa.service.ts`), inyectado en el componente raíz `AppComponent` para asegurar que el evento de instalación se registre desde el primer milisegundo de carga, incluso antes de que el usuario inicie sesión.
* El servicio almacena el evento diferido (*deferred prompt*) en una señal reactiva (`installPromptSignal`) y expone:
  * `isInstallable`: Señal booleana computada que indica si el navegador permite la instalación nativa.
  * `isAppInstalled`: Señal que detecta si la aplicación ya se ejecuta en modo autónomo (*standalone*).
  * `promptInstall()`: Dispara el diálogo nativo del sistema operativo y gestiona la respuesta del usuario (`accepted` o `dismissed`).

### 6.3. Opción «Instalar en celular» en el menú de usuario
* En el menú desplegable del perfil en la barra de navegación (`NavbarComponent`), se incorporó la opción «Instalar en celular» acompañada de un icono de dispositivo móvil SVG.
* **Comportamiento inteligente:**
  * Si el navegador soporta instalación directa, activa el aviso nativo del sistema.
  * Si el usuario se encuentra en iOS o en un navegador de escritorio sin soporte automático, despliega un modal con instrucciones paso a paso adaptadas para Safari (botón «Compartir» y «Agregar a la pantalla de inicio»).

---

## 7. Métricas analíticas y gráficos vectoriales nativos (SVG)

El módulo de estadísticas (`/dashboard/estadisticas`) fue concebido siguiendo el principio de no incorporar librerías externas pesadas (como Chart.js o D3.js), resolviendo toda la visualización mediante código SVG nativo y reactivo.

### 7.1. Beneficios de la solución SVG nativa
* **Cero sobrecarga de dependencias:** Ahorro significativo en el tamaño final del paquete de producción (*bundle*).
* **Nitidez absoluta:** Escalabilidad vectorial sin pérdida de definición en pantallas de alta densidad (*Retina*).
* **Total integración con variables CSS:** Los gráficos heredan automáticamente los colores de la paleta (`--color-primary`, `--color-accent`, `--text-muted`) y responden de inmediato a los cambios de tema claro y oscuro.

### 7.2. Gráficos implementados
1. **Gráfico de barras:** Muestra los autores con mayor volumen de aportes, con barras proporcionales y etiquetas de conteo.
2. **Gráfico de líneas temporales:** Representa la curva de comentarios registrados a lo largo de las fechas seleccionadas, con nodos circulares y área bajo la curva con gradiente decorativo.
3. **Gráfico de dona:** Representa la cuota de comentarios por historia con una relación de aspecto limpia y leyenda asociada.

---

## 8. Calidad de software y verificación automatizada

El proyecto cuenta con un conjunto integral de pruebas automatizadas unitarias y de integración que verifican la lógica de negocio y la robustez de los componentes.

### 8.1. Pruebas unitarias de backend (NestJS + Vitest)
* **Total de pruebas:** 33 pruebas automatizadas.
* **Resultado:** 33 superadas (100% de éxito).
* **Módulos evaluados:**
  * Autenticación (`auth.service.spec.ts`): Registro, validación de credenciales, generación de token JWT, renovación con refresh token y validación de usuarios existentes.
  * Control de usuarios (`users.service.spec.ts`): Búsqueda por identificador, consulta de perfil, actualización de datos, cálculo de métricas consolidadas, creación administrativa y alternancia de estado activo/inactivo.
  * Publicaciones (`posts.service.spec.ts`): Creación de historias, listado paginado con filtros, obtención por identificador, borrado lógico y gestión de «me gusta».
  * Comentarios (`comments.service.spec.ts`): Creación de respuestas, paginación y eliminación de comentarios.
  * Estadísticas (`stats.service.spec.ts`): Agregaciones de datos para gráficos de barras, temporales y de distribución.

### 8.2. Pruebas unitarias de frontend (Angular + Vitest)
* **Total de pruebas:** 36 pruebas automatizadas.
* **Resultado:** 36 superadas (100% de éxito).
* **Componentes y servicios evaluados:**
  * `AppComponent`: Montaje básico, inicialización del servicio PWA y presencia de modales de sesión.
  * `AuthService`: Emisión de peticiones de inicio de sesión, almacenamiento reactivo de sesión en Signals y cierre de sesión.
  * `PwaService`: Detección de soporte de instalación, captura de eventos `beforeinstallprompt`, invocación del aviso nativo y verificación de ejecución autónoma.
  * `LoginComponent` y `RegisterComponent`: Validación de formularios reactivos, manejo de contraseñas y mensajes de error.
  * `PostsComponent` y `PostDetailComponent`: Renderizado de tarjetas, conteo de palabras, interacción de «me gusta» y diálogos modales de eliminación.
  * `UsersComponent` (directorio administrativo): Búsqueda en tiempo real, alternancia de interruptores y asignación de roles.
  * `StatsComponent`: Renderizado de gráficos SVG y aplicación de filtros temporales.
  * `SessionModalComponent`: Temporizador regresivo, emisión de eventos de renovación y cierre seguro.

### 8.3. Cumplimiento estricto de las directrices del proyecto
* **Textos en español neutro:** Toda la interfaz de usuario, etiquetas, mensajes de error y diálogos están redactados en español claro.
* **Cero abreviaciones en la interfaz de usuario:** No se emplean acrónimos ni abreviaturas confusas en botones o textos visibles.
* **Estilo *sentence case* estricto:** Los títulos, encabezados, botones y menús utilizan mayúscula únicamente en la primera letra de la primera palabra, erradicando por completo el estilo *Title Case* en inglés.
* **Erradicación total de emojis:** Ausencia absoluta de emojis en el código, plantillas HTML, estilos, comentarios y documentación; toda la iconografía se basa exclusivamente en elementos vectoriales SVG nativos.
* **CSS puro nativo:** Sin uso de Tailwind CSS, Bootstrap ni librerías utilitarias externas. Maquetación resuelta mediante CSS Grid, Flexbox y variables CSS personalizadas.
* **Principios DRY y SOLID:** Separación limpia de responsabilidades entre controladores, servicios y componentes independientes.

---

## 9. Conclusión

Con la finalización de los entregables del sprint 4, la red social **Trama** satisface la totalidad de los requerimientos funcionales y no funcionales estipulados para el trabajo práctico:
1. Una identidad visual editorial única y cuidada, con soporte para modo oscuro y claro.
2. Una experiencia de usuario pausada y accesible tanto en ordenadores de sobremesa como en dispositivos móviles gracias a la barra de navegación inferior y el diseño adaptativo.
3. Un sistema de modales unificado, accesible y seguro con bloqueo de desplazamiento.
4. Un sistema preventivo de expiración de sesión no bloqueante con contador dinámico en rosa de acento.
5. Soporte completo de Progressive Web App (PWA) con suite de 8 iconos PNG e instalación nativa en dispositivos móviles.
6. Módulos de administración y estadísticas con visualizaciones SVG nativas libres de dependencias de terceros.
7. Una base de código sólida, tipada estrictamente en TypeScript y respaldada por 69 pruebas automatizadas (33 de backend y 36 de frontend).
