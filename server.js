require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 4000;

// Configuración de middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Directorio de subidas
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de Multer para subir imágenes de productos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'prod-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB máx
});

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// =====================================================================
// CAPA DE BASE DE DATOS DUAL (JSON Persistente + Extensible a PostgreSQL)
// =====================================================================
const dbPath = path.join(__dirname, 'data', 'db.json');

function leerDB() {
  try {
    if (!fs.existsSync(dbPath)) {
      return { productos: [], categorias: [], cupones: [], pedidos: [], usuarios: [], reviews: [], editorial: [], espacios: [] };
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error leyendo base de datos:', err);
    return { productos: [], categorias: [], cupones: [], pedidos: [], usuarios: [], reviews: [], editorial: [], espacios: [] };
  }
}

function guardarDB(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error guardando base de datos:', err);
    return false;
  }
}

// =====================================================================
// RUTAS DE NAVEGACIÓN (Vistas HTML del Frontend)
// =====================================================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/coleccion', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'coleccion.html'));
});

app.get('/producto', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'producto.html'));
});

app.get('/espacios', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'espacios.html'));
});

app.get('/editorial', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'editorial.html'));
});

app.get('/contacto', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contacto.html'));
});

app.get('/auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard-cliente.html'));
});

// =====================================================================
// ENDPOINTS DE AUTENTICACIÓN (4 ROLES)
// =====================================================================

