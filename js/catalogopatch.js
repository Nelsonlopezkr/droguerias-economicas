/* ══════════════════════════════════════════════════════════
 *  PATCH DE LABORATORIOS v1.0 — Droguerías Económicas
 *  Extiende catalogo.js para soportar la nueva estructura:
 *    producto.laboratorios = {
 *      key: { nombre, precios: { caja: {label, precio}, ... } }
 *    }
 *  Compatible 100% con la estructura variantes[] existente.
 * ══════════════════════════════════════════════════════════ */

'use strict';

/* ── Estado de laboratorios seleccionados por producto ── */
var laboratoriosActivos = {};
try {
  laboratoriosActivos = JSON.parse(localStorage.getItem('de_laboratorios') || '{}');
} catch(e) { laboratoriosActivos = {}; }

function _guardarLaboratorios() {
  try { localStorage.setItem('de_laboratorios', JSON.stringify(laboratoriosActivos)); } catch(e) {}
}

/* ── ¿El producto usa la nueva estructura laboratorios? ── */
function tieneNuevosLabs(p) {
  return p.laboratorios && typeof p.laboratorios === 'object' && Object.keys(p.laboratorios).length > 0;
}

/* ── Obtener laboratorio activo de un producto ── */
function getLabActivo(p) {
  if (!tieneNuevosLabs(p)) return null;
  var key = laboratoriosActivos[p.id];
  if (key && p.laboratorios[key]) return { key: key, data: p.laboratorios[key] };
  var primero = Object.keys(p.laboratorios)[0];
  return { key: primero, data: p.laboratorios[primero] };
}

/* ── Obtener presentación activa de laboratorio activo ── */
function getPresLabActiva(p) {
  var lab = getLabActivo(p);
  if (!lab || !lab.data.precios) return null;
  var presKeys = Object.keys(lab.data.precios);
  if (!presKeys.length) return null;
  var presKey = (window._presLabActivas && window._presLabActivas[p.id + '_' + lab.key]) || presKeys[0];
  return { key: presKey, data: lab.data.precios[presKey] };
}

/* ── Precio para tarjeta con nueva estructura ── */
window._presLabActivas = window._presLabActivas || {};

function _precioCardLab(p) {
  var pres = getPresLabActiva(p);
  return pres ? pres.data.precio : 0;
}

/* ── Seleccionar laboratorio en tarjeta ── */
window.selLaboratorio = function(prodId, labKey) {
  laboratoriosActivos[prodId] = labKey;
  _guardarLaboratorios();
  if (typeof CATALOGO === 'undefined') return;
  var p = CATALOGO.find(function(x) { return x.id === prodId; });
  if (!p || !tieneNuevosLabs(p)) return;

  var lab = p.laboratorios[labKey];
  if (!lab) return;

  /* Resetear presentación al cambiar de lab */
  var presKeys = Object.keys(lab.precios || {});
  if (presKeys.length) {
    window._presLabActivas[prodId + '_' + labKey] = presKeys[0];
  }

  /* Actualizar precio en la card */
  var el = document.getElementById('precio-' + prodId);
  if (el) {
    var pres = getPresLabActiva(p);
    el.textContent = cop(pres ? pres.data.precio : 0);
  }

  /* Actualizar botones de laboratorio */
  var grid = document.getElementById('productosGrid');
  var card = grid ? grid.querySelector('[data-id="' + prodId + '"]') : null;
  if (card) {
    card.querySelectorAll('.btn-lab-nuevo').forEach(function(b) {
      b.classList.toggle('activo', b.getAttribute('data-lab') === labKey);
    });
    /* Re-render presentaciones */
    var presContainer = card.querySelector('.pres-lab-container');
    if (presContainer) {
      presContainer.innerHTML = _renderPresLab(p, labKey);
    }
  }
};

