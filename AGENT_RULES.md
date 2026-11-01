# Reglas de Desarrollo para el Agente - Red Social «Trama»

## 2.1. Normativa lingüística y visual de la interfaz de usuario (UI)
* **Textos en español en toda la interfaz:** Todos los textos visibles por el usuario (etiquetas, encabezados, botones, placeholders, mensajes de validación y diálogos) deben estar redactados en español claro y natural.
* **Prohibición de abreviaciones en la interfaz de usuario:** Queda estrictamente prohibido usar abreviaciones en cualquier texto visible para el usuario (por ejemplo, escribir «Descripción» en vez de «Desc.», «Contraseña» en vez de «Pass», «Administrador» en vez de «Admin», «Mensaje» en vez de «Msg»).
  * *Nota para el código fuente:* En nombres de variables, funciones, métodos, rutas de carpetas y DTOs **sí están permitidas** las abreviaciones y el uso del inglés (`btnSubmit`, `authService`, `imgUrl`, etc.).
* **Regla de uso de mayúsculas en español (estilo «sentence case» estricto):** En títulos, encabezados, subtítulos, botones, etiquetas de formularios, opciones de menú, pestañas y listas, se debe escribir con mayúscula **solo la primera letra de la primera palabra** (además de los nombres propios y las siglas).
* **Prohibición del estilo «Title Case» en español:** Queda terminantemente prohibido capitalizar cada palabra en títulos o botones.
  * *[Correcto]:* «Iniciar sesión», «Crear cuenta», «Mi perfil», «Cerrar sesión», «Historias que se quedan contigo».
  * *[Incorrecto]:* «Iniciar Sesión», «Crear Cuenta», «Mi Perfil», «Cerrar Sesión», «Historias Que Se Quedan Contigo».
* **Prohibición estricta de emojis en el código y en la interfaz:** Queda terminantemente prohibido utilizar emojis en cualquier parte del proyecto, incluyendo plantillas HTML, componentes, estilos, textos visibles de la interfaz de usuario, botones, placeholders, mensajes de error o validación, registros de consola y comentarios en el código fuente. Toda iconografía debe implementarse exclusivamente mediante elementos SVG nativos, componentes de iconos limpios o texto tipográfico estándar.

## 2.2. Principios de ingeniería de software (DRY y SOLID)
* **DRY (Don't repeat yourself):** Centralizar validaciones comunes, llamadas a la API, transformaciones de datos y componentes visuales repetitivos (modales, campos de formulario) en módulos compartidos (`shared` o `common`).
* **SOLID:**
  * *Single responsibility (SRP):* Los componentes de Angular solo gestionan la vista y los eventos; la lógica de negocio y comunicación HTTP pertenece exclusivamente a los servicios. En NestJS, los controladores solo manejan rutas HTTP y delegan la lógica a los servicios.
  * *Open/Closed (OCP):* Crear componentes extensibles mediante `input()` y proyección de contenido (`<ng-content>`).
  * *Dependency inversion (DIP):* Inyectar dependencias mediante contratos limpios e inyección nativa (`inject()` en Angular y `@Injectable()` en NestJS).
* **Tipado estricto en TypeScript:** Prohibido el uso del tipo `any`. Todas las entidades, respuestas, eventos y DTOs deben tener su interfaz o clase tipada.

## 2.3. Estándares en Angular (`/frontend`)
* **Standalone components:** Toda la aplicación debe construirse con componentes, directivas y pipes autónomos (`standalone: true`). No usar `NgModules`.
* **Control de flujo nativo:** Utilizar exclusivamente la sintaxis moderna `@if`, `@else`, `@for` (con `track` obligatorio) y `@switch`.
* **Reactividad moderna:** Manejar estados y reactividad con Signals (`signal()`, `computed()`, `effect()`).
* **Formularios reactivos:** Usar `ReactiveFormsModule` y validadores fuertemente tipados.
* **Prohibición de diálogos nativos del navegador:** No utilizar `alert()`, `confirm()` ni `prompt()`. Todo diálogo o aviso debe ser un modal personalizado integrado en el DOM.

## 2.4. Estándares en NestJS y MongoDB (raíz `/`)
* **Semántica HTTP estricta:** Respuestas con códigos de estado exactos (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`). No emitir `200` en errores ni `400` en respuestas correctas.
* **Validación con DTOs:** Validar toda petición con `class-validator` y `class-transformer` mediante un `ValidationPipe` global.
* **Seguridad y autenticación:** Encriptar contraseñas con `bcrypt` antes de persistir. Manejar tokens JWT con vencimiento de 15 minutos.
* **Bajas lógicas:** Implementar eliminaciones y bloqueos mediante marcas booleanas (ej. `isActive: boolean` o `isDeleted: boolean`), sin borrar registros físicos en MongoDB.

## 2.5. Reglas de diseño y CSS puro
* **CSS nativo exclusivo:** Queda prohibido instalar Tailwind CSS, Bootstrap o librerías utilitarias. Todo el diseño debe resolverse con CSS nativo mediante variables (`:root`), CSS Grid y Flexbox.
* **Fidelidad estética:** Reproducir con exactitud la identidad visual de **Trama** (paleta ciruela/frambuesa, tipografía editorial y modo oscuro por defecto).