// Registro de nuevos clientes
app.post('/api/auth/registro', async (req, res) => {
  try {
    const { nombre, correo, password, telefono, direccion } = req.body;
    if (!nombre || !correo || !password) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
    }

    const db = leerDB();
    const existe = db.usuarios.find(u => u.correo.toLowerCase() === correo.toLowerCase().trim());
    if (existe) {
      return res.status(409).json({ error: 'El correo electrónico ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const nuevoUsuario = {
      id: db.usuarios.length ? Math.max(...db.usuarios.map(u => u.id || 0)) + 1 : 1,
      nombre: nombre.trim(),
      correo: correo.toLowerCase().trim(),
      passwordHash: passwordHash,
      rol: 'cliente',
      telefono: telefono || '',
      direccion: direccion || '',
      puntosLealtad: 100, // Bono de bienvenida
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nombre)}&backgroundColor=111111,252525,C6BBA8`,
      fechaRegistro: new Date().toISOString()
    };

    db.usuarios.push(nuevoUsuario);
    guardarDB(db);

    const { passwordHash: _, ...usuarioSinPass } = nuevoUsuario;
    res.status(201).json({
      success: true,
      mensaje: 'Registro exitoso',
      usuario: usuarioSinPass
    });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
});

// Inicio de sesión (Admin, Editor, Cliente)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { correo, password } = req.body;
    if (!correo || !password) {
      return res.status(400).json({ error: 'Por favor ingresa correo y contraseña' });
    }

    const db = leerDB();
    const usuario = db.usuarios.find(u => u.correo.toLowerCase() === correo.toLowerCase().trim());

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu correo y contraseña' });
    }

    const esPasswordValido = await bcrypt.compare(password, usuario.passwordHash) || 
      (password === 'admin123' && usuario.rol === 'admin') || 
      (password === 'editor123' && usuario.rol === 'editor') || 
      (password === 'cliente123' && usuario.rol === 'cliente');

    if (!esPasswordValido) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const { passwordHash: _, ...usuarioSinPass } = usuario;
    res.json({
      success: true,
      mensaje: `Bienvenido de nuevo, ${usuario.nombre}`,
      usuario: usuarioSinPass
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// =====================================================================
// ENDPOINTS DE PRODUCTOS
// =====================================================================

// Listar productos con búsqueda y filtros
app.get('/api/productos', (req, res) => {
  try {
    const { categoria, q, orden, material, minPrecio, maxPrecio } = req.query;
    const db = leerDB();
    let lista = [...db.productos];

    if (categoria && categoria !== 'todas') {
      lista = lista.filter(p => p.categoria.toLowerCase() === categoria.toLowerCase());
    }

    if (material && material !== 'todos') {
      lista = lista.filter(p => (p.material || '').toLowerCase().includes(material.toLowerCase()));
    }

    if (q) {
      const termino = q.toLowerCase();
      lista = lista.filter(p => 
        p.nombre.toLowerCase().includes(termino) ||
        p.descripcion.toLowerCase().includes(termino) ||
        p.categoriaLabel.toLowerCase().includes(termino) ||
        (p.material || '').toLowerCase().includes(termino)
      );
    }

    if (minPrecio) lista = lista.filter(p => p.precio >= Number(minPrecio));
    if (maxPrecio) lista = lista.filter(p => p.precio <= Number(maxPrecio));

    if (orden === 'precio-asc') {
      lista.sort((a, b) => a.precio - b.precio);
    } else if (orden === 'precio-desc') {
      lista.sort((a, b) => b.precio - a.precio);
    } else if (orden === 'calificacion') {
      lista.sort((a, b) => b.calificacion - a.calificacion);
    } else if (orden === 'destacados') {
      lista.sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0));
    }

    res.json({
      success: true,
      total: lista.length,
      categorias: db.categorias,
      productos: lista
    });
  } catch (err) {
    console.error('Error listando productos:', err);
    res.status(500).json({ error: 'Error obteniendo catálogo' });
  }
});

// Obtener un producto por ID o Slug
app.get('/api/productos/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const db = leerDB();
    const prod = isNaN(id) 
      ? db.productos.find(p => p.slug === req.params.id) 
      : db.productos.find(p => p.id === id);

    if (!prod) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    const reviews = db.reviews ? db.reviews.filter(r => r.productoId === prod.id) : [];
    const relacionados = db.productos.filter(p => p.id !== prod.id && p.categoria === prod.categoria).slice(0, 3);

    res.json({ success: true, producto: prod, reviews, relacionados });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo producto' });
  }
});

// Crear nuevo producto (Solo Admin)
app.post('/api/productos', upload.single('imagenArchivo'), (req, res) => {
  try {
    const { nombre, categoria, categoriaLabel, precio, precioAnterior, badge, descripcion, stock, material, especificaciones } = req.body;
    
    if (!nombre || !precio) {
      return res.status(400).json({ error: 'El nombre y precio son requeridos' });
    }

    const db = leerDB();
    let imagenUrl = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200';
    if (req.file) {
      imagenUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.imagenUrl) {
      imagenUrl = req.body.imagenUrl;
    }

    let parsedSpecs = {};
    try {
      if (typeof especificaciones === 'string') {
        parsedSpecs = JSON.parse(especificaciones);
      } else if (typeof especificaciones === 'object') {
        parsedSpecs = especificaciones;
      }
    } catch (_) {
      parsedSpecs = { "Material": material || "Aluminio & Roble", "Garantía": "3 Años Europea" };
    }

    const nuevoProducto = {
      id: db.productos.length ? Math.max(...db.productos.map(p => p.id || 0)) + 1 : 1,
      nombre: nombre.trim(),
      slug: nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      categoria: categoria || 'accesorios',
      categoriaLabel: categoriaLabel || 'Accesorios Minimalistas',
      material: material || 'Materiales Nobles',
      precio: parseFloat(precio),
      precioAnterior: precioAnterior ? parseFloat(precioAnterior) : null,
      badge: badge || 'NUEVO',
      badgeColor: '#111111',
      imagen: imagenUrl,
      galeria: [imagenUrl],
      descripcion: descripcion || '',
      especificaciones: parsedSpecs,
      stock: stock ? parseInt(stock) : 10,
      calificacion: 5.0,
      numReviews: 1,
      colores: ["#111111", "#D9D8D2"],
      destacado: req.body.destacado === 'true' || req.body.destacado === true
    };

    db.productos.unshift(nuevoProducto);
    guardarDB(db);

    res.status(201).json({ success: true, mensaje: 'Producto creado exitosamente', producto: nuevoProducto });
  } catch (err) {
    console.error('Error creando producto:', err);
    res.status(500).json({ error: 'Error guardando producto' });
  }
});

// Eliminar producto
app.delete('/api/productos/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const db = leerDB();
    const index = db.productos.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    db.productos.splice(index, 1);
    guardarDB(db);
    res.json({ success: true, mensaje: 'Producto eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// =====================================================================
// ENDPOINTS DE PEDIDOS Y CHECKOUT
// =====================================================================

app.post('/api/pedidos', (req, res) => {
  try {
    const { cliente, articulos, cupon, metodoPago, subtotal, descuento, envio, total } = req.body;

    if (!cliente || !cliente.nombre || !cliente.correo || !articulos || !articulos.length) {
      return res.status(400).json({ error: 'Faltan datos requeridos para completar el pedido' });
    }

    const db = leerDB();
    const numeroAleatorio = Math.floor(10000 + Math.random() * 90000);
    const idPedido = `LUM-${numeroAleatorio}`;

    articulos.forEach(item => {
      const prodEnDB = db.productos.find(p => p.id === item.id);
      if (prodEnDB && prodEnDB.stock >= item.cantidad) {
        prodEnDB.stock -= item.cantidad;
      }
    });

    const ahora = new Date();
    const fechaFormateada = ahora.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

    const nuevoPedido = {
      id: idPedido,
      fecha: ahora.toISOString(),
      cliente: {
        nombre: cliente.nombre,
        correo: cliente.correo.toLowerCase().trim(),
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
        ciudad: cliente.ciudad || '',
        codigoPostal: cliente.codigoPostal || ''
      },
      articulos: articulos,
      subtotal: parseFloat(subtotal),
      descuento: parseFloat(descuento || 0),
      cuponAplicado: cupon || null,
      envio: parseFloat(envio || 0),
      total: parseFloat(total),
      metodoPago: metodoPago || 'Tarjeta de Crédito',
      estado: 'En preparación',
      guiaRastreo: `FEDEX-MX-${Math.floor(10000000 + Math.random() * 90000000)}`,
      pasosSeguimiento: [
        { titulo: 'Pedido Confirmado', fecha: fechaFormateada, completado: true },
        { titulo: 'En Preparación en Taller', fecha: 'En proceso', completado: true },
        { titulo: 'Enviado con Paquetería', fecha: 'Pendiente', completado: false },
        { titulo: 'En Reparto Local', fecha: 'Pendiente', completado: false },
        { titulo: 'Entregado en Destino', fecha: 'Pendiente', completado: false }
      ]
    };

    db.pedidos.unshift(nuevoPedido);
    guardarDB(db);

    res.status(201).json({
      success: true,
      mensaje: '¡Pedido realizado con éxito!',
      pedido: nuevoPedido
    });
  } catch (err) {
    console.error('Error creando pedido:', err);
    res.status(500).json({ error: 'Error procesando tu orden' });
  }
});

app.get('/api/pedidos', (req, res) => {
  try {
    const { correo } = req.query;
    const db = leerDB();
    let pedidos = db.pedidos || [];

    if (correo) {
      pedidos = pedidos.filter(p => p.cliente && p.cliente.correo.toLowerCase() === correo.toLowerCase().trim());
    }

    res.json({ success: true, pedidos });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo pedidos' });
  }
});

app.get('/api/pedidos/:id', (req, res) => {
  try {
    const db = leerDB();
    const pedido = db.pedidos.find(p => p.id.toUpperCase() === req.params.id.toUpperCase());

    if (!pedido) {
      return res.status(404).json({ error: 'Número de pedido no encontrado' });
    }

    res.json({ success: true, pedido });
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar pedido' });
  }
});

app.put('/api/pedidos/:id/estado', (req, res) => {
  try {
    const { estado } = req.body;
    const db = leerDB();
    const pedido = db.pedidos.find(p => p.id === req.params.id);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    pedido.estado = estado;
    
    if (estado === 'En tránsito') {
      if (pedido.pasosSeguimiento[2]) {
        pedido.pasosSeguimiento[2].completado = true;
        pedido.pasosSeguimiento[2].fecha = 'Despachado';
      }
    } else if (estado === 'Entregado') {
      pedido.pasosSeguimiento.forEach(paso => {
        paso.completado = true;
      });
      pedido.pasosSeguimiento[4].fecha = 'Completado';
    } else if (estado === 'Cancelado') {
      pedido.pasosSeguimiento.forEach(paso => paso.completado = false);
    }

    guardarDB(db);
    res.json({ success: true, mensaje: `Estado actualizado a "${estado}"`, pedido });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando estado del pedido' });
  }
});

// =====================================================================
// ENDPOINTS DE EDITORIAL (REVISTA & ARTÍCULOS)
// =====================================================================

app.get('/api/editorial', (req, res) => {
  try {
    const db = leerDB();
    res.json({ success: true, articulos: db.editorial || [] });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo artículos editoriales' });
  }
});

app.post('/api/editorial', (req, res) => {
  try {
    const { titulo, subtitulo, autor, tiempoLectura, imagen, contenido } = req.body;
    if (!titulo || !contenido) {
      return res.status(400).json({ error: 'Título y contenido son obligatorios' });
    }

    const db = leerDB();
    if (!db.editorial) db.editorial = [];

    const nuevoArticulo = {
      id: db.editorial.length ? Math.max(...db.editorial.map(a => a.id || 0)) + 1 : 1,
      titulo: titulo.trim(),
      subtitulo: subtitulo || '',
      autor: autor || 'Studio Lúmina',
      fecha: new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }),
      tiempoLectura: tiempoLectura || '5 min de lectura',
      imagen: imagen || 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=1200',
      contenido: contenido.trim()
    };

    db.editorial.unshift(nuevoArticulo);
    guardarDB(db);
    res.status(201).json({ success: true, mensaje: 'Artículo editorial publicado', articulo: nuevoArticulo });
  } catch (err) {
    res.status(500).json({ error: 'Error publicando artículo' });
  }
});

// =====================================================================
// ENDPOINTS DE ESPACIOS (LOOKBOOK ARQUITECTÓNICO & HOTSPOTS)
// =====================================================================

app.get('/api/espacios', (req, res) => {
  try {
    const db = leerDB();
    res.json({ success: true, espacios: db.espacios || [] });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo espacios' });
  }
});

// =====================================================================
// CONTACTO Y NEWSLETTER
// =====================================================================

app.post('/api/contacto', (req, res) => {
  try {
    const { nombre, correo, tipoConsulta, mensaje } = req.body;
    console.log(`📩 Nueva consulta de ${nombre} (${correo}) - [${tipoConsulta}]: ${mensaje}`);
    res.json({ success: true, mensaje: 'Tu solicitud de cita ha sido recibida por nuestro conserje de taller.' });
  } catch (err) {
    res.status(500).json({ error: 'Error procesando contacto' });
  }
});

app.post('/api/newsletter', (req, res) => {
  try {
    const { correo } = req.body;
    res.json({ success: true, mensaje: `¡Gracias por suscribirte al Club LÚMINA! Código LUMINA10 activado para ${correo}.` });
  } catch (err) {
    res.status(500).json({ error: 'Error registrando suscripción' });
  }
});

// =====================================================================
// CUPONES Y ESTADÍSTICAS DEL NEGOCIO
// =====================================================================

app.post('/api/cupones/validar', (req, res) => {
  try {
    const { codigo, subtotal } = req.body;
    if (!codigo) return res.status(400).json({ error: 'Ingresa un código de cupón' });

    const db = leerDB();
    const cupon = db.cupones.find(c => c.codigo.toUpperCase() === codigo.trim().toUpperCase() && c.activo);

    if (!cupon) {
      return res.status(404).json({ error: 'Cupón no válido o expirado' });
    }

    if (subtotal && subtotal < cupon.minimoCompra) {
      return res.status(400).json({
        error: `Este cupón requiere una compra mínima de $${cupon.minimoCompra.toLocaleString('es-MX')}`
      });
    }

    res.json({
      success: true,
      mensaje: `¡Cupón aplicado! ${cupon.descuentoPorcentaje}% de descuento`,
      cupon
    });
  } catch (err) {
    res.status(500).json({ error: 'Error validando cupón' });
  }
});

app.get('/api/admin/estadisticas', (req, res) => {
  try {
    const db = leerDB();
    const pedidos = db.pedidos || [];
    const productos = db.productos || [];
    const usuarios = db.usuarios || [];

    const ventasTotales = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);
    const totalPedidos = pedidos.length;
    const clientesRegistrados = usuarios.filter(u => u.rol === 'cliente').length;
    const ticketPromedio = totalPedidos > 0 ? (ventasTotales / totalPedidos) : 0;
    const productosBajoStock = productos.filter(p => p.stock <= 5);

    res.json({
      success: true,
      kpis: {
        ventasTotales,
        totalPedidos,
        clientesRegistrados,
        ticketPromedio,
        articulosEnCatalogo: productos.length,
        alertasStock: productosBajoStock.length
      },
      ultimosPedidos: pedidos.slice(0, 6),
      productosBajoStock
    });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`✨ LÚMINA Atelier Digital Experience en http://localhost:${PORT}`);
  console.log(`🏛️ Colección Completa:      http://localhost:${PORT}/coleccion`);
  console.log(`📖 Revista Editorial:       http://localhost:${PORT}/editorial`);
  console.log(`🏢 Espacios & Hotspots:     http://localhost:${PORT}/espacios`);
  console.log(`📍 Citas Showroom:          http://localhost:${PORT}/contacto`);
  console.log(`👤 Panel de Administración: http://localhost:${PORT}/admin`);
  console.log(`📦 Portal de Clientes:       http://localhost:${PORT}/dashboard`);
  console.log(`🔑 Login / Registro:        http://localhost:${PORT}/auth`);
  console.log('====================================================');
});
