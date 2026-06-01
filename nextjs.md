## Guía rápida de Next.js en este proyecto

Esta guía está pensada para ti en el futuro y para cualquier developer nuevo que entre en este repo. Resume cómo está organizada la app, qué es frontend, qué es backend y cómo funciona el App Router de Next.js.

---

## 1. App Router y carpeta `app/`

- **App Router**: este proyecto usa el App Router de Next.js (no `pages/`).  
- **Regla base**: todo lo que vive dentro de `src/app` forma parte del “árbol de rutas” de la aplicación.
- Tipos principales de archivos dentro de `app/`:
  - `page.tsx` → define una **página** (una URL).
  - `layout.tsx` → define un **layout** (plantilla) para un segmento de rutas.
  - `template.tsx` → similar a layout, pero se recrea en cada navegación.
  - `loading.tsx` → estado de carga para una ruta.
  - `error.tsx` → UI de error para una ruta.
  - `app/api/**/route.ts` → **endpoint de API** (backend).

Piensa en `app/` como: **mapa de URLs + componentes que las renderizan + handlers de API**.

---

## 2. Frontend vs backend en Next.js (en este repo)

### 2.1. ¿Qué consideramos frontend?

Frontend = todo lo que define y construye la **interfaz de usuario** (UI), aunque se renderice en el servidor.

En este proyecto:
- Páginas React (`page.tsx`) dentro de `src/app/**`.
- Layouts (`layout.tsx`) dentro de `src/app/**`.
- Componentes de UI reutilizables que se usan en esas páginas/layouts.
- Estilos (CSS, Tailwind, etc.) que afectan a la interfaz.

Aunque muchos de estos componentes se ejecutan en el servidor (Server Components), el resultado final es **HTML y JS que ve el usuario** → eso es frontend.

### 2.2. ¿Qué consideramos backend?

Backend = código que solo se ejecuta en el servidor y nunca llega al navegador.

En este proyecto:
- Rutas API de Next.js:
  - `src/app/api/**/route.ts`
  - Ejemplo real: `src/app/api/mooc/users/[user-id]/route.ts`
- Lógica de dominio y de infraestructura:
  - `src/contexts/**/*` (usuarios, cursos, RAG, Postgres, etc.).
- Cualquier módulo que:
  - Acceda a base de datos.
  - Use secretos o variables de entorno sensibles.
  - No renderice JSX/HTML ni se importe desde componentes cliente.

---

## 3. Server Components vs Client Components

Con el App Router, Next.js funciona en modo **server-first**:

- **Por defecto, todo componente dentro de `app/` es un Server Component**.
- Solo se convierte en Client Component si añades al principio del archivo:

```ts
'use client';
```

### 3.1. Server Components

- Viven normalmente en `app/` sin `'use client'`.
- Se ejecutan en el **servidor**.
- Pueden:
  - Hacer fetch directamente a la base de datos o servicios internos.
  - Usar secretos del servidor.
  - Componer otros Server Components y Client Components.
- El navegador recibe solo el HTML renderizado y los datos serializados; **no expone** la lógica interna.

Úsalos por defecto para:
- Páginas (`page.tsx`) que solo muestran datos.
- Layouts.
- Componentes que no necesiten estado/efectos del lado cliente.

### 3.2. Client Components

Se activan al añadir `'use client'` al principio del archivo:

- Se empaquetan como JS para el navegador.
- Pueden usar:
  - `useState`, `useEffect`, `useContext`, etc.
  - Eventos de clic, inputs, interacciones de usuario.
- No pueden acceder directamente a recursos solo del servidor (BD, fs, etc.).

Úsalos para:
- Formularios interactivos complejos.
- Componentes con animaciones dependientes de JS.
- Cualquier cosa que necesite hooks del cliente.

### 3.3. Regla mental

- **Empieza siempre con Server Components** (sin `'use client'`).
- Solo usa `'use client'` cuando NECESITAS:
  - Hooks de React del cliente.
  - Manejar eventos directamente en el navegador.

---

## 4. Rutas API (`app/api/**/route.ts`)

Las rutas API son **backend puro** dentro de Next.js.

