Ahora mismo tienes 3 “mundos” distintos:

1. Superadmin (tu SaaS)
Solo tú / tu empresa
No tiene onboarding público
No se registra desde la app

👉 Se crea manualmente o seed en DB

2. Business (cafés / negocios)
Pagan SaaS
Crean su cuenta en tu plataforma

👉 Esto es B2B signup

3. End Customers (clientes del café)
NO son usuarios del SaaS
NO tienen acceso a billing ni admin
Solo usan loyalty app

👉 Esto es B2C signup (pero dentro del tenant)

🧭 Regla clave (muy importante)

❗ SOLO existe UN sistema de autenticación
pero con 3 roles y 2 contextos

🏗️ Arquitectura correcta (simplificada)
🔐 Auth system único

Tabla users:

id
email
password
role: superadmin | owner | employee | customer
tenant_id (nullable para superadmin)
🧠 Pero el truco real está aquí:
👉 el contexto cambia según cómo entras
🌐 1. Superadmin login
app.com/superadmin
role = superadmin
tenant_id = null
🏢 2. Business login (admins del café)
cafe-joan.app.com/admin
role = owner / employee
tenant_id = obligatorio
👤 3. Customer (cliente final)

Aquí viene lo importante:

❗ NO usan el mismo login que el SaaS

Tienen 3 opciones:

Opción A (RECOMENDADA): QR-first (sin password)
scan QR → customer auto-login
customer_id se resuelve desde QR
sesión temporal o token
UX muy fluida
Opción B: login opcional
email / phone
dentro del tenant
Opción C: magic link
email link
sin password
🔥 La clave que te falta entender

NO tienes 3 register systems
tienes 1 sistema de auth + 3 onboarding flows

🧩 Flujo correcto completo
🏢 Business onboarding
Landing → pricing → signup → tenant creado → admin panel
👤 Customer onboarding
QR scan → tenant detectado → customer creado automáticamente

o:

QR scan → optional signup → loyalty tracking
🧠 Superadmin
manual seed / protected route only
🧠 Cómo evitar el caos (regla de oro)
❌ ERROR típico:
3 sistemas de auth separados
3 tablas de users distintas
lógica duplicada
✅ CORRECTO:

1 users table
3 roles
2 contexts (SaaS vs Tenant)

🏗️ Modelo mental correcto
          ┌──────────────┐
          │ Superadmin   │
          └──────┬───────┘
                 │
        SaaS Platform Layer
                 │
     ┌───────────┴───────────┐
     │                       │
Business Admins       Customers (App)
     │                       │
 tenant_id              tenant_id
🚨 Lo que te estaba generando el lío

Estabas mezclando:

auth
onboarding
tenant resolution
roles
app contexts

👉 todo junto sin separación mental

🧭 Decisión importante (te simplifica TODO)
👉 Customer ≠ User del SaaS

Esto es clave:

Business users → SaaS system
Customers → Loyalty system

aunque compartan tabla (opcional), conceptualmente son distintos mundos

💡 Recomendación práctica (para tu código)
1. Auth base única
email/password
session
2. Middleware define contexto
if (subdomain === "app") {
  context = "saas"
}

if (subdomain === "{tenant}") {
  context = "tenant"
}
3. Route separation clara
app/
  superadmin/
  admin/
  app/ (customers)

---

## Nota de implementación (repo)

La implementación **no** usa `users.tenant_id` ni un único `users.role` global. Usa:

- `users.platform_role` = `superadmin` (mundo plataforma, sin membership)
- `tenant_memberships.role` = `owner` | `employee` | `admin` | `customer` (mundo negocio)
- JWT con `kind`: `platform` | `tenant` ([`src/lib/auth/session.ts`](src/lib/auth/session.ts))
- Clientes finales: tabla `customers` (mundo loyalty), no el login de `/login`