/* =====================================================================
   LÚMINA Atelier — Luxury Digital Experience Engine (app.js)
   60 FPS Animations, Reactive State & High-End Interactions
   ===================================================================== */

const STATE = {
  productos: [],
  categoriaActiva: 'todas',
  materialActivo: 'todos',
  busqueda: '',
  orden: 'destacados',
  carrito: JSON.parse(localStorage.getItem('lumina_cart') || '[]'),
  favoritos: JSON.parse(localStorage.getItem('lumina_wishlist') || '[]'),
  cupon: null,
  metaEnvioGratis: 5000,
  usuarioActual: JSON.parse(localStorage.getItem('lumina_user') || 'null')
};

document.addEventListener('DOMContentLoaded', () => {
  inicializarTema();
  inicializarProgresoScroll();
  actualizarBarraUsuario();
  actualizarCarritoUI();

  // Enrutamiento en el cliente según la página activa
  if (document.getElementById('productosGrid')) {
    cargarProductos();
    configurarToolbarCatalogo();
  }
  if (document.getElementById('productoDetalleContainer')) {
    cargarDetalleProducto();
  }
  if (document.getElementById('editorialGridContainer')) {
    cargarArticulosEditorial();
  }
  if (document.getElementById('hotspotsStage')) {
    inicializarHotspots();
  }

  // Interacciones Avanzadas (Slider, Reel, Mapa y 3D)
  if (document.getElementById('splitComparisonContainer')) {
    inicializarSliderComparador();
  }
  if (document.getElementById('scrollReelWrapper')) {
    inicializarReelScroll();
  }
  if (document.getElementById('lumina3DGlobe')) {
    inicializarGlobo3D();
  }
  inicializarEfecto3D();

  configurarEventosGlobales();
});

// =====================================================================
// BARRA DE PROGRESO DE SCROLL & MICROINTERACCIONES
// =====================================================================
function inicializarProgresoScroll() {
  const line = document.getElementById('scrollProgressBar');
  if (!line) return;

  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
    line.style.width = `${progress}%`;
  }, { passive: true });
}

// =====================================================================
// CARGA Y RENDERIZADO DE PRODUCTOS (EDITORIAL CATALOG)
// =====================================================================
async function cargarProductos() {
  const grid = document.getElementById('productosGrid');
  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 70px 20px;">
      <span class="font-mono-tag" style="margin-bottom: 8px;">CALIBRANDO CATÁLOGO</span>
      <p style="color: var(--text-muted); font-size: 14px;">Cargando selección de diseño de autor...</p>
    </div>
  `;

  try {
    const params = new URLSearchParams();
    if (STATE.categoriaActiva !== 'todas') params.append('categoria', STATE.categoriaActiva);
    if (STATE.materialActivo !== 'todos') params.append('material', STATE.materialActivo);
    if (STATE.busqueda) params.append('q', STATE.busqueda);
    if (STATE.orden) params.append('orden', STATE.orden);

    const res = await fetch(`/api/productos?${params.toString()}`);
    const data = await res.json();

    if (!res.ok || !data.success) throw new Error(data.error || 'Error al cargar piezas');

    STATE.productos = data.productos;
    renderizarProductos(STATE.productos);
  } catch (err) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
        <h4 style="font-size: 18px; margin-bottom: 8px;">No se pudo conectar con el taller</h4>
        <p style="color: var(--text-muted); font-size: 13px;">Asegúrate de que el backend de Node.js esté activo.</p>
      </div>
    `;
  }
}

function renderizarProductos(productos) {
  const grid = document.getElementById('productosGrid');
  if (!grid) return;

  if (productos.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 80px 20px;">
        <span class="font-mono-tag" style="margin-bottom: 12px;">BÚSQUEDA SIN RESULTADOS</span>
        <h3 style="font-size: 24px; margin-bottom: 10px;">Ninguna pieza coincide con los criterios</h3>
        <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 24px;">Prueba seleccionando otra categoría o material.</p>
        <button class="btn-editorial-main" onclick="resetearFiltros()">Ver Colección Completa</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = productos.map(p => {
    const esFavorito = STATE.favoritos.includes(p.id);
    const badgeHtml = p.badge 
      ? `<span class="luxury-badge-tag">${p.badge}</span>` 
      : '';
    const precioPrevioHtml = p.precioAnterior 
      ? `<span style="font-size: 12px; text-decoration: line-through; color: var(--text-light);">$${p.precioAnterior.toLocaleString('es-MX')}</span>` 
      : '';

    const coloresHtml = (p.colores || []).map(color => 
      `<span style="width: 14px; height: 14px; border-radius: 50%; background: ${color}; border: 1px solid rgba(0,0,0,0.15);" title="Acabado"></span>`
    ).join('');

    return `
      <article class="luxury-product-card" data-id="${p.id}">
        <div>
          <div class="luxury-img-frame">
            <a href="/producto?id=${p.id}">
              <img src="${p.imagen}" alt="${p.nombre}" loading="eager" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop';this.onerror=null;">
            </a>
            ${badgeHtml}
            <button class="action-icon-pill" style="position: absolute; top: 12px; right: 12px; width: 34px; height: 34px;" onclick="toggleFavorito(${p.id}, event)" title="Guardar en Favoritos">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${esFavorito ? '#c5a880' : 'none'}" stroke="${esFavorito ? '#c5a880' : 'currentColor'}" stroke-width="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
            </button>
          </div>

          <span class="font-mono-tag" style="margin-bottom: 6px;">${p.categoriaLabel}</span>
          <h3 style="font-size: 17px; margin-bottom: 8px;">
            <a href="/producto?id=${p.id}">${p.nombre}</a>
          </h3>
          <p style="font-size: 12px; color: var(--text-muted); line-height: 1.6; margin-bottom: 14px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${p.descripcion}
          </p>
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 14px;">
            ${coloresHtml}
            <span style="font-size: 11px; color: var(--text-muted); margin-left: 6px;">${p.material || 'Material Noble'}</span>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid var(--border-color);">
          <div>
            ${precioPrevioHtml}
            <div style="font-size: 18px; font-weight: 800; letter-spacing: -0.02em;">
              $${p.precio.toLocaleString('es-MX')} <span style="font-size: 11px; font-weight: 600; color: var(--text-muted);">MXN</span>
            </div>
          </div>
          <button class="btn-editorial-main" style="padding: 8px 16px; font-size: 11px;" onclick="agregarAlCarrito(${p.id})">
            + Añadir
          </button>
        </div>
      </article>
    `;
  }).join('');
}

function configurarToolbarCatalogo() {
  document.querySelectorAll('.filter-btn-pill').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn-pill').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      STATE.categoriaActiva = e.target.dataset.category || 'todas';
      cargarProductos();
    });
  });

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let timer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        STATE.busqueda = e.target.value.trim();
        cargarProductos();
      }, 300);
    });
  }

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      STATE.orden = e.target.value;
      cargarProductos();
    });
  }
}

