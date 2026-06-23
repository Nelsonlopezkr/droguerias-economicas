/* ══════════════════════════════════════════════════════════
 *  Droguerías Económicas — Carrito PRO v2.0
 *  Mejoras: barra envío gratis, sugerencias, precio en badge,
 *           animación fly-to-cart, feedback visual botones
 * ══════════════════════════════════════════════════════════ */

/* ─── Estado del carrito ─── */
var carrito = [];

try {
  var _carritoRaw    = localStorage.getItem('de_carrito');
  var _carritoParsed = _carritoRaw ? JSON.parse(_carritoRaw) : [];
  _carritoParsed = Array.isArray(_carritoParsed) ? _carritoParsed : [];
  /* Migrar keys antiguas al nuevo formato id_vN_pN / id_vN_pX */
  _carritoParsed.forEach(function(item) {
    if (item.key && !/^[^_]+_v\d+_p/.test(item.key)) {
      /* key vieja: reconstruir */
      item.key = item.id + '_v0_pX';
    }
  });
  carrito = _carritoParsed;
} catch (e) {
  carrito = [];
}

/* ─── Helper precio ─── */
function _cop(n) {
  return '$' + Number(n).toLocaleString('es-CO');
}

/* ─── Guardar ─── */
function guardarCarrito() {
  try { localStorage.setItem('de_carrito', JSON.stringify(carrito)); } catch (e) {}
}

/* ─── Reglas de productos sugeridos ─── */
var SUGERENCIAS_MAP = {
  1:  [4, 22, 5],    // Acetaminofén → Antigripal, Vitamina C, Loratadina
  2:  [16, 1],       // Ibuprofeno → Diclofenaco, Acetaminofén
  4:  [1, 22],       // Antigripal → Acetaminofén, Vitamina C
  6:  [14, 33],      // Omeprazol → ENO, Simeticona
  32: [31],          // Electrolit → Sales rehidratación
  301:[304, 305],    // Pañales Pampers → Toallitas, Bepanthen
  302:[304, 305],    // Pañales Huggies → Toallitas, Bepanthen
  101:[102, 103],    // Shampoo → Acondicionador, Crema peinar
  201:[202, 204],    // Jabón Dove → Desodorante, Pasta dental
};

function getSugerencias() {
  if (!carrito.length || typeof CATALOGO === 'undefined') return [];
  var yaEnCarrito = carrito.map(function(i) { return i.id; });
  var candidatos  = [];

  carrito.forEach(function(item) {
    var sugs = SUGERENCIAS_MAP[item.id];
    if (!sugs) return;
    sugs.forEach(function(sid) {
      if (yaEnCarrito.indexOf(sid) === -1 && candidatos.indexOf(sid) === -1) {
        candidatos.push(sid);
      }
    });
  });

  return candidatos.slice(0, 3).map(function(sid) {
    return CATALOGO.find(function(p) { return p.id === sid; });
  }).filter(Boolean);
}

