# Trama: Red social editorial

> Historias que se quedan contigo. Un espacio sosegado para escribir, leer y compartir reflexiones y pequeñas verdades de cada día.

---

## 1. Presentación del proyecto

**Trama** es una plataforma de interacción social con impronta editorial y literaria, concebida para contrarrestar la inmediatez y la saturación algorítmica de las redes convencionales. Su propósito es ofrecer una atmósfera íntima y pausada donde las personas puedan publicar microensayos, crónicas cotidianas, fragmentos de lectura y reflexiones personales, disfrutando de una experiencia de lectura limpia, tipográficamente cuidada y sin distracciones superficiales.

La arquitectura del sistema está organizada como un monorepositorio que combina:
* **Backend:** API REST desarrollada con el framework **NestJS**, tipado estricto en TypeScript y persistencia de datos orientada a documentos en **MongoDB** mediante **Mongoose**.
* **Frontend:** Aplicación cliente de una sola página desarrollada en **Angular** (versión 20+), empleando componentes autónomos (*standalone components*), control de flujo nativo (`@if`, `@for`, `@switch`), reactividad moderna basada en señales (*Signals*) y estilos resueltos exclusivamente con **CSS puro**.

---

## 2. Cronograma y estado de los sprints

El ciclo de desarrollo del proyecto está estructurado en iteraciones regulares con una cadencia de entrega de **7 días corridos** por cada sprint:

| Iteración | Fecha límite de entrega | Alcance temático principal | Estado actual |
| :--- | :--- | :--- | :--- |
| **Sprint 1** | **04/11/2026** | **Fundamentos, autenticación, identidad visual y estructura base** | **Completado al 100%** |
| Sprint 2 | 11/11/2026 | Feed de publicaciones, editor de texto, interacción básica y reacciones | Planificado |
| Sprint 3 | 18/11/2026 | Perfiles de usuario ampliados, gestión de seguimiento y multimedia | Planificado |
| Sprint 4 | 25/11/2026 | Panel de administración, métricas avanzadas, moderación y cierre | Planificado |

### Puntos del Sprint 1 y nivel de completitud

A continuación se detallan los requisitos exigidos para el primer sprint de la plataforma, indicando el estado de cumplimiento de cada uno:

* [x] **Configuración del monorepositorio y entornos de ejecución:** Estructuración limpia del servidor en NestJS (raíz `/`) y del cliente en Angular (`/frontend`), con scripts de desarrollo unificado (`npm run start:all`).
* [x] **Conexión y modelado de datos en MongoDB:** Configuración de la conexión mediante Mongoose y definición del esquema `User` con campos de identidad (`firstName`, `lastName`, `email`, `username`, `password`, `birthdate`, `bio`, `avatarUrl`, `role`, `isActive`).
* [x] **Servicio de autenticación en backend (NestJS):**
  * Endpoint `POST /auth/register` con encriptación de contraseñas mediante `bcrypt`, validación estricta de DTOs (`RegisterDto`) y procesamiento de imágenes de perfil con Multer.
  * Endpoint `POST /auth/login` con soporte para autenticación indistinta mediante nombre de usuario o correo electrónico.
  * Servicio de archivos estáticos para servir imágenes desde la carpeta `/uploads`.
* [x] **Enrutamiento inicial estricto:** Redirección automática de la ruta raíz (`/`) hacia `/login`, garantizando que ningún usuario no autenticado acceda a feeds o pantallas intermedias.
* [x] **Pantalla de inicio de sesión (`/login`):** Formulario reactivo con control de visibilidad de contraseña (icono SVG interactivo), persistencia de sesión local y validaciones en tiempo real.
* [x] **Pantalla de registro (`/register`):** Formulario reactivo de alta de cuenta con confirmación de clave, selector de fecha de nacimiento, selector de avatar con previsualización en miniatura y validación estricta alfabética en nombre y apellido (bloqueo total de números o caracteres especiales).
* [x] **Experiencia de validación en formularios:**
  * Botones de envío («Iniciar sesión» y «Crear cuenta») habilitados por defecto, deshabilitándose solo durante el procesamiento de la solicitud (`[disabled]="isLoading()"`).
  * Notificación general de aviso si el usuario pulsa el botón con todos los campos vacíos (*«Por favor, completa todos los campos para continuar.»*).
  * Mensajes de error contextuales debajo de cada campo incorrecto mediante etiquetas `<small class="field-error">`.
