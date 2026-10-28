# ✨ LÚMINA — Luxury Design & Living Atelier

Una plataforma integral de comercio electrónico de alta gama inspirada en marcas de diseño y acústica como *Bang & Olufsen*, *Herman Miller* y *Apple*. Desarrollada con arquitectura completa en **Node.js + Express**, cuenta con motor de base de datos relacional/persistente, autenticación multi-rol, panel de control de administración con analíticas de negocio en vivo, portal de autoservicio para clientes con rastreo de paquetería en tiempo real y una experiencia visual de diseño de revista.

---

## 🚀 Características Principales

### 1. Tienda Pública de Alta Gama (`/`)
* **Diseño Editorial & Glassmorphism:** Paleta refinada, tipografías prémium (*Plus Jakarta Sans* y *Outfit*), efectos de desenfoque y microinteracciones fluidas.
* **Catálogo Interactivo en Vivo:** Filtros dinámicos por categorías (Audio Hi-Fi, Iluminación, Espacios Ergonómicos, Accesorios), búsqueda en tiempo real y selector de ordenamiento.
* **Bolsa de Compras Deslizante (*Slide-over Drawer*):**
  * Cálculo dinámico de subtotal, descuentos y total.
  * Barra de progreso interactiva para desbloquear Envío Express Gratis.
  * Validador de cupones de descuento promocionales (`LUMINA10`, `ATELIER20`, `VIP2026`).
* **Modal de Vista Rápida (*Quick View*):** Galería fotográfica en alta resolución, ficha técnica detallada y especificaciones de materiales nobles.
* **Pasarela de Checkout Integrada:** Formulario de envío, validación de códigos postales y múltiples métodos de pago (Tarjetas, SPEI/CLABE y PayPal).
* **Modo Oscuro / Claro:** Alternancia fluida con persistencia en `localStorage`.

### 2. Autenticación & Control de Accesos (`/auth`)
* Sistema multi-rol con soporte para **Administradores** y **Clientes Compradores**.
* Hash de contraseñas con `bcryptjs`.
* Botones de un solo clic para autocompletar credenciales en demostraciones.

### 3. Panel de Administración de Operaciones (`/admin`)
* **KPIs y Métricas en Tiempo Real:** Ventas totales acumuladas, volumen de pedidos, ticket promedio y alertas de inventario bajo (≤ 5 piezas).
* **CRUD de Productos:** Creación, edición, control de existencias y eliminación de piezas del catálogo en vivo.
* **Gestión Logística de Órdenes:** Actualizador de estados de pedidos (*En preparación*, *En tránsito con guía*, *Entregado*, *Cancelado*) que sincroniza automáticamente con el rastreador del cliente.

### 4. Portal del Cliente & Rastreo de Envíos (`/dashboard`)
* Resumen del cliente, nivel VIP y puntos de lealtad acumulados.
* Historial de compras con desglose de artículos adquiridos.
* **Línea de Tiempo de Rastreo:** Visualización paso a paso del progreso del paquete con número de guía oficial.
* Buscador directo de pedidos por folio.

---

## 🔑 Credenciales de Acceso Demo

| Rol | Correo Electrónico | Contraseña |
| :--- | :--- | :--- |
| **Administrador General** | `admin@lumina.com` | `admin123` |
| **Cliente / Comprador** | `cliente@lumina.com` | `cliente123` |

---

## 🛠️ Stack Tecnológico

* **Backend:** Node.js, Express.js, REST API, Multer, Bcryptjs, CORS.
* **Base de Datos:** Almacenamiento JSON persistente con atomic writes para ejecución instantánea sin dependencias externas, y esquema `schema.sql` nativo para PostgreSQL (Render / Supabase).
* **Frontend:** HTML5 Semántico, CSS3 Moderno (Variables CSS, Flexbox, CSS Grid, Glassmorphism), Vanilla JavaScript ES6+ reactivo.
* **Diseño:** Mobile-first, totalmente responsivo y adaptativo.

---

## 💻 Instrucciones para Ejecutar en Local

1. Abre tu terminal en esta carpeta:
   ```powershell
   cd "C:\Users\Jose\.gemini\antigravity\scratch\lumina-store"
   ```

2. Arranca el servidor:
   ```powershell
   node server.js
   ```

3. Abre en tu navegador web:
   * **Tienda Principal:** [http://localhost:4000](http://localhost:4000)
   * **Iniciar Sesión:** [http://localhost:4000/auth](http://localhost:4000/auth)
   * **Panel Administrativo:** [http://localhost:4000/admin](http://localhost:4000/admin)
   * **Portal del Cliente:** [http://localhost:4000/dashboard](http://localhost:4000/dashboard)

---

## 🌐 Despliegue en Render / Supabase

1. Crea un repositorio en GitHub y sube este proyecto.
2. En Render, crea un nuevo **Web Service** conectado a tu repositorio.
3. Comando de construcción (*Build Command*): `npm install`
4. Comando de inicio (*Start Command*): `node server.js`
5. (Opcional) Si conectas una base de datos PostgreSQL, agrega la variable de entorno `DATABASE_URL` y ejecuta el script `schema.sql`.