/* ── Seleccionar presentación de laboratorio en tarjeta ── */
window.selPresLab = function(prodId, labKey, presKey) {
  window._presLabActivas[prodId + '_' + labKey] = presKey;
  if (typeof CATALOGO === 'undefined') return;
  var p = CATALOGO.find(function(x) { return x.id === prodId; });
  if (!p || !tieneNuevosLabs(p)) return;

  var lab = p.laboratorios[labKey];
  if (!lab || !lab.precios || !lab.precios[presKey]) return;
  var precio = lab.precios[presKey].precio;

  /* Actualizar precio footer */
  var el = document.getElementById('precio-' + prodId);
  if (el) el.textContent = cop(precio);

  /* Botones activos */
  var grid = document.getElementById('productosGrid');
  var card = grid ? grid.querySelector('[data-id="' + prodId + '"]') : null;
  if (card) {
    card.querySelectorAll('.btn-pres-lab').forEach(function(b) {
      b.classList.toggle('activo', b.getAttribute('data-pres') === presKey);
    });
    card.setAttribute('data-precio-lab', precio);
  }
};

/* ── Render botones de laboratorio para una card ── */
function _renderLabsBtns(p) {
  if (!tieneNuevosLabs(p)) return '';
  var labActivo = getLabActivo(p);
  var labKeys = Object.keys(p.laboratorios);
  if (labKeys.length === 0) return '';

  var html = '<div class="labs-selector" onclick="event.stopPropagation()">' +
    '<span class="labs-label"><i class="fas fa-flask"></i> LABORATORIO:</span>' +
    '<div class="labs-btns">';
  labKeys.forEach(function(lk) {
    var lab = p.laboratorios[lk];
    var esActivo = labActivo && labActivo.key === lk;
    var nombre = lab.nombre || lk;
    /* Truncar nombre largo */
    var labCorto = nombre.length > 18 ? nombre.substring(0, 16) + '…' : nombre;
    html += '<button class="btn-lab-nuevo' + (esActivo ? ' activo' : '') + '"' +
      ' data-lab="' + lk + '"' +
      ' onclick="event.stopPropagation();selLaboratorio(' + p.id + ',\'' + lk + '\')"' +
      ' title="' + nombre + '">' +
      labCorto +
      '</button>';
  });
  html += '</div></div>';
  return html;
}

/* ── Render botones de presentación para un lab específico ── */
function _renderPresLab(p, labKey) {
  var lab = p.laboratorios[labKey];
  if (!lab || !lab.precios) return '';
  var presKeys = Object.keys(lab.precios);
  if (!presKeys.length) return '';

  var presActiva = window._presLabActivas[p.id + '_' + labKey] || presKeys[0];
  var html = '<div class="pres-btns">';
  presKeys.forEach(function(pk) {
    var pres = lab.precios[pk];
    var esActivo = pk === presActiva;
    html += '<button class="btn-pres-precio btn-pres-lab' + (esActivo ? ' activo' : '') + '"' +
      ' data-pres="' + pk + '"' +
      ' onclick="event.stopPropagation();selPresLab(' + p.id + ',\'' + labKey + '\',\'' + pk + '\')">' +
      '<span class="bpp-tipo">' + (pres.label || pk) + '</span>' +
      '<span class="bpp-precio">' + cop(pres.precio) + '</span>' +
      '</button>';
  });
  html += '</div>';
  return html;
}

/* ── Render sección completa de labs+presentaciones en card ── */
function _renderSeccionLabCard(p) {
  if (!tieneNuevosLabs(p)) return '';
  var labActivo = getLabActivo(p);
  if (!labActivo) return '';

  var labsBtns = _renderLabsBtns(p);
  var presContent = _renderPresLab(p, labActivo.key);

  return labsBtns +
    '<div class="pres-selector" onclick="event.stopPropagation()">' +
    '<span class="pres-label"><i class="fas fa-cubes"></i> PRESENTACIÓN:</span>' +
    '<div class="pres-lab-container">' + presContent + '</div>' +
    '</div>';
}