* [x] **Pantalla de carga (`/loading`):** Componente de preloader con animación CSS de pulso concéntrico y tipografía en estilo *sentence case*.
* [x] **Barra de navegación principal (`NavbarComponent`):** Cabecera contextual (oculta de forma automática en `/login`, `/register` y `/loading`), con logotipo editorial, alternador de temas claro/oscuro y menú desplegable de usuario.
* [x] **Estructura base de navegación para accesibilidad:** Creación de los cascarones base de `/posts` y `/profile` para garantizar la navegabilidad requerida en el Sprint 1 sin adelantar contenidos estáticos del Sprint 2.
* [x] **Normativa lingüística e iconográfica estricta:** Interfaz completamente en español, uso riguroso del estilo *sentence case* en títulos y botones, prohibición absoluta de abreviaciones informales y erradicación total de emojis en favor de gráficos SVG vectoriales nativos.

---

## 3. Índice de pantallas desarrolladas

El sistema cuenta actualmente con las siguientes vistas funcionales y componentes estructurales:

### 3.1. Pantalla de inicio de sesión (`/login`)
* **Propósito:** Brindar acceso seguro a los usuarios registrados en la red.
* **Características:**
  * Permite identificarse indistintamente mediante correo electrónico o nombre de usuario.
  * Campo de contraseña con conmutador de visibilidad que alterna entre texto oculto y visible mediante icono SVG nativo.
  * Botón de acción con retroalimentación visual de estado de carga (*«Iniciando sesión...»*).
  * Enlace al pie para acceder al formulario de registro en caso de no poseer cuenta.

### 3.2. Pantalla de creación de cuenta (`/register`)
* **Propósito:** Permitir el alta completa de nuevos integrantes en la comunidad.
* **Características:**
  * Maquetación en dos columnas: columna izquierda editorial con la bienvenida de Trama y columna derecha con el formulario reactivo.
  * Validación alfabética estricta en los campos de nombre y apellido, restringiendo números y caracteres especiales.
  * Validador de fortaleza de contraseña (mínimo 8 caracteres, al menos 1 letra mayúscula y 1 dígito numérico) y coincidencia exacta en la repetición de clave.
  * Selector de fecha de nacimiento con icono de calendario estilizado en el tono rosa corporativo.
  * Selector de fotografía de perfil con carga de archivo y previsualización circular inmediata.
  * Botón de acción reactivo con manejo de errores específicos por campo.

### 3.3. Pantalla de carga y espera (`/loading`)
* **Propósito:** Servir como transición de carga sosegada para operaciones asíncronas o precargas de datos.
* **Características:**
  * Fondo inmersivo con viñeta radial.
  * Disco central con la letra inicial de Trama rodeado por dos anillos concéntricos con animación de pulsación suave en CSS puro.
  * Leyenda inferior con tipografía serif en estilo *sentence case*: *«Tejiendo historias...»*.

### 3.4. Pantalla del feed de publicaciones (`/posts`)
* **Propósito:** Cascarón base navegable del muro principal de publicaciones.
* **Características:**
  * Componente limpio y libre de datos falsos o estáticos, preparado para recibir el servicio de publicaciones en el Sprint 2.
  * Presenta un contenedor sobrio que respeta la identidad visual y confirma la accesibilidad del enrutamiento.

### 3.5. Pantalla de perfil de usuario (`/profile`)
* **Propósito:** Cascarón base del espacio personal del autor.
* **Características:**
  * Vista reservada para la futura edición de biografía, estadísticas personales y archivo de publicaciones del Sprint 2 y Sprint 3.
  * Accesible directamente desde el menú desplegable de la barra de navegación superior.

### 3.6. Barra de navegación superior (`NavbarComponent`)
* **Propósito:** Proporcionar orientación, control de identidad y navegación general por la plataforma.
* **Características:**
  * Visibilidad condicional: permanece oculta en las pantallas de acceso (`/login`, `/register`, `/loading`) y se renderiza únicamente dentro de la aplicación principal.
  * Logotipo tipográfico `trama.` en fuente serif con acento en el punto final.
  * Conmutador interactivo de tema visual (modo oscuro / modo claro) con persistencia en el almacenamiento local.
  * Menú desplegable de usuario que exhibe el avatar del perfil activo y enlaces para acceder a «Mi perfil» o «Cerrar sesión».

---

## 4. Identidad visual y diseño de interfaz

La apariencia de **Trama** fue diseñada desde cero para evocar el tacto, la calidez y el sosiego de una publicación literaria impresa, adaptada con elegancia a los medios digitales contemporáneos.

### 4.1. Decisión artística
A diferencia de las redes sociales tradicionales saturadas de notificaciones estridentes, animaciones invasivas y elementos de distracción, Trama adopta una filosofía de **diseño sosegado y contemplativo**:
* **Lectura pausada:** Espaciados generosos, contrastes cuidados para evitar la fatiga visual y ritmos verticales equilibrados.
* **Atmósfera íntima:** Fondos oscuros con tintes ciruela y moras silvestres, generando la sensación de una lectura nocturna o un diario privado.
* **Iconografía pura:** Ausencia total de emojis. Cada metáfora visual se expresa mediante vectores SVG limpios, minimalistas y de trazo uniforme.