/* ─── Agregar ─── */
function agregarAlCarrito(producto, varianteIdx, triggerEl, presentacionIdx) {
  varianteIdx = parseInt(varianteIdx != null ? varianteIdx : 0);

  /* ══════════════════════════════════════════════════════════════
     CORRECCIÓN BUG #2: Soporte completo para sistema laboratorios{}
     Si el producto tiene laboratorios{}, leer el lab activo y su
     precio activo directamente desde laboratoriosActivos /
     presentacionesActivas (mismos objetos que usa catalogo.js).
     NO recalcular precios — usar el precio tal como lo ve el usuario.
  ══════════════════════════════════════════════════════════════ */

  var _labActivo    = null;  /* objeto laboratorio activo */
  var _labKeyActivo = null;  /* key del laboratorio */
  var _precObjActivo = null; /* objeto precio activo dentro del lab */
  var _precKeyActivo = null;

  var _tieneLabs = producto.laboratorios && Object.keys(producto.laboratorios).length > 0;

  if (_tieneLabs) {
    /* Leer lab activo desde el estado global de catalogo.js */
    var _labsRef  = (typeof laboratoriosActivos !== 'undefined') ? laboratoriosActivos : {};
    var _presRef  = (typeof presentacionesActivas !== 'undefined') ? presentacionesActivas : {};
    var _labKeys  = Object.keys(producto.laboratorios);
    _labKeyActivo = _labsRef[producto.id] || _labKeys[0];
    if (!producto.laboratorios[_labKeyActivo]) _labKeyActivo = _labKeys[0];
    _labActivo    = producto.laboratorios[_labKeyActivo];

    var _precKeys = Object.keys(_labActivo.precios);
    _precKeyActivo = _presRef[producto.id + '_' + _labKeyActivo] || _precKeys[0];
    if (!_labActivo.precios[_precKeyActivo]) _precKeyActivo = _precKeys[0];
    _precObjActivo = _labActivo.precios[_precKeyActivo];
  }

  /* ── Variante (sistema viejo) ── */
  var variantes = Array.isArray(producto.variantes) ? producto.variantes
    : [{ tipo: producto.variante || '', precio: producto.precio || 0, imagen: producto.imagen || '' }];
  var variante = variantes[varianteIdx] || variantes[0];

  /* ── Presentación (sistema viejo con presentaciones[]) ── */
  var _pi = (presentacionIdx !== undefined && presentacionIdx !== null) ? parseInt(presentacionIdx) : -1;
  var tienePres = _pi >= 0 && producto.presentaciones && producto.presentaciones[_pi];
  var tipoPres   = tienePres ? producto.presentaciones[_pi].tipo  : '';

  /* ── Precio final: NUNCA recalcular ──
     Prioridad: 1) laboratorio activo  2) presentación activa  3) variante */
  var precioPres;
  var nombreVarianteCarrito;
  var imagenCarrito;
  var labNombreCarrito = '';

  if (_tieneLabs && _precObjActivo) {
    /* Sistema nuevo: precio directo del objeto de precio del lab */
    precioPres            = _precObjActivo.precio;
    nombreVarianteCarrito = _labActivo.nombre.split(' ')[0] + ' — ' + _precObjActivo.label;
    labNombreCarrito      = _labActivo.nombre.split(' ')[0];
    /* Imagen: PRIORIDAD 1 → campo imagen directo en laboratorio{}
                PRIORIDAD 2 → variante que coincida por nombre de lab
                PRIORIDAD 3 → imagen general del producto */
    var _imgLab = _labActivo.imagen || null;
    if (!_imgLab && Array.isArray(producto.variantes)) {
      var _labKeyLower2 = _labKeyActivo.toLowerCase();
      var _matchedVar = producto.variantes.find(function(v) {
        var vl = (v.laboratorio || '').toLowerCase();
        return vl && vl.length >= 2 && (
          _labKeyLower2.includes(vl) ||
          _labKeyLower2.replace(/_/g,'').includes(vl.replace(/\s/g,'')) ||
          (_labActivo.nombreProducto && _labActivo.nombreProducto.toLowerCase().includes(vl))
        );
      });
      if (_matchedVar && _matchedVar.imagen) _imgLab = _matchedVar.imagen;
    }
    imagenCarrito = _imgLab || producto.imagen || '';
  } else if (tienePres) {
    precioPres            = producto.presentaciones[_pi].precio;
    nombreVarianteCarrito = variante.tipo || variante.laboratorio || '';
    imagenCarrito         = variante.imagen || producto.imagen || '';
  } else {
    /* Sistema viejo sin presentaciones */
    precioPres            = variante.precio || 0;
    nombreVarianteCarrito = variante.tipo || '';
    imagenCarrito         = variante.imagen || producto.imagen || '';
  }

  /* Key única por combinación producto + laboratorio/variante + presentación */
  var keyPart = _tieneLabs
    ? ('_lab_' + _labKeyActivo + '_p_' + _precKeyActivo)
    : ('_v' + varianteIdx + (tienePres ? '_p' + _pi : '_pX'));
  var key = producto.id + keyPart;

  var existente = carrito.find(function(i) { return i.key === key; });

  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push({
      key:          key,
      id:           producto.id,
      nombre:       producto.nombre,
      imagen:       imagenCarrito,
      categoria:    producto.categoria || '',
      variante:     nombreVarianteCarrito,
      laboratorio:  labNombreCarrito,
      presentacion: _tieneLabs ? _precObjActivo.label : tipoPres,
      precio:       precioPres,
      cantidad:     1
    });
  }

  guardarCarrito();
  actualizarUI();
  mostrarToast('✅ ' + producto.nombre + ' agregado al carrito');

  /* Animación fly-to-cart */
  if (triggerEl) flyToCart(triggerEl);

  /* Feedback visual en botón */
  if (triggerEl) {
    var originalHTML = triggerEl.innerHTML;
    triggerEl.innerHTML = '<i class="fas fa-check"></i>';
    triggerEl.style.background = '#2E7D32';
    setTimeout(function() {
      triggerEl.innerHTML = originalHTML;
      triggerEl.style.background = '';
    }, 1200);
  }
}