/* ── Inyectar estilos para labs ── */
function inyectarEstilosLabs() {
  if (document.getElementById('labs-nuevo-styles')) return;
  var s = document.createElement('style');
  s.id = 'labs-nuevo-styles';
  s.textContent = [
    '.labs-selector{margin:.3rem 0 .2rem;padding:.35rem .5rem;background:#F3E5F5;border:1.5px solid #E1BEE7;border-radius:10px}',
    '.labs-label{font-size:.62rem;font-weight:800;color:#6A1B9A;text-transform:uppercase;letter-spacing:.05em;display:flex;align-items:center;gap:.3rem;margin-bottom:.3rem}',
    '.labs-btns{display:flex;flex-wrap:wrap;gap:.3rem}',
    '.btn-lab-nuevo{padding:.28rem .55rem;border:1.5px solid #CE93D8;border-radius:7px;background:#fff;cursor:pointer;font-family:inherit;font-size:.64rem;font-weight:700;color:#4A148C;transition:all .15s;white-space:nowrap}',
    '.btn-lab-nuevo:hover{border-color:#6A1B9A;background:#F3E5F5}',
    '.btn-lab-nuevo.activo{border-color:#6A1B9A;background:#6A1B9A;color:#fff}',
  ].join('');
  document.head.appendChild(s);
}

/* ════════════════════════════════════════════════════════
   OVERRIDE de renderTarjeta para soporte de laboratorios
   ════════════════════════════════════════════════════════ */
var _renderTarjetaOrig = typeof renderTarjeta !== 'undefined' ? renderTarjeta : null;

function renderTarjetaConLabs(p) {
  /* Si NO tiene nueva estructura, usar el render original */
  if (!tieneNuevosLabs(p)) {
    return _renderTarjetaOrig ? _renderTarjetaOrig(p) : '';
  }

  var meta = CAT_VISUAL[p.categoria] || { emoji: '📦', accent: '#1565C0', bg: '#f5f5f5', icon: 'fas fa-box' };
  var seed = encodeURIComponent(p.nombre);
  /* Imagen: usar primera variante o imagen del producto */
  var vari = p.variantes && p.variantes[0] ? p.variantes[0] : {};
  var imagenSrc = vari.imagen || p.imagen || ('https://picsum.photos/seed/' + seed + '/400/400');

  /* Tags */
  var tagsHTML = '';
  if (p.tags && p.tags.length) {
    p.tags.slice(0, 2).forEach(function(t) {
      tagsHTML += '<span class="prod-tag" style="background:' + t.color + '">' + t.label + '</span>';
    });
  }

  var labActivo = getLabActivo(p);
  var pres = getPresLabActiva(p);
  var precioMostrar = pres ? pres.data.precio : 0;

  var seccionLabs = _renderSeccionLabCard(p);

  var invimaHTML = p.categoria === 'Medicamentos'
    ? '<span class="prod-invima-badge"><i class="fas fa-shield-alt"></i> INVIMA</span>'
    : '';
  var recetaHTML = p.requiereReceta
    ? '<span class="prod-receta-badge"><i class="fas fa-prescription-bottle-alt"></i> Requiere Receta</span>'
    : '';

  return '<article class="producto-card" data-id="' + p.id + '"' +
    ' role="listitem"' +
    ' onclick="abrirModalProducto(' + p.id + ')"' +
    ' style="cursor:pointer"' +
    ' title="Ver detalle de ' + p.nombre + '">' +

    '<div class="prod-img-wrap">' +
      '<img src="' + imagenSrc + '" alt="' + p.nombre + '" loading="lazy"' +
        ' onerror="this.src=\'https://picsum.photos/seed/' + seed + '/400/400\'">' +
      '<div class="prod-tags">' + tagsHTML + '</div>' +
      '<span class="prod-cat-badge" style="background:' + meta.accent + '22;color:' + meta.accent + '">' +
        meta.emoji + ' ' + p.categoria +
      '</span>' +
    '</div>' +

    '<div class="prod-body">' +
      '<p class="prod-marca">' + p.marca + '</p>' +
      '<h3 class="prod-nombre">' + p.nombre + '</h3>' +
      '<p class="prod-desc">' + p.descripcion + '</p>' +
      seccionLabs +
      invimaHTML +
      recetaHTML +
      '<div class="prod-footer">' +
        '<div class="prod-precio-wrap">' +
          '<span class="prod-precio" id="precio-' + p.id + '">' + cop(precioMostrar) + '</span>' +
          '<span class="prod-desde">/ presentación</span>' +
        '</div>' +
        '<button class="btn-agregar"' +
          ' onclick="event.stopPropagation();agregarDesdeGridLab(' + p.id + ', this)"' +
          ' aria-label="Agregar ' + p.nombre + ' al carrito">' +
          '<i class="fas fa-cart-plus"></i>' +
        '</button>' +
      '</div>' +
    '</div>' +
  '</article>';
}