### 4.2. Paleta de colores

La aplicación utiliza variables nativas en el selector `:root` con soporte automático para modo oscuro (por defecto) y modo claro:

| Variable CSS | Modo oscuro (por defecto) | Modo claro | Uso y significado |
| :--- | :--- | :--- | :--- |
| `--bg-app` | `#120815` | `#fff8f8` | Fondo principal de la aplicación; tono ciruela muy oscuro / blanco cálido |
| `--bg-surface` | `rgba(38, 16, 43, 0.7)` | `#ffffff` | Fondo de tarjetas y paneles translúcidos con desenfoque de fondo |
| `--border-surface` | `rgba(251, 113, 133, 0.2)` | `#f3e2e6` | Límites sutiles para delimitar contenedores sin saturar la vista |
| `--bg-input` | `rgba(18, 8, 21, 0.5)` | `#fff1f2` | Fondo de campos de texto e inputs de formularios |
| `--border-input` | `rgba(251, 113, 133, 0.24)` | `#f3e2e6` | Contorno reposado de campos interactivos |
| `--color-primary` | `#be185d` | `#be185d` | Rosa frambuesa profundo para botones de acción principal |
| `--color-primary-hover`| `#d81b60` | `#9d174d` | Realce interactivo al posar el cursor sobre acciones primarias |
| `--color-accent` | `#fb7185` | `#be185d` | Rosa pétalo luminoso para destaques tipográficos, focos e iconos |
| `--color-accent-subtle`| `rgba(251, 113, 133, 0.15)` | `#fce7f3` | Fondos de avatares, halos decorativos y estados secundarios |
| `--text-muted` | `#e2d4de` | `#8f788d` | Texto secundario, descripciones y etiquetas descriptivas |
| `--text-placeholder` | `#8f788d` | `#a995a5` | Textos de referencia dentro de campos de entrada y pies de tarjeta |
| `--color-error` | `#f43f5e` | `#e11d48` | Señalización sobria de errores de validación y campos requeridos |

### 4.3. Tipografía

La jerarquía tipográfica equilibra tradición literaria con precisión técnica:
* **Familia serif editorial (`--font-serif`):** `Georgia, 'Times New Roman', serif`. Empleada en el logotipo `trama.`, títulos principales (`.editorial-title`), frases destacadas y citas reflexivas, transmitiendo solemnidad y calidez artesanal.
* **Familia sans-serif de interfaz (`--font-sans`):** `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`. Utilizada en formularios, etiquetas, botones, mensajes informativos y tablas de datos para maximizar la legibilidad y nitidez en pantallas de cualquier densidad.

### 4.4. Diseño y arquitectura de componentes

* **CSS nativo exclusivo:** No se emplean librerías utilitarias externas como Tailwind CSS ni Bootstrap. Toda la maquetación se fundamenta en CSS moderno con CSS Grid, Flexbox, variables personalizadas y consultas de medios (*media queries*).
* **Superficies y elevación:** Las tarjetas utilizan la propiedad `backdrop-filter: blur(18px)` junto con sombras suaves y profundas (`box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35)`), logrando una sensación de capas flotantes sobre el fondo envolvente.
* **Microinteracciones cuidadas:** Las transiciones de color, foco y elevación son sutiles (entre `0.2s` y `0.3s`), ofreciendo retroalimentación inmediata sin estridencias.
* **Formularios reactivos con accesibilidad integrada:** Cada control cuenta con su respectiva etiqueta semántica `<label>`, textos guía y zonas de error accesibles (`role="alert"` y `<small class="field-error">`).

---

## 5. Instrucciones de instalación y puesta en marcha

### Requisitos previos
* **Node.js:** Versión 20 o superior.
* **MongoDB:** Servidor local ejecutándose en el puerto estándar `27017` o cadena de conexión configurada mediante la variable `MONGODB_URI`.

### 5.1. Instalación de dependencias
Desde la raíz del repositorio, instalar los paquetes del backend y del frontend:
```bash
npm install
npm --prefix frontend install
```

### 5.2. Ejecución simultánea (recomendada)
Para levantar tanto la API en NestJS como la aplicación en Angular en un único comando concurrente:
```bash
npm run start:all
```

### 5.3. Ejecución en terminales separadas
* **Terminal 1 - Servidor NestJS:**
  ```bash
  npm run start:dev
  ```
  *Disponible en: `http://localhost:3000`*

* **Terminal 2 - Cliente Angular:**
  ```bash
  npm run start:frontend
  ```
  *Disponible en: `http://localhost:4200`*

### 5.4. Verificación de calidad y pruebas unitarias
* **Compilación completa:**
  ```bash
  npm run build
  npm run build:frontend
  ```
* **Ejecución de pruebas unitarias:**
  ```bash
  npm test
  npm --prefix frontend test -- --watch=false
  ```