/* ─── Animación fly-to-cart ─── */
function flyToCart(btn) {
  var cartBtn = document.getElementById('btnAbrirCarrito');
  if (!cartBtn || !btn) return;

  var btnRect  = btn.getBoundingClientRect();
  var cartRect = cartBtn.getBoundingClientRect();

  var dot = document.createElement('div');
  dot.style.cssText = [
    'position:fixed',
    'width:14px',
    'height:14px',
    'background:var(--azul,#1565C0)',
    'border-radius:50%',
    'z-index:99999',
    'pointer-events:none',
    'top:' + (btnRect.top + btnRect.height / 2 - 7) + 'px',
    'left:' + (btnRect.left + btnRect.width / 2 - 7) + 'px',
    'transition:all .55s cubic-bezier(.25,.46,.45,.94)',
    'opacity:1'
  ].join(';');
  document.body.appendChild(dot);

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      dot.style.top  = (cartRect.top + cartRect.height / 2 - 7) + 'px';
      dot.style.left = (cartRect.left + cartRect.width / 2 - 7) + 'px';
      dot.style.opacity = '0';
      dot.style.transform = 'scale(0.3)';
      setTimeout(function() { document.body.removeChild(dot); }, 600);
    });
  });
}
window.flyToCart = flyToCart;

/* ─── Eliminar ─── */
function eliminarDelCarrito(key) {
  carrito = carrito.filter(function(i) { return i.key !== key; });
  guardarCarrito();
  actualizarUI();
}

/* ─── Cantidad ─── */
function cambiarCantidad(key, delta) {
  carrito.forEach(function(i) {
    if (i.key === key) {
      i.cantidad = Math.max(1, i.cantidad + delta);
    }
  });
  guardarCarrito();
  actualizarUI();
}

/* ─── Vaciar ─── */
function vaciarCarrito() {
  if (!carrito.length) return;
  if (!confirm('¿Deseas vaciar el carrito?')) return;
  carrito = [];
  guardarCarrito();
  actualizarUI();
}

/* ─── Totales ─── */
function calcularTotales() {
  var subtotal = carrito.reduce(function(acc, i) { return acc + i.precio * i.cantidad; }, 0);
  var envio    = 0; /* Domicilio siempre GRATIS — política comercial actualizada */
  return { subtotal: subtotal, envio: envio, total: subtotal + envio };
}