/* ── Agregar al carrito desde grid (nueva estructura) ── */
window.agregarDesdeGridLab = function(id, btn) {
  if (typeof CATALOGO === 'undefined' || typeof agregarAlCarrito !== 'function') return;
  var p = CATALOGO.find(function(x) { return x.id === id; });
  if (!p || !tieneNuevosLabs(p)) return;

  var labActivo = getLabActivo(p);
  var pres = getPresLabActiva(p);
  if (!pres) return;

  var precio = pres.data.precio;
  var labNombre = labActivo ? labActivo.data.nombre : '';
  var presLabel = pres.data.label || pres.key;

  /* Usar agregarAlCarrito con datos extendidos */
  var key = p.id + '_lab' + (labActivo ? labActivo.key : '') + '_' + pres.key;
  
  if (typeof window._carritoLab === 'undefined') {
    window._carritoLab = {};
  }
  
  /* Trigger agregarAlCarrito con item personalizado */
  var productoProxy = JSON.parse(JSON.stringify(p));
  productoProxy.variantes = [{
    tipo: labNombre + ' / ' + presLabel,
    precio: precio,
    imagen: productoProxy.imagen || '',
    laboratorio: labNombre
  }];
  delete productoProxy.laboratorios;
  delete productoProxy.presentaciones;

  agregarAlCarrito(productoProxy, 0, btn, -1);
};

/* ── Override del modal para nueva estructura ── */
var _abrirModalOrig = typeof abrirModalProducto !== 'undefined' ? abrirModalProducto : null;

window.abrirModalProductoConLabs = function(id) {
  if (typeof CATALOGO === 'undefined') return;
  var p = CATALOGO.find(function(x) { return x.id === id; });
  if (!p) return;

  if (!tieneNuevosLabs(p)) {
    if (_abrirModalOrig) _abrirModalOrig(id);
    return;
  }

  /* Usar modal existente pero con HTML de laboratorios */
  var modalProductoId = id;
  var meta = CAT_VISUAL[p.categoria] || { emoji: '📦', accent: '#1565C0' };

  var overlay = document.getElementById('modalProductoOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modalProductoOverlay';
    overlay.className = 'modal-producto-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Detalle del producto');
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) cerrarModalProducto();
    });
  }

  overlay.innerHTML = _construirHTMLModalLab(p, meta);
  overlay.classList.add('activo');
  document.body.style.overflow = 'hidden';
  overlay._escHandler = function(e) { if (e.key === 'Escape') cerrarModalProducto(); };
  document.addEventListener('keydown', overlay._escHandler);
};

