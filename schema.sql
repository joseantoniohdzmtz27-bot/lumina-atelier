-- =====================================================================
-- LÚMINA — Luxury Design & Living Atelier
-- Esquema de Base de Datos para PostgreSQL (Producción / Render / Supabase)
-- =====================================================================

-- 1. Tabla de Usuarios (Admin y Clientes)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'cliente',
    telefono VARCHAR(50),
    direccion TEXT,
    ciudad VARCHAR(100),
    codigo_postal VARCHAR(20),
    puntos_lealtad INT DEFAULT 0,
    avatar TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Productos
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    categoria_label VARCHAR(100) NOT NULL,
    precio NUMERIC(12,2) NOT NULL,
    precio_anterior NUMERIC(12,2),
    badge VARCHAR(50),
    badge_color VARCHAR(20),
    imagen TEXT NOT NULL,
    descripcion TEXT,
    especificaciones JSONB,
    stock INT NOT NULL DEFAULT 10,
    calificacion NUMERIC(3,2) DEFAULT 5.0,
    num_reviews INT DEFAULT 0,
    colores JSONB,
    destacado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Cupones de Descuento
CREATE TABLE IF NOT EXISTS cupones (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    descuento_porcentaje INT NOT NULL,
    minimo_compra NUMERIC(12,2) DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    descripcion VARCHAR(255)
);

-- 4. Tabla de Pedidos / Órdenes
CREATE TABLE IF NOT EXISTS pedidos (
    id VARCHAR(50) PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    cliente_nombre VARCHAR(150) NOT NULL,
    cliente_correo VARCHAR(150) NOT NULL,
    cliente_telefono VARCHAR(50),
    direccion_envio TEXT NOT NULL,
    articulos JSONB NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    descuento NUMERIC(12,2) DEFAULT 0,
    cupon_aplicado VARCHAR(50),
    envio NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) NOT NULL,
    metodo_pago VARCHAR(100) NOT NULL,
    estado VARCHAR(50) DEFAULT 'En preparación',
    guia_rastreo VARCHAR(100),
    pasos_seguimiento JSONB,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Reseñas / Testimonios
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
    autor VARCHAR(150) NOT NULL,
    estrellas INT NOT NULL DEFAULT 5,
    comentario TEXT NOT NULL,
    fecha VARCHAR(50) DEFAULT 'Reciente',
    verificado BOOLEAN DEFAULT TRUE
);