/* ─── Barra de progreso envío gratis ─── */
function renderBarraEnvio(subtotal) {
  var META   = 0; /* Domicilio siempre gratis — sin mínimo */
  var pct    = Math.min(100, Math.round((subtotal / META) * 100));
  var falta  = META - subtotal;

  if (subtotal === 0) return '';
  if (subtotal >= META) {
    return '<div class="envio-progreso-wrap">' +
      '<div class="envio-progreso-msg envio-libre">🎉 ¡Envío gratis desbloqueado!</div>' +
      '<div class="envio-progreso-bar"><div class="envio-progreso-fill" style="width:100%"></div></div>' +
    '</div>';
  }
  return '<div class="envio-progreso-wrap">' +
    '<div class="envio-progreso-msg">Te faltan <strong>' + _cop(falta) + '</strong> para <strong>envío gratis</strong></div>' +
    '<div class="envio-progreso-bar"><div class="envio-progreso-fill" style="width:' + pct + '%"></div></div>' +
  '</div>';
}

/* ─── UI ─── */
function actualizarUI() {
  var totalItems = carrito.reduce(function(acc, i) { return acc + i.cantidad; }, 0);
  var t = calcularTotales();

  /* Badge */
  document.querySelectorAll('.carrito-badge').forEach(function(b) {
    b.textContent = totalItems;
    b.classList.toggle('oculto', totalItems === 0);
  });

  /* Precio en botón del navbar */
  var btnCarrito = document.getElementById('btnAbrirCarrito');
  if (btnCarrito) {
    var precioSpan = btnCarrito.querySelector('.carrito-precio-inline');
    if (!precioSpan) {
      precioSpan = document.createElement('span');
      precioSpan.className = 'carrito-precio-inline';
      btnCarrito.appendChild(precioSpan);
    }
    precioSpan.textContent = totalItems > 0 ? ' · ' + _cop(t.subtotal) : '';
  }

  /* Barra mobile bottom */
  actualizarBarraMobile(totalItems, t);

  var itemsEl = document.getElementById('carritoItems') || document.querySelector('.carrito-items');
  if (!itemsEl) return;

  if (!carrito.length) {
    itemsEl.innerHTML =
      '<div class="carrito-vacio">' +
        '<i class="fas fa-shopping-basket"></i>' +
        '<p>Tu carrito está vacío</p>' +
        '<a href="productos.html" class="btn-ir-catalogo" onclick="cerrarCarrito()">Ver catálogo</a>' +
      '</div>';
  } else {
    itemsEl.innerHTML = carrito.map(function(item) {
      var itemImg = item.imagen || 'https://picsum.photos/seed/' + item.id + '/80/80';
      return '<div class="carrito-item">' +
        '<img src="' + itemImg + '" onerror="this.src=\'https://picsum.photos/seed/' + item.id + '/80/80\'">' +
        '<div class="carrito-item-info">' +
          '<p class="carrito-item-nombre">' + item.nombre + '</p>' +
          '<small class="carrito-item-variante">' + item.variante + (item.presentacion ? ' · ' + item.presentacion : '') + '</small>' +
          '<p class="carrito-item-precio">' + _cop(item.precio * item.cantidad) + '</p>' +
        '</div>' +
        '<div class="carrito-item-controles">' +
          '<button class="btn-cant" onclick="cambiarCantidad(\'' + item.key + '\',-1)" aria-label="Quitar uno">−</button>' +
          '<span>' + item.cantidad + '</span>' +
          '<button class="btn-cant" onclick="cambiarCantidad(\'' + item.key + '\',1)" aria-label="Agregar uno">+</button>' +
          '<button class="btn-eliminar" onclick="eliminarDelCarrito(\'' + item.key + '\')" aria-label="Eliminar">🗑</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  /* Totales */
  var subtotalEl = document.getElementById('carritoSubtotal');
  var envioEl    = document.getElementById('carritoEnvio');
  var totalEl    = document.getElementById('carritoTotal');
  if (subtotalEl) subtotalEl.textContent = _cop(t.subtotal);
  if (envioEl)    envioEl.textContent = t.envio === 0 && t.subtotal ? '🎉 Gratis' : _cop(t.envio);
  if (totalEl)    totalEl.textContent = _cop(t.total);

  /* Barra progreso envío */
  var barraEl = document.getElementById('envioProgresoZone');
  if (barraEl) barraEl.innerHTML = renderBarraEnvio(t.subtotal);

  renderCarritoDropdown();

  /* Sugerencias */
  renderSugerenciasCarrito();
}

/* ─── Dropdown de carrito ─── */
function crearCarritoDropdown() {
  // No mostrar dropdown en afiliaciones.html
  var paginasExcluidas = ['afiliaciones.html'];
var paginaActual = window.location.pathname.split('/').pop();
if (paginasExcluidas.indexOf(paginaActual) !== -1) return;
  
  if (document.getElementById('carritoDropdown')) return;

  var html =
    '<div id="carritoDropdown" class="carrito-dropdown" aria-live="polite">' +
      '<button type="button" id="carritoDropdownToggle" class="carrito-dropdown-toggle" aria-expanded="false">' +
        '<span><i class="fas fa-shopping-cart"></i> Carrito</span>' +
        '<strong class="carrito-dropdown-count">0</strong>' +
        '<i class="fas fa-chevron-up"></i>' +
      '</button>' +
      '<div class="carrito-dropdown-panel" role="region" aria-label="Resumen de carrito">' +
        '<div class="carrito-dropdown-items"></div>' +
        '<div class="carrito-dropdown-footer">' +
          '<div class="carrito-dropdown-total"><span>Total</span><strong>$0</strong></div>' +
          '<div class="carrito-dropdown-actions">' +
            '<button type="button" class="btn-primario btn-dropdown-ver">Ver carrito</button>' +
            '<button type="button" class="btn-vaciar btn-dropdown-vaciar">Vaciar</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.body.insertAdjacentHTML('beforeend', html);

  var toggle = document.getElementById('carritoDropdownToggle');
  var dropdown = document.getElementById('carritoDropdown');

  if (toggle) {
    toggle.addEventListener('click', function(event) {
      event.stopPropagation();
      toggleCarritoDropdown();
    });
  }

  document.addEventListener('click', function(event) {
    if (!dropdown.contains(event.target)) {
      closeCarritoDropdown();
    }
  });

  var btnVer = document.querySelector('.btn-dropdown-ver');
  var btnVaciar = document.querySelector('.btn-dropdown-vaciar');
  if (btnVer) btnVer.addEventListener('click', function() { abrirCarrito(); closeCarritoDropdown(); });
  if (btnVaciar) btnVaciar.addEventListener('click', function() { vaciarCarrito(); closeCarritoDropdown(); });
}

function renderCarritoDropdown() {
  
  var dropdown = document.getElementById('carritoDropdown');
  if (!dropdown) return;

  var countEl = dropdown.querySelector('.carrito-dropdown-count');
  var itemsContainer = dropdown.querySelector('.carrito-dropdown-items');
  var totalEl = dropdown.querySelector('.carrito-dropdown-total strong');

  var totalItems = carrito.reduce(function(acc, i) { return acc + i.cantidad; }, 0);
  var totales = calcularTotales();

  if (countEl) countEl.textContent = totalItems;
  if (totalEl) totalEl.textContent = _cop(totales.total);

  if (!itemsContainer) return;

  if (!carrito.length) {
    itemsContainer.innerHTML = '<div class="carrito-dropdown-empty">No hay productos seleccionados.</div>';
    dropdown.classList.remove('activo');
    return;
  }

  itemsContainer.innerHTML = carrito.map(function(item) {
    var itemImg = item.imagen || 'https://picsum.photos/seed/' + item.id + '/80/80';
    return '<div class="carrito-dropdown-item">' +
      '<img src="' + itemImg + '" onerror="this.src=\'https://picsum.photos/seed/' + item.id + '/80/80\'" alt="' + item.nombre + '">' +
      '<div class="carrito-dropdown-item-info">' +
        '<strong>' + item.nombre + '</strong>' +
        '<span>' + (item.variante ? item.variante : '') + (item.presentacion ? ' · ' + item.presentacion : '') + ' x' + item.cantidad + '</span>' +
      '</div>' +
      '<span class="carrito-dropdown-item-precio">' + _cop(item.precio * item.cantidad) + '</span>' +
    '</div>';
  }).join('');
}




/* ─── Sugerencias en el carrito ─── */
function renderSugerenciasCarrito() {
  var el = document.getElementById('carritoSugerencias');
  if (!el) return;
  var sugs = getSugerencias();
  if (!sugs.length) { el.innerHTML = ''; return; }

  el.innerHTML =
    '<p class="sugerencias-titulo"><i class="fas fa-star"></i> También te puede interesar</p>' +
    '<div class="sugerencias-lista">' +
      sugs.map(function(p) {
        var precio = p.variantes[0].precio;
        return '<div class="sug-item">' +
          '<img src="' + (p.imagen || 'https://picsum.photos/seed/' + p.id + '/60/60') + '" ' +
               'onerror="this.src=\'https://picsum.photos/seed/' + p.id + '/60/60\'">' +
          '<div class="sug-info">' +
            '<span class="sug-nombre">' + p.nombre + '</span>' +
            '<span class="sug-precio">' + _cop(precio) + '</span>' +
          '</div>' +
          '<button class="sug-btn" onclick="agregarAlCarrito(CATALOGO.find(function(x){return x.id===' + p.id + '}),0,this)" ' +
                  'aria-label="Agregar ' + p.nombre + '">+</button>' +
        '</div>';
      }).join('') +
    '</div>';
}

/* ─── Barra mobile fija abajo ─── */
function actualizarBarraMobile(totalItems, t) {
  var barra = document.getElementById('mobileCartBar');
  if (!barra) return;
  if (totalItems === 0) {
    barra.style.display = 'none';
    return;
  }
  barra.style.display = 'flex';
  var numEl   = barra.querySelector('.mcb-num');
  var totalEl = barra.querySelector('.mcb-total');
  if (numEl)   numEl.textContent   = totalItems + (totalItems === 1 ? ' producto' : ' productos');
  if (totalEl) totalEl.textContent = _cop(t.total);
}

/* ─── Modal ─── */
function abrirCarrito() {
  var modal = document.getElementById('carritoModal');
  if (modal) { modal.classList.add('activo'); document.body.style.overflow = 'hidden'; }
}

function cerrarCarrito() {
  var modal = document.getElementById('carritoModal');
  if (modal) { modal.classList.remove('activo'); document.body.style.overflow = ''; }
}

/* ─── Toast ─── */
function mostrarToast(msg) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('activo');
  setTimeout(function() { t.classList.remove('activo'); }, 3000);
}

/* ════════════════════════════════════════
   CHECKOUT — WhatsApp
════════════════════════════════════════ */
function checkoutWhatsApp() {
  var totales = calcularTotales();
  var msg = '🛒 *PEDIDO — Droguerías Económicas*\n\n';
  carrito.forEach(function(i) {
    var desc = i.variante || '';
    if (i.presentacion) desc += (desc ? ' · ' : '') + i.presentacion;
    msg += '• ' + i.nombre + (desc ? ' (' + desc + ')' : '') + ' x' + i.cantidad + ' → ' + _cop(i.precio * i.cantidad) + '\n';
  });
  msg += '\n━━━━━━━━━━━━━━━━\n';
  msg += '💰 Subtotal: ' + _cop(totales.subtotal) + '\n';
  msg += '🚚 Envío: ' + (totales.envio === 0 ? 'Gratis 🎉' : _cop(totales.envio)) + '\n';
  msg += '━━━━━━━━━━━━━━━━\n';
  msg += '💳 *TOTAL: ' + _cop(totales.total) + '*\n\n';
  msg += '¿Confirman disponibilidad? ✅';
  window.open('https://wa.me/573118719476?text=' + encodeURIComponent(msg), '_blank');
}


/* ════════════════════════════════════════
   INYECTOR DEL MODAL — se auto-inserta en
   cualquier página donde no exista el HTML
════════════════════════════════════════ */
function inyectarModalCarrito() {
  if (document.getElementById('carritoModal')) return;

  var html =
    '<div class="modal-overlay" id="carritoModal" role="dialog" aria-modal="true" aria-label="Carrito">' +
      '<div class="carrito-panel">' +
        '<div class="carrito-header">' +
          '<h2><i class="fas fa-shopping-cart"></i> Mi Carrito</h2>' +
          '<button class="btn-cerrar-carrito" id="btnCerrarCarrito" aria-label="Cerrar">&#x2715;</button>' +
        '</div>' +
        '<div class="carrito-items" id="carritoItems">' +
          '<div class="carrito-vacio">' +
            '<i class="fas fa-shopping-basket"></i>' +
            '<p>Tu carrito est\u00e1 vac\u00edo</p>' +
            '<a href="productos.html" class="btn-ir-catalogo">Ver cat\u00e1logo</a>' +
          '</div>' +
        '</div>' +
        '<div id="carritoSugerencias"></div>' +
        '<div id="envioProgresoZone"></div>' +
        '<div class="carrito-footer">' +
          '<div class="domicilio-info">' +
            '<i class="fas fa-motorcycle"></i>' +
            '<div>' +
              '<strong>🚚 Domicilio GRATIS</strong> &middot; Mosquera &amp; Funza<br>' +
              '<span style="font-weight:600;font-size:.73rem">&#x23F1;&#xFE0F; Entrega estimada: 30\u201340 min</span>' +
            '</div>' +
          '</div>' +
          '<div class="carrito-resumen">' +
            '<div class="carrito-resumen-fila"><span>Subtotal</span><span id="carritoSubtotal">$0</span></div>' +
            '<div class="carrito-resumen-fila"><span>Envío</span><span id="carritoEnvio">GRATIS 🎉</span></div>' +
            '<div id="carritoEnvioMsg" style="font-size:.75rem;font-weight:700;color:#2E7D32;margin-top:.2rem">&#x2705; Env\u00edo gratis en compras mayores a $50.000</div>' +
          '</div>' +
          '<div class="carrito-total-fila"><span>Total</span><span id="carritoTotal">$0</span></div>' +
          '<div style="background:#E3F2FD;border:1.5px solid #BBDEFB;border-radius:10px;padding:.7rem .9rem;font-size:.75rem;margin:.2rem 0">' +
            '<div style="font-weight:900;color:#0d47a1;margin-bottom:.35rem">💳 Datos para pago / transferencia:</div>' +
              '<div style="background:#E8F5E9;border-radius:8px;padding:.45rem .7rem;margin-bottom:.3rem;font-size:.74rem;color:#1B5E20;font-weight:700">📲 Nequi · Daviplata: <strong>323 249 7559</strong></div>' +
              '<div style="font-size:.7rem;color:#555;margin-bottom:.25rem">Realiza tu pago al número 3232497559 y envía el comprobante por WhatsApp.</div>' +
            '<div style="display:flex;flex-direction:column;gap:.18rem;color:#1565C0;font-weight:700">' +
              '<span>&#x1F4CC; Bancolombia &middot; Cuenta de Ahorros</span>' +
              '<span>N&deg; cuenta: <strong>123-456789-00</strong></span>' +
              '<span>A nombre de: <strong>Droguer\u00edas Econ\u00f3micas</strong></span>' +
              '<span>NIT / CC: <strong>1.234.567.890</strong></span>' +
            '</div>' +
            '<div style="margin-top:.4rem;font-size:.7rem;color:#1976D2;font-weight:600">&#x1F4F2; Env\u00eda el comprobante por WhatsApp al confirmar.</div>' +
          '</div>' +
          '<div>' +
            '<div class="pagos-carrito-title">&#x1F4B3; Aceptamos:</div>' +
            '<div class="pagos-carrito">' +
              '<span class="pago-mini">&#x1F7E2; Nequi</span>' +
              '<span class="pago-mini">&#x1F535; Daviplata</span>' +
              '<span class="pago-mini">&#x1F3E6; Bancolombia</span>' +
              '<span class="pago-mini">&#x1F4B0; Contraentrega</span>' +
              '<span class="pago-mini">&#x1F4B5; Efectivo</span>' +
            '</div>' +
          '</div>' +
          '<button class="btn-checkout" id="btnCheckout"><i class="fab fa-whatsapp"></i> Pedir por WhatsApp</button>' +
          '<button class="btn-vaciar" id="btnVaciarCarrito"><i class="fas fa-trash"></i> Vaciar carrito</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.body.insertAdjacentHTML('beforeend', html);

  if (!document.getElementById('toast')) {
    var toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', function() {
  inyectarModalCarrito();
  actualizarUI();

  var btnAbrir  = document.getElementById('btnAbrirCarrito');
  var btnAbrirMobile = document.getElementById('btnAbrirCarritoMobile');
  var btnCerrar = document.getElementById('btnCerrarCarrito');
  var btnVaciar = document.getElementById('btnVaciarCarrito');
  var btnCheckout = document.getElementById('btnCheckout');
  var overlay   = document.getElementById('carritoModal');

  if (btnAbrir)   btnAbrir.addEventListener('click', abrirCarrito);
  if (btnAbrirMobile) btnAbrirMobile.addEventListener('click', abrirCarrito);
  if (btnCerrar)  btnCerrar.addEventListener('click', cerrarCarrito);
  if (btnVaciar)  btnVaciar.addEventListener('click', vaciarCarrito);
  if (btnCheckout) btnCheckout.addEventListener('click', checkoutWhatsApp);

  /* Cerrar al click fuera del panel */
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) cerrarCarrito();
    });
  }

  /* Navbar toggle */
  var navToggle = document.getElementById('navToggle');
  var navLinks  = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function() {
      navLinks.classList.toggle('activo');
      navToggle.setAttribute('aria-expanded', navLinks.classList.contains('activo'));
    });
  }

  /* Mensaje dinámico envío gratis — funciona en todas las páginas */
  (function() {
    var subtotalEl = document.getElementById('carritoSubtotal');
    var msgEl      = document.getElementById('carritoEnvioMsg');
    if (!subtotalEl || !msgEl) return;
    function actualizarMsgEnvio() {
      var subtotal = parseInt(subtotalEl.textContent.replace(/[^0-9]/g, ''), 10) || 0;
      var umbral   = 50000;
      if (subtotal === 0) {
        msgEl.textContent = '✅ Envío gratis en compras mayores a $50.000';
        msgEl.style.color = '#2E7D32';
      } else if (subtotal >= umbral) {
        msgEl.textContent = '🎉 ¡Envío gratis aplicado!';
        msgEl.style.color = '#2E7D32';
      } else {
        var falta = (umbral - subtotal).toLocaleString('es-CO');
        msgEl.textContent = '🎁 ¡Solo te faltan $' + falta + ' para envío gratis!';
        msgEl.style.color = '#e65100';
      }
    }
    new MutationObserver(actualizarMsgEnvio).observe(subtotalEl, { childList: true });
    actualizarMsgEnvio();
  })();

  /* Sincronizar badge del bottom nav */
  (function() {
    var mainBadge = document.querySelector('.carrito-badge');
    var bnCount   = document.getElementById('bnCount');
    if (!mainBadge || !bnCount) return;
    function sync() {
      bnCount.textContent = mainBadge.textContent.trim();
      bnCount.classList.toggle('oculto', mainBadge.classList.contains('oculto'));
    }
    new MutationObserver(sync).observe(mainBadge, { childList: true, attributes: true });
  })();
});

/* ─── GLOBALES ─── */
window.agregarAlCarrito  = agregarAlCarrito;
window.eliminarDelCarrito = eliminarDelCarrito;
window.cambiarCantidad   = cambiarCantidad;
window.abrirCarrito      = abrirCarrito;
window.cerrarCarrito     = cerrarCarrito;
window.checkoutWhatsApp  = checkoutWhatsApp;