- Se definen en archivos `route.ts` bajo `src/app/api/**`.
- Exportan funciones HTTP como:

```ts
export async function GET(request: Request) { ... }
export async function POST(request: Request) { ... }
export async function PUT(request: Request) { ... }
export async function DELETE(request: Request) { ... }
```

En este proyecto un ejemplo es:
- `src/app/api/mooc/users/[user-id]/route.ts`
  - Recupera/crea/actualiza usuarios usando casos de uso del dominio (`UserFinder`, `UserRegistrar`, etc.).

Estas funciones:
- Nunca se envían al navegador.
- Se ejecutan solo en el servidor.
- Son el punto de entrada HTTP al dominio de la app (mooc, cursos, usuarios, RAG…).

---

## 5. Organización recomendada de carpetas en este proyecto

Resumen de cómo deberíamos pensar las carpetas principales:

- **`src/app`**:
  - Páginas (`page.tsx`) → frontend (UI renderizada en servidor).
  - Layouts (`layout.tsx`) → frontend (estructura visual).
  - Rutas API (`api/**/route.ts`) → backend HTTP.
  - Componentes de UI que están muy pegados a una ruta concreta.

- **`src/contexts`**:
  - **Dominio**: entidades, value objects, errores de dominio.
  - **Aplicación**: casos de uso / servicios de aplicación.
  - **Infraestructura**: repositorios (Postgres), adaptadores, integración con terceros, etc.
  - Aquí vive la lógica “de negocio” que no depende de React.

- **`src/lib`, `src/utils` (si existen)**:
  - Funciones de ayuda genéricas, utilidades compartidas.

- **`public/`**:
  - Imágenes, iconos, estáticos.

- **Estilos**:
  - Globales: `src/app/globals.css`.
  - Por componente: `*.module.css` o la solución elegida (Tailwind, etc.).

---

## 6. ¿Cómo saber si un archivo es frontend o backend?

Pistas rápidas:

- **Probablemente frontend (UI) si**:
  - Está en `src/app/**/page.tsx` o `layout.tsx`.
  - Exporta un componente React que devuelve JSX.
  - Importa cosas de `react` y puede usarse en la interfaz.

- **Probablemente backend si**:
  - Está en `src/app/api/**/route.ts`.
  - Vive en `src/contexts/**` (dominio, aplicación, infraestructura).
  - Maneja `Request`, `NextResponse`, o habla con la base de datos/repositorios.
  - No se importa desde componentes cliente con `'use client'`.

Regla general:
- **Si renderiza UI → frontend.**
- **Si responde peticiones o implementa lógica de dominio → backend.**

---

## 7. Buenas prácticas para este repo

- **Server-first**:
  - Prioriza Server Components siempre que puedas.
  - Solo usa `'use client'` cuando realmente necesites interactividad del lado del navegador.

- **Domino fuera de `app/`**:
  - Mantén la lógica de negocio en `src/contexts/**`.
  - Las páginas y APIs deberían ser “capa fina” que delega en servicios/casos de uso.

- **API clara**:
  - La carpeta `app/api/**` es la frontera HTTP entre frontend (o clientes externos) y el dominio.
  - Maneja aquí autenticación, validación básica y mapeo de errores de dominio a códigos HTTP.

- **Pensar en capas**:
  - `app/` → UI + endpoints HTTP.
  - `contexts/` → dominio y aplicación.
  - Infraestructura (Postgres, RAG, etc.) bien encapsulada y testeable.

---

## 8. TL;DR para developers nuevos

- **Usamos Next.js con App Router** (`src/app`).
- **Todo en `app/` es server-first**:
  - Server Components por defecto.
  - Usa `'use client'` solo cuando necesites hooks del cliente e interactividad.
- **Frontend**:
  - Páginas y layouts en `app/**/page.tsx` y `layout.tsx`.
  - Componentes de UI y estilos relacionados.
- **Backend**:
  - Endpoints en `app/api/**/route.ts`.
  - Lógica de dominio y acceso a datos en `src/contexts/**`.
- Piensa en este repo como: **“UI y rutas en `app/`, negocio y persistencia en `contexts/`”**.