function resetearFiltros() {
  STATE.categoriaActiva = 'todas';
  STATE.materialActivo = 'todos';
  STATE.busqueda = '';
  document.querySelectorAll('.filter-btn-pill').forEach(b => {
    b.classList.toggle('active', b.dataset.category === 'todas');
  });
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  cargarProductos();
}

// =====================================================================
// PÁGINA INDIVIDUAL DEDICADA DE PRODUCTO (/producto?id=X)
// =====================================================================
async function cargarDetalleProducto() {
  const container = document.getElementById('productoDetalleContainer');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const prodId = urlParams.get('id') || '1';

  try {
    const res = await fetch(`/api/productos/${encodeURIComponent(prodId)}`);
    const data = await res.json();

    if (!res.ok || !data.success) throw new Error('Producto no encontrado');

    const p = data.producto;
    const galeria = p.galeria && p.galeria.length ? p.galeria : [p.imagen];

    const thumbsHtml = galeria.map((img, i) => `
      <img src="${img}" style="width: 70px; height: 70px; object-fit: cover; border-radius: var(--radius-xs); border: 2px solid ${i === 0 ? 'var(--c-carbon)' : 'transparent'}; cursor: pointer;" onclick="cambiarImagenPrincipal('${img}', this)">
    `).join('');

    const specsRows = Object.entries(p.especificaciones || {}).map(([clave, valor]) => `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 10px 0; color: var(--text-muted); font-size: 13px;">${clave}</td>
        <td style="padding: 10px 0; font-weight: 700; text-align: right; font-size: 13px;">${valor}</td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1.1fr 1fr; gap: 60px; align-items: flex-start;">
        <div>
          <div style="border-radius: var(--radius-sm); overflow: hidden; background: var(--c-graphite); margin-bottom: 16px;">
            <img id="mainProductViewImg" src="${galeria[0]}" alt="${p.nombre}" style="width: 100%; height: 560px; object-fit: cover; transition: transform 0.6s ease;">
          </div>
          <div style="display: flex; gap: 12px; overflow-x: auto;">
            ${thumbsHtml}
          </div>
        </div>

        <div>
          <span class="font-mono-tag" style="margin-bottom: 10px;">${p.categoriaLabel} • ${p.material || 'Material Noble'}</span>
          <h1 style="font-size: 38px; line-height: 1.15; margin-bottom: 14px;">${p.nombre}</h1>
          
          <div style="display: flex; align-items: baseline; gap: 14px; margin-bottom: 24px;">
            <span style="font-size: 28px; font-weight: 800;">$${p.precio.toLocaleString('es-MX')} MXN</span>
            ${p.precioAnterior ? `<span style="font-size: 16px; text-decoration: line-through; color: var(--text-light);">$${p.precioAnterior.toLocaleString('es-MX')}</span>` : ''}
            <span style="font-size: 12px; color: #10b981; font-weight: 700;">● Stock disponible en taller (${p.stock} pzas)</span>
          </div>

          <p style="font-size: 14px; color: var(--text-muted); line-height: 1.8; margin-bottom: 30px;">
            ${p.descripcion}
          </p>

          <div style="margin-bottom: 30px; padding: 20px; background: var(--bg-secondary); border-radius: var(--radius-xs);">
            <div style="display: flex; gap: 16px; align-items: center;">
              <div style="display: inline-flex; border: 1px solid var(--border-color); border-radius: var(--radius-xs); padding: 4px 12px; gap: 16px; font-weight: 700;">
                <button onclick="cambiarCantidadDetalle(-1)">−</button>
                <span id="detalleQtySpan">1</span>
                <button onclick="cambiarCantidadDetalle(1)">+</button>
              </div>
              <button class="btn-editorial-main" style="flex: 1; padding: 16px; font-size: 13px;" onclick="agregarAlCarritoDesdeDetalle(${p.id})">
                Añadir al Carrito de Compras
              </button>
            </div>
          </div>

          <h4 style="font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 0.15em; margin-bottom: 14px; color: var(--c-brass-subtle);">
            ESPECIFICACIONES TÉCNICAS & ACABADOS
          </h4>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            ${specsRows}
          </table>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 18px; border: 1px solid var(--border-color); border-radius: var(--radius-xs); font-size: 12px;">
            <div>
              <strong>📦 Despacho Express en 24h</strong>
              <p style="color: var(--text-muted); margin-top: 2px;">Embalaje individual con espuma de alta densidad.</p>
            </div>
            <div>
              <strong>🛡️ Garantía Europea 3 Años</strong>
              <p style="color: var(--text-muted); margin-top: 2px;">Sustitución inmediata ante cualquier defecto.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p style="color: #ef4444; padding: 60px 0; text-align: center;">Error al cargar la pieza solicitada.</p>`;
  }
}

function cambiarImagenPrincipal(src, thumbEl) {
  const main = document.getElementById('mainProductViewImg');
  if (main) main.src = src;
  if (thumbEl) {
    thumbEl.parentNode.querySelectorAll('img').forEach(img => img.style.borderColor = 'transparent');
    thumbEl.style.borderColor = 'var(--c-carbon)';
  }
}

let cantidadDetalle = 1;
function cambiarCantidadDetalle(delta) {
  cantidadDetalle = Math.max(1, cantidadDetalle + delta);
  const span = document.getElementById('detalleQtySpan');
  if (span) span.textContent = cantidadDetalle;
}

function agregarAlCarritoDesdeDetalle(productoId) {
  agregarAlCarrito(productoId, cantidadDetalle);
}

// =====================================================================
// HOTSPOTS INTERACTIVOS DE ESPACIOS ARQUITECTÓNICOS
// =====================================================================
function inicializarHotspots() {
  document.querySelectorAll('.interactive-hotspot').forEach(spot => {
    spot.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = spot.dataset.id;
      const previewCard = document.getElementById(`preview-hotspot-${id}`);

      document.querySelectorAll('.hotspot-card-preview').forEach(card => card.classList.remove('active'));

      if (previewCard) {
        previewCard.classList.toggle('active');
      }
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.hotspot-card-preview').forEach(card => card.classList.remove('active'));
  });
}

// =====================================================================
// REVISTA EDITORIAL / JOURNAL (/editorial)
// =====================================================================
async function cargarArticulosEditorial() {
  const container = document.getElementById('editorialGridContainer');
  if (!container) return;

  try {
    const res = await fetch('/api/editorial');
    const data = await res.json();

    if (!data.articulos || !data.articulos.length) return;

    container.innerHTML = data.articulos.map(art => `
      <article class="journal-article-card">
        <img src="${art.imagen}" alt="${art.titulo}" loading="lazy">
        <div class="body">
          <span class="font-mono-tag" style="margin-bottom: 8px;">${art.fecha} • ${art.tiempoLectura}</span>
          <h3 style="font-size: 22px; margin-bottom: 12px; line-height: 1.25;">${art.titulo}</h3>
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.7; margin-bottom: 20px;">
            ${art.subtitulo}
          </p>
          <div style="font-size: 13px; color: var(--text-main); line-height: 1.8; margin-bottom: 24px; border-left: 2px solid var(--c-brass-subtle); padding-left: 16px;">
            ${art.contenido}
          </div>
          <span style="font-size: 12px; font-weight: 700; color: var(--c-brass-subtle);">${art.autor}</span>
        </div>
      </article>
    `).join('');
  } catch (err) {
    console.error('Error cargando editorial:', err);
  }
}

// =====================================================================
// CARRITO DE COMPRAS, CUPONES & CHECKOUT
// =====================================================================
function agregarAlCarrito(productoId, cantidad = 1) {
  const prod = STATE.productos.find(p => p.id === productoId);
  if (!prod) {
    // Si viene de otra página, consultar API
    fetch(`/api/productos/${productoId}`).then(r => r.json()).then(d => {
      if (d.success) procesarItemCarrito(d.producto, cantidad);
    });
    return;
  }
  procesarItemCarrito(prod, cantidad);
}

function procesarItemCarrito(prod, cantidad) {
  const existente = STATE.carrito.find(item => item.id === prod.id);
  if (existente) {
    existente.cantidad += cantidad;
  } else {
    STATE.carrito.push({
      id: prod.id,
      nombre: prod.nombre,
      precio: prod.precio,
      imagen: prod.imagen,
      categoria: prod.categoriaLabel,
      cantidad: cantidad
    });
  }

  guardarCarrito();
  actualizarCarritoUI();
  abrirDrawerCarrito();
  mostrarToast(`✨ Se agregó "${prod.nombre}" a tu bolsa`);
}

function modificarCantidad(productoId, delta) {
  const item = STATE.carrito.find(i => i.id === productoId);
  if (!item) return;

  item.cantidad += delta;
  if (item.cantidad <= 0) {
    STATE.carrito = STATE.carrito.filter(i => i.id !== productoId);
  }

  guardarCarrito();
  actualizarCarritoUI();
}

function eliminarDelCarrito(productoId) {
  STATE.carrito = STATE.carrito.filter(i => i.id !== productoId);
  guardarCarrito();
  actualizarCarritoUI();
  mostrarToast('Artículo removido de la bolsa');
}

function guardarCarrito() {
  localStorage.setItem('lumina_cart', JSON.stringify(STATE.carrito));
}

function actualizarCarritoUI() {
  const totalArticulos = STATE.carrito.reduce((acc, item) => acc + item.cantidad, 0);
  const badgeNavbar = document.getElementById('cartBadge');
  if (badgeNavbar) badgeNavbar.textContent = totalArticulos;

  const drawerBody = document.getElementById('drawerCartItems');
  const subtotalEl = document.getElementById('drawerSubtotal');
  const descuentoEl = document.getElementById('drawerDescuento');
  const totalEl = document.getElementById('drawerTotal');
  const shippingBar = document.getElementById('shippingProgressBar');
  const shippingText = document.getElementById('shippingProgressText');

  const subtotal = STATE.carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
  let descuento = STATE.cupon ? (subtotal * STATE.cupon.descuentoPorcentaje) / 100 : 0;
  const total = Math.max(0, subtotal - descuento);

  if (shippingBar && shippingText) {
    const porcentaje = Math.min(100, Math.round((subtotal / STATE.metaEnvioGratis) * 100));
    shippingBar.style.width = `${porcentaje}%`;

    if (subtotal >= STATE.metaEnvioGratis) {
      shippingText.innerHTML = `🎉 <strong>Envío Express de Cortesía</strong> asegurado para tu pedido.`;
    } else {
      const falta = STATE.metaEnvioGratis - subtotal;
      shippingText.innerHTML = `Agrega <strong>$${falta.toLocaleString('es-MX')}</strong> más para <strong>Envío Express Gratis</strong>.`;
    }
  }

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toLocaleString('es-MX')}`;
  if (descuentoEl) descuentoEl.textContent = `-$${descuento.toLocaleString('es-MX')}`;
  if (totalEl) totalEl.textContent = `$${total.toLocaleString('es-MX')}`;

  if (!drawerBody) return;

  if (STATE.carrito.length === 0) {
    drawerBody.innerHTML = `
      <div style="text-align: center; padding: 60px 10px; margin: auto;">
        <span class="font-mono-tag" style="margin-bottom: 12px;">BOLSA VACÍA</span>
        <h4 style="font-size: 16px; margin-bottom: 6px;">Tu selección está esperando</h4>
        <p style="color: var(--text-muted); font-size: 13px; max-width: 240px; margin: 0 auto 20px;">
          Descubre piezas acústicas, lumínicas y ergonómicas.
        </p>
        <button class="btn-editorial-main" onclick="cerrarDrawerCarrito()">Explorar Catálogo</button>
      </div>
    `;
    return;
  }

  drawerBody.innerHTML = STATE.carrito.map(item => `
    <div style="display: flex; gap: 16px; padding-bottom: 18px; border-bottom: 1px solid var(--border-color);">
      <img src="${item.imagen}" alt="${item.nombre}" style="width: 75px; height: 75px; border-radius: var(--radius-xs); object-fit: cover;">
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <h5 style="font-size: 13px; font-weight: 700; line-height: 1.3;">${item.nombre}</h5>
          <span style="font-size: 11px; color: var(--text-muted);">${item.categoria}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
          <div style="display: inline-flex; border: 1px solid var(--border-color); border-radius: var(--radius-xs); padding: 2px 8px; gap: 10px; font-size: 12px; font-weight: 700;">
            <button onclick="modificarCantidad(${item.id}, -1)">−</button>
            <span>${item.cantidad}</span>
            <button onclick="modificarCantidad(${item.id}, 1)">+</button>
          </div>
          <span style="font-size: 14px; font-weight: 800; color: var(--c-brass-subtle);">$${(item.precio * item.cantidad).toLocaleString('es-MX')}</span>
          <button onclick="eliminarDelCarrito(${item.id})" style="color: var(--text-light); font-size: 16px;">&times;</button>
        </div>
      </div>
    </div>
  `).join('');
}

async function aplicarCupon() {
  const input = document.getElementById('couponCodeInput');
  if (!input || !input.value.trim()) {
    mostrarToast('Ingresa un código de cupón');
    return;
  }

  const subtotal = STATE.carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);

  try {
    const res = await fetch('/api/cupones/validar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: input.value.trim(), subtotal })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      mostrarToast(`❌ ${data.error || 'Cupón inválido'}`);
      return;
    }

    STATE.cupon = data.cupon;
    actualizarCarritoUI();
    mostrarToast(`✨ ${data.mensaje}`);
  } catch (err) {
    mostrarToast('❌ Error de conexión al validar cupón');
  }
}

// =====================================================================
// CHECKOUT SEGURO & CONFIRMACIÓN DE PEDIDO
// =====================================================================
function abrirCheckout() {
  if (STATE.carrito.length === 0) {
    mostrarToast('Tu bolsa está vacía');
    return;
  }

  cerrarDrawerCarrito();
  const modal = document.getElementById('checkoutModal');
  if (!modal) return;

  const subtotal = STATE.carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
  let descuento = STATE.cupon ? (subtotal * STATE.cupon.descuentoPorcentaje) / 100 : 0;
  const envio = subtotal >= STATE.metaEnvioGratis ? 0 : 250;
  const total = Math.max(0, subtotal - descuento + envio);

  const subEl = document.getElementById('checkoutSubtotal');
  const envEl = document.getElementById('checkoutEnvio');
  const totEl = document.getElementById('checkoutTotal');

  if (subEl) subEl.textContent = `$${subtotal.toLocaleString('es-MX')}`;
  if (envEl) envEl.textContent = envio === 0 ? 'GRATIS' : `$${envio}`;
  if (totEl) totEl.textContent = `$${total.toLocaleString('es-MX')}`;

  if (STATE.usuarioActual) {
    const inputNombre = document.getElementById('checkoutNombre');
    const inputEmail = document.getElementById('checkoutEmail');
    const inputTel = document.getElementById('checkoutTel');
    const inputDir = document.getElementById('checkoutDireccion');
    if (inputNombre && !inputNombre.value) inputNombre.value = STATE.usuarioActual.nombre || '';
    if (inputEmail && !inputEmail.value) inputEmail.value = STATE.usuarioActual.correo || '';
    if (inputTel && !inputTel.value) inputTel.value = STATE.usuarioActual.telefono || '';
    if (inputDir && !inputDir.value) inputDir.value = STATE.usuarioActual.direccion || '';
  }

  modal.classList.add('open');
}

function cerrarCheckout() {
  const modal = document.getElementById('checkoutModal');
  if (modal) modal.classList.remove('open');
}

async function procesarPedido(event) {
  event.preventDefault();

  const nombre = document.getElementById('checkoutNombre').value.trim();
  const email = document.getElementById('checkoutEmail').value.trim();
  const tel = document.getElementById('checkoutTel').value.trim();
  const dir = document.getElementById('checkoutDireccion').value.trim();
  const ciudad = document.getElementById('checkoutCiudad').value.trim();
  const cp = document.getElementById('checkoutCP').value.trim();
  const metodoPago = document.querySelector('input[name="metodoPago"]:checked')?.value || 'Tarjeta de Crédito';

  const subtotal = STATE.carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
  const descuento = STATE.cupon ? (subtotal * STATE.cupon.descuentoPorcentaje) / 100 : 0;
  const envio = subtotal >= STATE.metaEnvioGratis ? 0 : 250;
  const total = Math.max(0, subtotal - descuento + envio);

  const payload = {
    cliente: { nombre, correo: email, telefono: tel, direccion: dir, ciudad, codigoPostal: cp },
    articulos: STATE.carrito,
    cupon: STATE.cupon ? STATE.cupon.codigo : null,
    subtotal,
    descuento,
    envio,
    total,
    metodoPago
  };

  const btn = document.getElementById('btnConfirmarPedido');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = 'Verificando y asegurando orden...';
  }

  try {
    const res = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok || !data.success) throw new Error(data.error || 'Error al procesar el pedido');

    STATE.carrito = [];
    STATE.cupon = null;
    guardarCarrito();
    actualizarCarritoUI();

    const checkoutModal = document.querySelector('.checkout-modal');
    if (checkoutModal) {
      checkoutModal.innerHTML = `
        <div style="text-align: center; padding: 40px 10px;">
          <span class="font-mono-tag" style="margin-bottom: 12px; color: #10b981;">PAGO CONFIRMADO • GUÍA GENERADA</span>
          <h2 style="font-size: 32px; margin-bottom: 14px;">Gracias por tu adquisición, ${nombre.split(' ')[0]}</h2>
          <p style="color: var(--text-muted); font-size: 14px; max-width: 500px; margin: 0 auto 28px; line-height: 1.7;">
            Tu orden <strong>${data.pedido.id}</strong> ha sido registrada y nuestros artesanos ya están preparando el embalaje de alta densidad para tu envío.
          </p>

          <div style="background: var(--bg-secondary); border-radius: var(--radius-xs); padding: 22px; max-width: 440px; margin: 0 auto 30px; font-size: 13px; text-align: left; border: 1px solid var(--border-color);">
            <p style="margin-bottom: 6px;"><strong>Número de Guía:</strong> <code>${data.pedido.guiaRastreo}</code></p>
            <p style="margin-bottom: 6px;"><strong>Monto Total:</strong> $${data.pedido.total.toLocaleString('es-MX')} MXN</p>
            <p><strong>Destino:</strong> ${dir}, ${ciudad}</p>
          </div>

          <div style="display: flex; justify-content: center; gap: 14px; flex-wrap: wrap;">
            <a href="/dashboard" class="btn-editorial-main">Rastrear en Mi Portal</a>
            <button class="btn-editorial-ghost" onclick="cerrarCheckout(); window.location.href='/';">Continuar en la Tienda</button>
          </div>
        </div>
      `;
    }
  } catch (err) {
    mostrarToast(`❌ ${err.message}`);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Completar Compra Segura';
    }
  }
}

// =====================================================================
// FAVORITOS (WISHLIST)
// =====================================================================
function toggleFavorito(productoId, event) {
  if (event) event.stopPropagation();

  const idx = STATE.favoritos.indexOf(productoId);
  if (idx > -1) {
    STATE.favoritos.splice(idx, 1);
    mostrarToast('Pieza removida de tu lista de deseos');
  } else {
    STATE.favoritos.push(productoId);
    mostrarToast('✨ Pieza guardada en tu lista de deseos');
  }

  localStorage.setItem('lumina_wishlist', JSON.stringify(STATE.favoritos));
  if (document.getElementById('productosGrid')) {
    renderizarProductos(STATE.productos);
  }
}

// =====================================================================
// UTILIDADES: TOASTS, TEMA Y USUARIO
// =====================================================================
function mostrarToast(mensaje) {
  let toast = document.getElementById('toastNotification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotification';
    toast.className = 'toast-box';
    document.body.appendChild(toast);
  }

  toast.innerHTML = mensaje;
  toast.classList.add('show');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

function inicializarTema() {
  const temaGuardado = localStorage.getItem('lumina_theme') || 'light';
  document.documentElement.setAttribute('data-theme', temaGuardado);
  actualizarIconoTema(temaGuardado);
}

function toggleTema() {
  const temaActual = document.documentElement.getAttribute('data-theme') || 'light';
  const nuevoTema = temaActual === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', nuevoTema);
  localStorage.setItem('lumina_theme', nuevoTema);
  actualizarIconoTema(nuevoTema);
}

function actualizarIconoTema(tema) {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    btn.innerHTML = tema === 'dark' 
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
  }
}

function actualizarBarraUsuario() {
  const userBtn = document.getElementById('userAccountBtn');
  if (!userBtn) return;

  if (STATE.usuarioActual) {
    if (STATE.usuarioActual.rol === 'admin' || STATE.usuarioActual.rol === 'editor') {
      userBtn.innerHTML = `
        <a href="/admin" class="btn-editorial-main" style="padding: 8px 14px; font-size: 11px;">
          ⚡ ${STATE.usuarioActual.rol.toUpperCase()}
        </a>
      `;
    } else {
      userBtn.innerHTML = `
        <a href="/dashboard" style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700;">
          <img src="${STATE.usuarioActual.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--c-brass-subtle);">
          <span>${STATE.usuarioActual.nombre.split(' ')[0]}</span>
        </a>
      `;
    }
  } else {
    userBtn.innerHTML = `
      <a href="/auth" class="btn-editorial-main" style="padding: 8px 16px; font-size: 11px;">
        Acceso
      </a>
    `;
  }
}

function abrirDrawerCarrito() {
  const overlay = document.getElementById('cartDrawerOverlay');
  if (overlay) overlay.classList.add('open');
}

function cerrarDrawerCarrito() {
  const overlay = document.getElementById('cartDrawerOverlay');
  if (overlay) overlay.classList.remove('open');
}

function configurarEventosGlobales() {
  const overlay = document.getElementById('cartDrawerOverlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cerrarDrawerCarrito();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrarDrawerCarrito();
      cerrarCheckout();
    }
  });
}


// =====================================================================
// 13. SLIDER COMPARATIVO ANTES / DESPUÉS (RAW VS FINISHED)
// =====================================================================
function inicializarSliderComparador() {
  const container = document.getElementById('splitComparisonContainer');
  const overlay = document.getElementById('splitOverlay');
  const handle = document.getElementById('splitHandle');
  if (!container || !overlay || !handle) return;

  let isDragging = false;

  function actualizarPosicion(clientX) {
    const rect = container.getBoundingClientRect();
    let x = clientX - rect.left;
    let percent = (x / rect.width) * 100;
    if (percent < 3) percent = 3;
    if (percent > 97) percent = 97;

    overlay.style.width = `${percent}%`;
    handle.style.left = `${percent}%`;
  }

  function onMouseDown(e) {
    isDragging = true;
    actualizarPosicion(e.clientX);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    actualizarPosicion(e.clientX);
  }

  function onMouseUp() {
    isDragging = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }

  function onTouchStart(e) {
    isDragging = true;
    if (e.touches && e.touches[0]) actualizarPosicion(e.touches[0].clientX);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
  }

  function onTouchMove(e) {
    if (!isDragging || !e.touches || !e.touches[0]) return;
    actualizarPosicion(e.touches[0].clientX);
  }

  function onTouchEnd() {
    isDragging = false;
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
  }

  container.addEventListener('mousedown', onMouseDown);
  container.addEventListener('touchstart', onTouchStart, { passive: true });
}

// =====================================================================
// 14. REEL DE IMÁGENES CON SCROLL HORIZONTAL CINEMATOGRÁFICO
// =====================================================================
let reelDragState = {
  isDown: false,
  startX: 0,
  scrollLeft: 0
};

function inicializarReelScroll() {
  const slider = document.getElementById('scrollReelWrapper');
  if (!slider) return;

  slider.addEventListener('mousedown', (e) => {
    reelDragState.isDown = true;
    slider.style.cursor = 'grabbing';
    reelDragState.startX = e.pageX - slider.offsetLeft;
    reelDragState.scrollLeft = slider.scrollLeft;
  });

  slider.addEventListener('mouseleave', () => {
    reelDragState.isDown = false;
    slider.style.cursor = 'grab';
  });

  slider.addEventListener('mouseup', () => {
    reelDragState.isDown = false;
    slider.style.cursor = 'grab';
  });

  slider.addEventListener('mousemove', (e) => {
    if (!reelDragState.isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - reelDragState.startX) * 1.5;
    slider.scrollLeft = reelDragState.scrollLeft - walk;
  });

  // Scroll horizontal suave con rueda del ratón
  slider.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      slider.scrollBy({ left: e.deltaY * 1.2, behavior: 'auto' });
    }
  }, { passive: false });
}

function desplazarReel(direccion) {
  const slider = document.getElementById('scrollReelWrapper');
  if (slider) {
    slider.scrollBy({ left: direccion * 480, behavior: 'smooth' });
  }
}

// =====================================================================
// 15. GLOBO TERRÁQUEO 3D INTERACTIVO (WEBGL + THREE.JS / GLOBE.GL)
// =====================================================================
let globeInstance = null;
let isAutoRotating = true;

const SEDES_3D = {
  mundo: {
    nombre: 'Vista Orbital 3D',
    lat: 23.5,
    lng: -45.0,
    altitude: 2.2,
    tipo: 'COBERTURA GLOBAL'
  },
  tampico: {
    nombre: 'Atelier Central Tampico',
    lat: 22.2558,
    lng: -97.8687,
    altitude: 0.65,
    direccion: 'Av. Hidalgo 3402, Tampico, Tamaulipas',
    descripcion: 'Taller central de ingeniería acústica de berilio, maquinado CNC en maderas nobles y manufactura artesanal.',
    telefono: '+52 (833) 245-8900',
    tipo: 'ATELIER & MANUFACTURA'
  },
  cdmx: {
    nombre: 'Showroom Audición Polanco',
    lat: 19.4298,
    lng: -99.1915,
    altitude: 0.65,
    direccion: 'Campos Elíseos 204, Polanco, Ciudad de México',
    descripcion: 'Cámara anecoica tratada para pruebas de audición privada y exhibición de piezas de autor con concierge.',
    telefono: '+52 (55) 8900-2450',
    tipo: 'SHOWROOM & SALA DE AUDICIÓN'
  }
};

const GLOBE_POINTS = [
  { lat: 22.2558, lng: -97.8687, name: 'Atelier Tampico', size: 1.2, color: '#C5A880', key: 'tampico' },
  { lat: 19.4298, lng: -99.1915, name: 'Showroom Polanco CDMX', size: 1.0, color: '#C5A880', key: 'cdmx' },
  { lat: 45.4642, lng: 9.1900, name: 'Estudio de Diseño Milán', size: 0.7, color: '#C6BBA8' },
  { lat: 55.6761, lng: 12.5683, name: 'Lab Acústico Copenhague', size: 0.7, color: '#C6BBA8' },
  { lat: 35.6762, lng: 139.6503, name: 'Artesanía Roble Tokio', size: 0.7, color: '#C6BBA8' }
];

const GLOBE_ARCS = [
  { startLat: 22.2558, startLng: -97.8687, endLat: 19.4298, endLng: -99.1915, color: ['#C5A880', '#E5D3B8'] },
  { startLat: 22.2558, startLng: -97.8687, endLat: 45.4642, endLng: 9.1900, color: ['#C5A880', '#998A78'] },
  { startLat: 22.2558, startLng: -97.8687, endLat: 55.6761, endLng: 12.5683, color: ['#C5A880', '#998A78'] },
  { startLat: 22.2558, startLng: -97.8687, endLat: 35.6762, endLng: 139.6503, color: ['#C5A880', '#998A78'] }
];

const GLOBE_RINGS = [
  { lat: 22.2558, lng: -97.8687, maxR: 7, propagationSpeed: 2.2, repeatPeriod: 1200, color: () => '#C5A880' },
  { lat: 19.4298, lng: -99.1915, maxR: 6, propagationSpeed: 2.2, repeatPeriod: 1400, color: () => '#C5A880' }
];

function inicializarGlobo3D() {
  const container = document.getElementById('lumina3DGlobe');
  if (!container || typeof Globe === 'undefined') return;

  const width = container.clientWidth || container.parentElement.clientWidth || 1000;
  const height = container.clientHeight || 620;

  globeInstance = Globe()(container)
    .width(width)
    .height(height)
    .globeImageUrl('https://cdn.jsdelivr.net/npm/three-globe@2.31.2/example/img/earth-night.jpg')
    .bumpImageUrl('https://cdn.jsdelivr.net/npm/three-globe@2.31.2/example/img/earth-topology.png')
    .backgroundImageUrl('https://cdn.jsdelivr.net/npm/three-globe@2.31.2/example/img/night-sky.png')
    .showAtmosphere(true)
    .atmosphereColor('#C5A880')
    .atmosphereAltitude(0.25)
    .pointsData(GLOBE_POINTS)
    .pointLat('lat')
    .pointLng('lng')
    .pointColor('color')
    .pointAltitude(0.04)
    .pointRadius('size')
    .pointLabel(d => `<div style="background:#181818; color:#F7F6F2; padding:6px 12px; border:1px solid #C5A880; border-radius:4px; font-family:'Cinzel',serif; font-size:11px; box-shadow:0 8px 20px rgba(0,0,0,0.6);">📍 <strong>${d.name}</strong></div>`)
    .onPointClick(point => {
      if (point.key) centrarSede3D(point.key);
    })
    .ringsData(GLOBE_RINGS)
    .ringColor(d => d.color)
    .ringMaxRadius('maxR')
    .ringPropagationSpeed('propagationSpeed')
    .ringRepeatPeriod('repeatPeriod')
    .arcsData(GLOBE_ARCS)
    .arcColor('color')
    .arcAltitude(0.35)
    .arcStroke(0.7)
    .arcDashLength(0.9)
    .arcDashGap(0.25)
    .arcDashAnimateTime(3000);

  // Configuración de los controles orbitales 3D
  const controls = globeInstance.controls();
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;
  controls.enableZoom = true;

  // Ajustar dimensiones en caso de resize de la pantalla
  window.addEventListener('resize', () => {
    if (container && globeInstance) {
      globeInstance.width(container.clientWidth).height(container.clientHeight);
    }
  });

  // Posición inicial del globo
  globeInstance.pointOfView({ lat: 23.5, lng: -45, altitude: 2.2 }, 1500);

  // HUD de coordenadas en tiempo real al interactuar con el globo
  controls.addEventListener('change', () => {
    const pov = globeInstance.pointOfView();
    const latStr = `${Math.abs(pov.lat).toFixed(2)}° ${pov.lat >= 0 ? 'N' : 'S'}`;
    const lngStr = `${Math.abs(pov.lng).toFixed(2)}° ${pov.lng >= 0 ? 'E' : 'W'}`;
    const coordsEl = document.getElementById('hudCoords');
    if (coordsEl) coordsEl.textContent = `${latStr}, ${lngStr} • Altitud ${pov.altitude.toFixed(2)}`;
  });
}

let streetMapInstance = null;
let isStreetMode = false;

function centrarSede3D(sede) {
  if (!globeInstance || !SEDES_3D[sede]) return;
  const data = SEDES_3D[sede];
  const btnMundo   = document.getElementById('btnSedeMundo');
  const btnTampico = document.getElementById('btnSedeTampico');
  const btnCdmx    = document.getElementById('btnSedeCdmx');
  const hudSede    = document.getElementById('hudSedeName');

  [btnMundo, btnTampico, btnCdmx].forEach(b => b && b.classList.remove('active'));
  if (sede === 'mundo'   && btnMundo)   btnMundo.classList.add('active');
  if (sede === 'tampico' && btnTampico) btnTampico.classList.add('active');
  if (sede === 'cdmx'    && btnCdmx)    btnCdmx.classList.add('active');
  if (hudSede) hudSede.textContent = data.nombre;

  if (sede === 'mundo') { volverAGlobo(); return; }

  globeInstance.controls().autoRotate = false;
  actualizarBotonAutoRotar(false);

  // Populate the info card fields
  const card = document.getElementById('sedeFloatingCard');
  if (card) {
    document.getElementById('cardTipo').textContent      = data.tipo;
    document.getElementById('cardNombre').textContent    = data.nombre;
    document.getElementById('cardDireccion').textContent = data.direccion;
    document.getElementById('cardDescripcion').textContent = data.descripcion;
    const telLink = document.getElementById('cardTelefono');
    if (telLink) {
      telLink.textContent = '📞 ' + data.telefono;
      telLink.href = 'tel:' + data.telefono.replace(/\s+/g, '');
    }
  }

  // Phase 1: fly the 3D globe toward the city
  globeInstance.pointOfView({ lat: data.lat, lng: data.lng, altitude: 0.5 }, 2000);

  // Phase 2: after the animation, transition to Leaflet street-level map
  setTimeout(() => mostrarMapaCalles(sede, data), 2400);
}

function mostrarMapaCalles(sede, data) {
  const globeEl   = document.getElementById('lumina3DGlobe');
  const streetEl  = document.getElementById('luminaStreetMap');
  const btnVolver = document.getElementById('btnVolverGlobo');
  const card      = document.getElementById('sedeFloatingCard');
  const pill      = document.getElementById('modeIndicatorPill');
  const hud       = document.getElementById('hudCoords');

  isStreetMode = true;
  if (globeEl)   globeEl.style.opacity = '0';
  if (streetEl)  { streetEl.style.opacity = '1'; streetEl.style.pointerEvents = 'all'; }
  if (btnVolver) btnVolver.style.display = 'block';
  if (card)      card.style.display      = 'block';
  if (pill) pill.textContent = 'Mapa 3D • Arrastra para girar • Scroll para zoom • Pellizca para inclinar';
  if (hud)  hud.textContent  = data.nombre + ' — Vista 3D';

  if (!streetMapInstance) {
    // ── Create MapLibre GL JS map ──────────────────────────────────────────
    streetMapInstance = new maplibregl.Map({
      container:   'luminaStreetMap',
      style:       'https://tiles.openfreemap.org/styles/dark',
      center:      [data.lng, data.lat],
      zoom:        15.5,
      minZoom:     11,
      maxZoom:     19,
      pitch:       55,
      bearing:     -20,
      antialias:   true
    });

    streetMapInstance.on('load', () => {
      // Base style loaded - ready for 3D extrusion

      // ── Recolor base layers to black/white/gold palette ──────────────────
      const map = streetMapInstance;

      // Background -> deep black
      if (map.getLayer('background')) {
        map.setPaintProperty('background', 'background-color', '#0a0a0a');
      }

      // Water -> near-black with subtle blue-black tint
      ['water', 'water_area', 'water-body'].forEach(id => {
        if (map.getLayer(id)) map.setPaintProperty(id, 'fill-color', '#0d0d12');
      });

      // Roads: gold for major, dim-white for minor
      [
        { ids: ['road_motorway', 'highway_motorway', 'road_trunk', 'trunk'],       color: '#C5A880', width: 3 },
        { ids: ['road_primary', 'primary', 'road_secondary', 'secondary'],         color: '#9e866a', width: 2 },
        { ids: ['road_tertiary', 'tertiary', 'road_minor', 'road_service'],        color: '#3a3530', width: 1 },
        { ids: ['road_path', 'footway', 'pedestrian', 'steps'],                   color: '#2a2520', width: 1 }
      ].forEach(({ ids, color }) => {
        ids.forEach(id => {
          if (map.getLayer(id)) {
            try { map.setPaintProperty(id, 'line-color', color); } catch(e) {}
          }
        });
      });

      // Land / parks -> very dark
      ['landuse', 'landcover', 'park', 'greenery', 'grass'].forEach(id => {
        if (map.getLayer(id)) {
          try { map.setPaintProperty(id, 'fill-color', '#111109'); } catch(e) {}
        }
      });

      // Buildings footprint -> dark charcoal base before extrusion
      ['building', 'building-outline', 'building_fill'].forEach(id => {
        if (map.getLayer(id)) {
          try { map.setPaintProperty(id, 'fill-color', '#1a1814'); } catch(e) {}
        }
      });

      // ── 3D Gold Buildings ─────────────────────────────────────────────────
      // Find the first symbol layer to insert buildings below labels
      let firstSymbolId;
      for (const layer of map.getStyle().layers) {
        if (layer.type === 'symbol') { firstSymbolId = layer.id; break; }
      }

      // Check for building source layer in the loaded style
      const buildingSource = map.getStyle().layers.find(
        l => l['source-layer'] === 'building' || l['source-layer'] === 'buildings'
      );
      const srcLayer = buildingSource ? buildingSource['source-layer'] : 'building';
      const srcName  = buildingSource ? buildingSource.source : 'openmaptiles';

      map.addLayer({
        id:             'lumina-3d-buildings',
        type:           'fill-extrusion',
        source:         srcName,
        'source-layer': srcLayer,
        minzoom:        14,
        paint: {
          'fill-extrusion-color': [
            'interpolate', ['linear'], ['get', 'render_height'],
            0,  '#1c1916',
            10, '#3a3026',
            30, '#7a6040',
            80, '#C5A880'
          ],
          'fill-extrusion-height': [
            'interpolate', ['linear'], ['zoom'],
            14, 0, 14.5, ['coalesce', ['get', 'render_height'], ['get', 'height'], 10]
          ],
          'fill-extrusion-base': [
            'interpolate', ['linear'], ['zoom'],
            14, 0, 14.5, ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0]
          ],
          'fill-extrusion-opacity': 0.92,
          'fill-extrusion-ambient-occlusion-intensity': 0.4,
          'fill-extrusion-ambient-occlusion-radius':     3
        }
      }, firstSymbolId);

      // ── Gold pulsing marker ───────────────────────────────────────────────
      const el = document.createElement('div');
      el.className = 'custom-gold-pin';
      el.style.cssText = 'width:28px;height:28px;cursor:pointer;';
      new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([data.lng, data.lat])
        .addTo(map);

      // ── Compass / navigation control ─────────────────────────────────────
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    });

    // ── Si el usuario se aleja (zoom out), volver automáticamente a la esfera 3D ──
    streetMapInstance.on('zoom', () => {
      if (isStreetMode && streetMapInstance.getZoom() <= 11.2) {
        volverAGlobo();
      }
    });

    // ── Update HUD on camera move ─────────────────────────────────────────
    streetMapInstance.on('move', () => {
      const c   = streetMapInstance.getCenter();
      const z   = streetMapInstance.getZoom().toFixed(1);
      const pit = streetMapInstance.getPitch().toFixed(0);
      const el  = document.getElementById('hudCoords');
      if (el) {
        el.textContent =
          Math.abs(c.lat).toFixed(5) + (c.lat >= 0 ? 'N' : 'S') + ' ' +
          Math.abs(c.lng).toFixed(5) + (c.lng >= 0 ? 'E' : 'W') +
          '  •  Zoom ' + z + 'x  •  Tilt ' + pit + '°';
      }
    });

  } else {
    // ── Map already exists — fly to new location ──────────────────────────
    // Remove previous gold pins
    const existing = document.querySelectorAll('#luminaStreetMap .custom-gold-pin');
    existing.forEach(e => e.remove());

    streetMapInstance.flyTo({
      center:  [data.lng, data.lat],
      zoom:    15.5,
      pitch:   55,
      bearing: -20,
      duration: 1600,
      essential: true
    });

    // Add new marker after fly starts
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'custom-gold-pin';
      el.style.cssText = 'width:28px;height:28px;cursor:pointer;';
      new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([data.lng, data.lat])
        .addTo(streetMapInstance);
    }, 200);
  }

  // Trigger a resize after the crossfade completes
  setTimeout(() => streetMapInstance && streetMapInstance.resize(), 1000);
}

function volverAGlobo() {
  const globeEl   = document.getElementById('lumina3DGlobe');
  const streetEl  = document.getElementById('luminaStreetMap');
  const btnVolver = document.getElementById('btnVolverGlobo');
  const card      = document.getElementById('sedeFloatingCard');
  const pill      = document.getElementById('modeIndicatorPill');
  const hudSede   = document.getElementById('hudSedeName');
  const hudCoords = document.getElementById('hudCoords');
  const btnMundo   = document.getElementById('btnSedeMundo');
  const btnTampico = document.getElementById('btnSedeTampico');
  const btnCdmx    = document.getElementById('btnSedeCdmx');

  isStreetMode = false;
  if (globeEl)   globeEl.style.opacity = '1';
  if (streetEl)  { streetEl.style.opacity = '0'; streetEl.style.pointerEvents = 'none'; }
  if (btnVolver) btnVolver.style.display = 'none';
  if (card)      card.style.display = 'none';
  if (pill)      pill.textContent = 'Arrastra el planeta 3D para girar • Selecciona una sede para ver las calles';
  if (hudSede)   hudSede.textContent  = 'Globo 3D Orbital';
  if (hudCoords) hudCoords.textContent = 'Rotacion 360 Libre';

  [btnMundo, btnTampico, btnCdmx].forEach(b => b && b.classList.remove('active'));
  if (btnMundo) btnMundo.classList.add('active');

  if (globeInstance) {
    globeInstance.controls().autoRotate = true;
    actualizarBotonAutoRotar(true);
    globeInstance.pointOfView({ lat: 23.5, lng: -45, altitude: 2.2 }, 1800);
  }
}

function toggleAutoRotacion3D() {
  if (!globeInstance) return;
  const controls = globeInstance.controls();
  controls.autoRotate = !controls.autoRotate;
  actualizarBotonAutoRotar(controls.autoRotate);
}

function actualizarBotonAutoRotar(activo) {
  isAutoRotating = activo;
  const icon = document.getElementById('rotateIcon');
  const text = document.getElementById('rotateText');
  if (icon && text) {
    icon.textContent = activo ? '🔄' : '▶️';
    text.textContent = activo ? 'Pausar Giro' : 'Reanudar Giro';
  }
}

function cerrarCardSede() {
  const card = document.getElementById('sedeFloatingCard');
  if (card) card.style.display = 'none';
}

// =====================================================================
// 16. EFECTO 3D TILT EN IMÁGENES Y TARJETAS
// =====================================================================
function inicializarEfecto3D() {
  const cards = document.querySelectorAll('.tilt-interactive-card, .luxury-product-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });
}