function _construirHTMLModalLab(p, meta) {
  var seed = encodeURIComponent(p.nombre);
  var vari = p.variantes && p.variantes[0] ? p.variantes[0] : {};
  var imagenSrc = vari.imagen || p.imagen || ('https://picsum.photos/seed/' + seed + '/600/600');

  var tagsHTML = '';
  if (p.tags && p.tags.length) {
    p.tags.forEach(function(t) {
      tagsHTML += '<span class="prod-tag" style="background:' + t.color + ';border-radius:6px;font-size:.68rem;padding:.18rem .65rem">' + t.label + '</span>';
    });
  }

  var invimaHTML = p.categoria === 'Medicamentos'
    ? '<span class="prod-invima-badge" style="margin:.1rem 0"><i class="fas fa-shield-alt"></i> Reg. INVIMA — Medicamento certificado</span>'
    : '';
  var recetaHTML = p.requiereReceta
    ? '<div class="modal-alerta-receta"><i class="fas fa-exclamation-triangle"></i> <strong>Atención:</strong> Requiere fórmula médica válida.</div>'
    : '';

  /* Laboratorios en modal */
  var labActivo = getLabActivo(p);
  var labKeys = Object.keys(p.laboratorios);

  var labsHTML = '<div class="modal-seccion-titulo"><i class="fas fa-flask"></i> Laboratorio disponible' + (labKeys.length > 1 ? 's' : '') + '</div>' +
    '<div class="modal-labs-grid">';
  labKeys.forEach(function(lk) {
    var lab = p.laboratorios[lk];
    var esActivo = labActivo && labActivo.key === lk;
    /* Precio más bajo del lab */
    var precios = Object.values(lab.precios || {}).map(function(pr) { return pr.precio; });
    var precioMin = precios.length ? Math.min.apply(null, precios) : 0;
    labsHTML += '<button class="modal-lab-card' + (esActivo ? ' activo' : '') + '"' +
      ' data-lk="' + lk + '"' +
      ' onclick="selLabModal(\'' + p.id + '\',\'' + lk + '\')">' +
      '<span class="mlc-lab">' + (lab.nombre || lk) + '</span>' +
      '<span class="mlc-cant">' + (lab.nombreProducto || '') + '</span>' +
      '<span class="mlc-precio">desde ' + cop(precioMin) + '</span>' +
      '</button>';
  });
  labsHTML += '</div>';

  /* Presentaciones del lab activo */
  var presHTML = '';
  if (labActivo) {
    var presKeys = Object.keys(labActivo.data.precios || {});
    var presActivaKey = (window._presLabActivas && window._presLabActivas[p.id + '_' + labActivo.key]) || presKeys[0];
    
    presHTML = '<div class="modal-seccion-titulo"><i class="fas fa-cubes"></i> Modalidad de venta</div>' +
      '<div class="modal-pres-grid" id="modalPresbtns">';
    presKeys.forEach(function(pk) {
      var pres = labActivo.data.precios[pk];
      var esActivo = pk === presActivaKey;
      presHTML += '<button class="modal-pres-pill' + (esActivo ? ' activo' : '') + '"' +
        ' data-pk="' + pk + '"' +
        ' onclick="selPresModal(\'' + p.id + '\',\'' + labActivo.key + '\',\'' + pk + '\')">' +
        '<span class="mpp-tipo">' + (pres.label || pk) + '</span>' +
        '<span class="mpp-precio">' + cop(pres.precio) + '</span>' +
        '</button>';
    });
    presHTML += '</div>';
  }

  var pres = getPresLabActiva(p);
  var precioBase = pres ? pres.data.precio : 0;
  var tipoLabel = pres ? (pres.data.label || pres.key) : '';

  var waMsg = encodeURIComponent(
    'Hola, quiero pedir: *' + p.nombre + '* — ' + tipoLabel + ' (' + cop(precioBase) + ').' +
    (p.requiereReceta ? ' Requiere receta médica.' : '') +
    ' ¿Tienen disponibilidad?'
  );

  return '<div class="modal-producto" role="document">' +
    '<div class="modal-prod-img-side">' +
      '<img id="modalProdImg" src="' + imagenSrc + '" alt="' + p.nombre + '"' +
        ' onerror="this.src=\'https://picsum.photos/seed/' + seed + '/600/600\'">' +
    '</div>' +
    '<div class="modal-prod-info">' +
      '<button class="modal-close" onclick="cerrarModalProducto()" aria-label="Cerrar">' +
        '<i class="fas fa-times"></i>' +
      '</button>' +
      '<div class="modal-header-chips">' +
        '<span class="modal-categoria-chip" style="background:' + meta.accent + '18;color:' + meta.accent + '">' +
          meta.emoji + ' ' + p.categoria +
        '</span>' +
        tagsHTML +
      '</div>' +
      '<p class="modal-prod-marca">' + p.marca + '</p>' +
      '<h2 class="modal-prod-nombre">' + p.nombre + '</h2>' +
      invimaHTML +
      recetaHTML +
      '<p class="modal-prod-desc">' + p.descripcion + '</p>' +
      labsHTML +
      presHTML +
      '<div class="modal-precio-bloque" id="modalPrecioBloque">' +
        '<span class="modal-precio-val" id="modalPrecioVal">' + cop(precioBase) + '</span>' +
        '<span class="modal-precio-pres-label" id="modalPrecioLabel">/ ' + tipoLabel + '</span>' +
      '</div>' +
      '<div class="modal-btns">' +
        '<button class="modal-btn-agregar" id="modalBtnAgregar"' +
          ' onclick="agregarDesdeModalLab(\'' + p.id + '\')">' +
          '<i class="fas fa-cart-plus"></i> Agregar al carrito' +
        '</button>' +
        '<a class="modal-btn-wa"' +
          ' href="https://wa.me/' + (typeof WA_NUM !== 'undefined' ? WA_NUM : '573124213986') + '?text=' + waMsg + '"' +
          ' target="_blank" rel="noopener">' +
          '<i class="fab fa-whatsapp"></i> Pedir' +
        '</a>' +
      '</div>' +
      '<div class="modal-info-extra">' +
        '<div class="modal-info-item"><i class="fas fa-motorcycle"></i><span>Domicilio <strong>$3.000</strong> · Gratis en compras +$50.000</span></div>' +
        '<div class="modal-info-item"><i class="fas fa-shield-alt"></i><span>Productos 100% originales y verificados</span></div>' +
        '<div class="modal-info-item"><i class="fas fa-clock"></i><span>Entrega estimada <strong>30–40 min</strong></span></div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

window._labModalActivo = null;

window.selLabModal = function(prodId, lk) {
  if (typeof CATALOGO === 'undefined') return;
  var p = CATALOGO.find(function(x) { return x.id === prodId; });
  if (!p || !tieneNuevosLabs(p)) return;

  laboratoriosActivos[prodId] = lk;
  _guardarLaboratorios();

  var lab = p.laboratorios[lk];
  if (!lab) return;

  /* Resetear presentación */
  var presKeys = Object.keys(lab.precios || {});
  if (presKeys.length) {
    window._presLabActivas[prodId + '_' + lk] = presKeys[0];
  }

  /* Actualizar botones lab */
  document.querySelectorAll('.modal-labs-grid .modal-lab-card').forEach(function(btn) {
    btn.classList.toggle('activo', btn.getAttribute('data-lk') === lk);
  });

  /* Re-render presentaciones */
  var presGrid = document.getElementById('modalPresbtns');
  if (presGrid) {
    var presKeys2 = Object.keys(lab.precios || {});
    var presActivaKey = presKeys2[0] || '';
    presGrid.innerHTML = presKeys2.map(function(pk) {
      var pres = lab.precios[pk];
      return '<button class="modal-pres-pill' + (pk === presActivaKey ? ' activo' : '') + '"' +
        ' data-pk="' + pk + '"' +
        ' onclick="selPresModal(\'' + prodId + '\',\'' + lk + '\',\'' + pk + '\')">' +
        '<span class="mpp-tipo">' + (pres.label || pk) + '</span>' +
        '<span class="mpp-precio">' + cop(pres.precio) + '</span>' +
        '</button>';
    }).join('');
  }

  /* Actualizar precio */
  var primerPres = lab.precios && Object.values(lab.precios)[0];
  if (primerPres) {
    var precioEl = document.getElementById('modalPrecioVal');
    var labelEl = document.getElementById('modalPrecioLabel');
    if (precioEl) precioEl.textContent = cop(primerPres.precio);
    if (labelEl) labelEl.textContent = '/ ' + (primerPres.label || '');
  }
};

window.selPresModal = function(prodId, lk, pk) {
  if (typeof CATALOGO === 'undefined') return;
  var p = CATALOGO.find(function(x) { return x.id === prodId; });
  if (!p || !tieneNuevosLabs(p)) return;

  window._presLabActivas[prodId + '_' + lk] = pk;

  var lab = p.laboratorios[lk];
  if (!lab || !lab.precios || !lab.precios[pk]) return;
  var pres = lab.precios[pk];

  /* Actualizar precio y label */
  var precioEl = document.getElementById('modalPrecioVal');
  var labelEl = document.getElementById('modalPrecioLabel');
  if (precioEl) precioEl.textContent = cop(pres.precio);
  if (labelEl) labelEl.textContent = '/ ' + (pres.label || pk);

  /* Botones activos */
  document.querySelectorAll('#modalPresbtns .modal-pres-pill').forEach(function(btn) {
    btn.classList.toggle('activo', btn.getAttribute('data-pk') === pk);
  });

  /* Sincronizar en grid */
  var gridPrecio = document.getElementById('precio-' + prodId);
  if (gridPrecio) gridPrecio.textContent = cop(pres.precio);
};

window.agregarDesdeModalLab = function(prodId) {
  if (typeof CATALOGO === 'undefined' || typeof agregarAlCarrito !== 'function') return;
  var p = CATALOGO.find(function(x) { return x.id === prodId; });
  if (!p || !tieneNuevosLabs(p)) return;

  var labActivo = getLabActivo(p);
  var pres = getPresLabActiva(p);
  if (!pres) return;

  var labNombre = labActivo ? labActivo.data.nombre : '';
  var presLabel = pres.data.label || pres.key;

  var productoProxy = JSON.parse(JSON.stringify(p));
  productoProxy.variantes = [{
    tipo: labNombre + ' / ' + presLabel,
    precio: pres.data.precio,
    imagen: productoProxy.imagen || '',
    laboratorio: labNombre
  }];
  delete productoProxy.laboratorios;
  delete productoProxy.presentaciones;

  agregarAlCarrito(productoProxy, 0, null, -1);

  var btn = document.getElementById('modalBtnAgregar');
  if (btn) {
    var orig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> ¡Agregado!';
    btn.style.background = '#2E7D32';
    setTimeout(function() { btn.innerHTML = orig; btn.style.background = ''; }, 1400);
  }
};

/* ════════════════════════════════════════════════════════
   MONKEY-PATCH: Intercept renderTarjeta y abrirModalProducto
   ════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  inyectarEstilosLabs();

  /* Override renderTarjeta */
  if (typeof window.renderTarjeta !== 'undefined') {
    var _origRender = window.renderTarjeta;
    window.renderTarjeta = function(p) {
      if (tieneNuevosLabs(p)) return renderTarjetaConLabs(p);
      return _origRender(p);
    };
  }

  /* Override abrirModalProducto */
  if (typeof window.abrirModalProducto !== 'undefined') {
    var _origModal = window.abrirModalProducto;
    window.abrirModalProducto = function(id) {
      if (typeof CATALOGO === 'undefined') return;
      var p = CATALOGO.find(function(x) { return x.id === id; });
      if (p && tieneNuevosLabs(p)) {
        window.abrirModalProductoConLabs(id);
      } else {
        _origModal(id);
      }
    };
  }
}, false);