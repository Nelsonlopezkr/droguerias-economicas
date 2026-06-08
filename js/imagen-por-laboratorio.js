/**
 * ══════════════════════════════════════════════════════════════
 *  imagen-por-laboratorio.js  |  v1.0
 *  Droguerías Económicas — Sistema de imágenes por laboratorio
 * ══════════════════════════════════════════════════════════════
 *
 *  Este archivo NO reemplaza catalogo.js.
 *  Contiene la función centralizada que resuelve qué imagen
 *  mostrar cuando el usuario cambia de laboratorio.
 *
 *  FLUJO COMPLETO al cambiar laboratorio:
 *    1. Imagen   → cambia a la imagen del laboratorio seleccionado
 *    2. Precio   → cambia al primer precio del laboratorio
 *    3. Nombre   → cambia al nombreProducto del laboratorio
 *    4. Stock    → actualiza disponibilidad (si existe campo stock)
 *    5. Presentaciones → reconstruye los botones de precio
 *
 *  CÓMO INTEGRAR EN TU PROYECTO:
 *  ─────────────────────────────
 *  Opción A — Ya está en catalogo.js:
 *    La función _imagenParaLab() ya implementa la lógica Prioridad 0.
 *    Solo necesitas agregar imagen: 'ruta' en cada bloque de laboratorio
 *    en productos-data.js (v7.0). No requieres cambios en catalogo.js.
 *
 *  Opción B — Sistema standalone / reemplazo:
 *    Incluye este archivo DESPUÉS de productos-data.js y catalogo.js:
 *    <script src="productos-data.js"></script>
 *    <script src="catalogo.js"></script>
 *    <script src="imagen-por-laboratorio.js"></script>
 * ══════════════════════════════════════════════════════════════
 */

/* ════════════════════════════════════════════════════════════
   1. FUNCIÓN CENTRAL: Resolver imagen según laboratorio
   ════════════════════════════════════════════════════════════

   PRIORIDAD de búsqueda de imagen:
   0. imagen: 'ruta'  definido directamente en laboratorio{}   ← PRINCIPAL (v7)
   1. Matching fuzzy entre labKey y variantes[].laboratorio
   2. Primera palabra del lab.nombre vs variante.laboratorio
   3. Primera parte del labKey (antes de _) vs variante.laboratorio
   4. Matching de nombreProducto del lab en variante
   5. Fallback: producto.imagen (imagen genérica del producto)
   6. Fallback final: placeholder picsum.photos
   ════════════════════════════════════════════════════════════ */

/**
 * Resuelve la imagen correcta para un producto + laboratorio.
 *
 * @param {Object} producto   - Objeto del CATALOGO (el producto completo)
 * @param {string} labKey     - Clave del laboratorio, ej: 'genfar_s_a', 'laproff'
 * @param {number} [ancho=400]
 * @param {number} [alto=400]
 * @returns {string} URL de la imagen a mostrar
 */
function resolverImagenLaboratorio(producto, labKey, ancho, alto) {
  ancho = ancho || 400;
  alto  = alto  || 400;

  var labObj = producto.laboratorios && producto.laboratorios[labKey];

  /* ── PRIORIDAD 0: imagen definida directamente en el bloque laboratorio ── */
  if (labObj && labObj.imagen && labObj.imagen !== 'INSERTAR_IMAGEN_AQUI') {
    return labObj.imagen;
  }

  /* ── Sin variantes: usar imagen del producto ── */
  if (!producto.variantes || !producto.variantes.length) {
    return producto.imagen ||
      ('https://picsum.photos/seed/' + encodeURIComponent(producto.nombre) + '/' + ancho + '/' + alto);
  }

  /* ── Matching fuzzy por labKey y nombre ── */
  var labKeyPartes     = labKey.toLowerCase().split('_');
  var labNombrePrimera = labObj
    ? labObj.nombre.split(/[\s.,]/)[0].toLowerCase()
    : labKeyPartes[0];

  var encontrada = null;

  /* Paso 1: labKey CONTIENE el nombre de la variante (min 4 chars) */
  encontrada = producto.variantes.find(function(v) {
    var vLab = (v.laboratorio || '').toLowerCase();
    if (!vLab || vLab.length < 4) return false;
    return labKey.toLowerCase().includes(vLab) ||
           labKey.toLowerCase().replace(/_/g, '').includes(vLab.replace(/\s/g, ''));
  });

  /* Paso 2: primera palabra del nombre === variante.laboratorio */
  if (!encontrada) {
    encontrada = producto.variantes.find(function(v) {
      return (v.laboratorio || '').toLowerCase() === labNombrePrimera;
    });
  }

  /* Paso 3: primera parte del labKey === variante.laboratorio */
  if (!encontrada && labKeyPartes[0].length >= 2) {
    encontrada = producto.variantes.find(function(v) {
      return (v.laboratorio || '').toLowerCase() === labKeyPartes[0];
    });
  }

  /* Paso 4: nombreProducto del lab contiene el nombre de la variante */
  if (!encontrada && labObj && labObj.nombreProducto) {
    var npLower        = labObj.nombreProducto.toLowerCase();
    var labKeyPrimera  = labKeyPartes[0];
    var labNombreEnNP  = labObj.nombre.split(/[\s.,]/)[0].toLowerCase();
    var npContieneElLab = npLower.includes(labKeyPrimera) || npLower.includes(labNombreEnNP);
    if (npContieneElLab) {
      encontrada = producto.variantes.find(function(v) {
        var vLab = (v.laboratorio || '').toLowerCase();
        return vLab && vLab.length >= 3 && vLab === labKeyPrimera && v.imagen;
      });
    }
  }

  /* Paso 5: imagen de la variante encontrada */
  if (encontrada && encontrada.imagen) return encontrada.imagen;

  /* Paso 6: fallback → imagen genérica del producto → picsum */
  return producto.imagen ||
    ('https://picsum.photos/seed/' + encodeURIComponent(producto.nombre) + '/' + ancho + '/' + alto);
}


/* ════════════════════════════════════════════════════════════
   2. FUNCIÓN PRINCIPAL: Cambio completo al seleccionar laboratorio
   ════════════════════════════════════════════════════════════

   Actualiza TODO en la tarjeta y el modal cuando el usuario
   selecciona un laboratorio diferente:
     • Imagen de la tarjeta
     • Imagen del modal (si está abierto)
     • Nombre del producto (nombreProducto del lab)
     • Precio activo (primer precio del lab)
     • Botones de presentación/precio
     • Stock (si el lab tiene campo stock)

   CÓMO USAR:
     En tu HTML, en el botón de laboratorio:
       onclick="cambiarLaboratorio(1, 'genfar_s_a')"

     O para llamarlo desde JavaScript:
       cambiarLaboratorio(productoId, 'laproff');
   ════════════════════════════════════════════════════════════ */

/**
 * Formatea precio en pesos colombianos.
 * @param {number} n
 * @returns {string}  ej: "$12.500"
 */
function _copFormat(n) {
  return '$' + n.toLocaleString('es-CO');
}

/**
 * Cambia laboratorio activo y actualiza TODA la UI del producto.
 *
 * @param {number} productoId   - ID del producto (ej: 1, 2, 45)
 * @param {string} labKey       - Clave del laboratorio (ej: 'genfar_s_a')
 */
function cambiarLaboratorio(productoId, labKey) {

  /* ── Obtener producto del catálogo ── */
  if (typeof CATALOGO === 'undefined') {
    console.error('[imagen-por-laboratorio] CATALOGO no está definido.');
    return;
  }
  var p = CATALOGO.find(function(x) { return x.id === productoId; });
  if (!p || !p.laboratorios || !p.laboratorios[labKey]) {
    console.warn('[imagen-por-laboratorio] Producto o laboratorio no encontrado:', productoId, labKey);
    return;
  }

  var lab        = p.laboratorios[labKey];
  var precEntries = Object.entries(lab.precios);
  var precKeyActivo = precEntries[0][0];   // primer precio del laboratorio
  var precioActivo  = precEntries[0][1].precio;

  /* ══════════════════════════
     A) ACTUALIZAR TARJETA
  ══════════════════════════ */
  var card = document.querySelector('[data-id="' + productoId + '"]');
  if (card) {

    /* A1. Imagen de la tarjeta */
    var imgCard = card.querySelector('.prod-img-wrap img, .product-image, img.prod-img');
    if (imgCard) {
      var nuevaImagen = resolverImagenLaboratorio(p, labKey);
      if (nuevaImagen) {
        imgCard.src = nuevaImagen;
        imgCard.onerror = function() {
          this.onerror = null;
          this.src = 'https://picsum.photos/seed/' + encodeURIComponent(p.nombre) + '/400/400';
        };
      }
    }

    /* A2. Nombre del producto (nombreProducto del lab) */
    var nombreEl = card.querySelector(
      '#lab-nombre-' + productoId +
      ', .lab-nombre-' + productoId +
      ', [data-lab-nombre="' + productoId + '"]'
    );
    if (nombreEl) {
      nombreEl.textContent = lab.nombreProducto;
      nombreEl.title       = lab.nombreProducto;
    }

    /* A3. Precio principal */
    var precioEl = card.querySelector(
      '#precio-' + productoId +
      ', .precio-' + productoId +
      ', [data-precio-id="' + productoId + '"]'
    );
    if (precioEl) precioEl.textContent = _copFormat(precioActivo);

    /* A4. Precio en selector de presentación */
    var presPrecioEl = card.querySelector(
      '#precio-pres-' + productoId +
      ', .precio-pres-' + productoId
    );
    if (presPrecioEl) presPrecioEl.textContent = _copFormat(precioActivo);

    /* A5. Stock (si el lab tiene campo stock) */
    var stockEl = card.querySelector(
      '#stock-' + productoId +
      ', .stock-' + productoId +
      ', [data-stock-id="' + productoId + '"]'
    );
    if (stockEl && lab.stock !== undefined) {
      stockEl.textContent = lab.stock > 0
        ? 'Disponible (' + lab.stock + ')'
        : 'Sin stock';
      stockEl.classList.toggle('sin-stock', lab.stock === 0);
    }

    /* A6. Resaltar botón de laboratorio activo */
    card.querySelectorAll('.btn-lab-card, .lab-btn, [data-lab-key]').forEach(function(btn) {
      var bKey = btn.getAttribute('data-lab-key') ||
                 (btn.getAttribute('onclick') || '').match(/'([^']+)'[^']*$/)?.[1];
      if (bKey) btn.classList.toggle('activo', bKey === labKey);
    });

    /* A7. Reconstruir botones de precio/presentación */
    var precBtnsEl = card.querySelector(
      '#pres-btns-' + productoId +
      ', .pres-btns-' + productoId
    );
    if (precBtnsEl) {
      precBtnsEl.innerHTML = precEntries.map(function(entry) {
        var pk = entry[0];
        var pv = entry[1];
        var isAct = pk === precKeyActivo;
        return '<button class="btn-pres-precio' + (isAct ? ' activo' : '') + '"' +
          ' data-preckey="' + pk + '"' +
          ' onclick="event.stopPropagation(); cambiarPrecioLab(' + productoId + ',\'' + labKey + '\',\'' + pk + '\')">' +
          '<span class="bpp-tipo">' + pv.label + '</span>' +
          '<span class="bpp-precio">' + _copFormat(pv.precio) + '</span>' +
          '</button>';
      }).join('');
    }
  }

  /* ══════════════════════════
     B) ACTUALIZAR MODAL (si está abierto para este producto)
  ══════════════════════════ */
  var modal = document.getElementById('modalProducto') ||
              document.querySelector('.modal-producto, .product-modal');
  var modalId = modal && (
    parseInt(modal.getAttribute('data-producto-id') || modal.getAttribute('data-id') || '-1')
  );

  if (modal && modalId === productoId && modal.style.display !== 'none' && !modal.classList.contains('oculto')) {

    /* B1. Imagen del modal — con transición de opacidad */
    var imgModal = document.getElementById('modalProdImg') ||
                   modal.querySelector('.modal-product-img, .modal-imagen img, img.modal-img');
    if (imgModal) {
      var imgModalNueva = resolverImagenLaboratorio(p, labKey, 600, 600);
      imgModal.style.opacity = '0';
      setTimeout(function() {
        imgModal.src = imgModalNueva;
        imgModal.onerror = function() {
          this.onerror = null;
          this.src = 'https://picsum.photos/seed/' + encodeURIComponent(p.nombre) + '/600/600';
        };
        imgModal.style.opacity = '1';
      }, 150);
    }

    /* B2. Precio del modal */
    var precioModalEl = document.getElementById('modalPrecioVal') ||
                        modal.querySelector('.modal-precio-val, .modal-precio-numero');
    if (precioModalEl) precioModalEl.textContent = _copFormat(precioActivo);

    /* B3. Label de precio del modal */
    var labelModalEl = document.getElementById('modalPrecioLabel') ||
                       modal.querySelector('.modal-precio-label');
    if (labelModalEl) {
      labelModalEl.textContent = '/ ' + lab.precios[precKeyActivo].label + ' — ' + lab.nombre.split(' ')[0];
    }

    /* B4. Stock en modal */
    var stockModalEl = document.getElementById('modalStock') ||
                       modal.querySelector('.modal-stock');
    if (stockModalEl && lab.stock !== undefined) {
      stockModalEl.textContent = lab.stock > 0
        ? 'Disponible (' + lab.stock + ' unidades)'
        : 'Sin stock';
    }

    /* B5. Nombre del producto en modal */
    var nombreModalEl = document.getElementById('modalNombreProducto') ||
                        modal.querySelector('.modal-nombre-lab, .modal-product-lab-name');
    if (nombreModalEl) {
      nombreModalEl.textContent = lab.nombreProducto;
    }

    /* B6. Resaltar botón de lab activo en modal */
    modal.querySelectorAll('.btn-lab-modal, .modal-lab-btn, [data-lab-key-modal]').forEach(function(btn) {
      var bKey = btn.getAttribute('data-lab-key-modal') ||
                 btn.getAttribute('data-lab-key') ||
                 (btn.getAttribute('onclick') || '').match(/'([^']+)'[^']*$/)?.[1];
      if (bKey) btn.classList.toggle('activo', bKey === labKey);
    });

    /* B7. Reconstruir botones de precio en modal */
    var precGridModal = document.getElementById('modalPrecGrid') ||
                        modal.querySelector('.modal-prec-grid, .modal-pres-btns');
    if (precGridModal) {
      precGridModal.innerHTML = precEntries.map(function(entry) {
        var pk = entry[0];
        var pv = entry[1];
        var isAct = pk === precKeyActivo;
        return '<button class="modal-pres-pill' + (isAct ? ' activo' : '') + '"' +
          ' data-preckey="' + pk + '"' +
          ' onclick="cambiarPrecioLabModal(' + productoId + ',\'' + labKey + '\',\'' + pk + '\')">' +
          '<span class="mpp-tipo">' + pv.label + '</span>' +
          '<span class="mpp-precio">' + _copFormat(pv.precio) + '</span>' +
          '</button>';
      }).join('');
    }
  }

  /* ── Persistir selección en sessionStorage ── */
  try {
    var _labs = JSON.parse(sessionStorage.getItem('_labs') || '{}');
    _labs[productoId] = labKey;
    sessionStorage.setItem('_labs', JSON.stringify(_labs));
  } catch (e) { /* incógnito o sin acceso */ }
}


/* ════════════════════════════════════════════════════════════
   3. FUNCIÓN: Cambiar precio/presentación dentro del lab activo
   ════════════════════════════════════════════════════════════ */

/**
 * Cambia la presentación activa (precio) dentro del laboratorio seleccionado.
 *
 * @param {number} productoId
 * @param {string} labKey
 * @param {string} precKey     - Clave de precio, ej: 'caja', 'blister', 'unidad'
 */
function cambiarPrecioLab(productoId, labKey, precKey) {
  if (typeof CATALOGO === 'undefined') return;
  var p = CATALOGO.find(function(x) { return x.id === productoId; });
  if (!p || !p.laboratorios || !p.laboratorios[labKey]) return;

  var lab    = p.laboratorios[labKey];
  var precObj = lab.precios[precKey];
  if (!precObj) return;

  var precio = precObj.precio;

  /* Actualizar botones de precio en tarjeta */
  var card = document.querySelector('[data-id="' + productoId + '"]');
  if (card) {
    card.querySelectorAll('.btn-pres-precio').forEach(function(btn) {
      btn.classList.toggle('activo', btn.getAttribute('data-preckey') === precKey);
    });
    var precioEl = card.querySelector('#precio-' + productoId + ', [data-precio-id="' + productoId + '"]');
    if (precioEl) precioEl.textContent = _copFormat(precio);
    var presPrecioEl = card.querySelector('#precio-pres-' + productoId);
    if (presPrecioEl) presPrecioEl.textContent = _copFormat(precio);
  }

  /* Persistir */
  try {
    var _pres = JSON.parse(sessionStorage.getItem('_pres') || '{}');
    _pres[productoId + '_' + labKey] = precKey;
    sessionStorage.setItem('_pres', JSON.stringify(_pres));
  } catch (e) {}
}

/**
 * Cambia precio desde el modal.
 */
function cambiarPrecioLabModal(productoId, labKey, precKey) {
  cambiarPrecioLab(productoId, labKey, precKey);

  /* Actualizar también en el modal */
  var modal = document.getElementById('modalProducto') ||
              document.querySelector('.modal-producto');
  if (!modal) return;

  if (typeof CATALOGO === 'undefined') return;
  var p = CATALOGO.find(function(x) { return x.id === productoId; });
  if (!p || !p.laboratorios || !p.laboratorios[labKey]) return;

  var lab    = p.laboratorios[labKey];
  var precObj = lab.precios[precKey];
  if (!precObj) return;

  modal.querySelectorAll('.modal-pres-pill').forEach(function(btn) {
    btn.classList.toggle('activo', btn.getAttribute('data-preckey') === precKey);
  });

  var precioEl = document.getElementById('modalPrecioVal') ||
                 modal.querySelector('.modal-precio-val');
  if (precioEl) precioEl.textContent = _copFormat(precObj.precio);

  var labelEl = document.getElementById('modalPrecioLabel') ||
                modal.querySelector('.modal-precio-label');
  if (labelEl) labelEl.textContent = '/ ' + precObj.label + ' — ' + lab.nombre.split(' ')[0];

  /* Sincronizar con tarjeta */
  var gridPrecio = document.getElementById('precio-' + productoId);
  if (gridPrecio) gridPrecio.textContent = _copFormat(precObj.precio);
}


/* ════════════════════════════════════════════════════════════
   4. UTILIDAD: Obtener imagen de un laboratorio directamente
   ════════════════════════════════════════════════════════════ */

/**
 * Retorna solo la URL de la imagen para un producto + laboratorio.
 * Útil para precargar imágenes o mostrar previews.
 *
 * @param {number} productoId
 * @param {string} labKey
 * @returns {string} URL de la imagen
 */
function getImagenLab(productoId, labKey) {
  if (typeof CATALOGO === 'undefined') return '';
  var p = CATALOGO.find(function(x) { return x.id === productoId; });
  if (!p) return '';
  return resolverImagenLaboratorio(p, labKey);
}


/* ════════════════════════════════════════════════════════════
   5. EXPOSICIÓN GLOBAL
   ════════════════════════════════════════════════════════════ */
if (typeof window !== 'undefined') {
  window.resolverImagenLaboratorio = resolverImagenLaboratorio;
  window.cambiarLaboratorio        = cambiarLaboratorio;
  window.cambiarPrecioLab          = cambiarPrecioLab;
  window.cambiarPrecioLabModal     = cambiarPrecioLabModal;
  window.getImagenLab              = getImagenLab;
}

/*
 * ══════════════════════════════════════════════════════════════
 *  GUÍA DE USO RÁPIDO
 * ══════════════════════════════════════════════════════════════
 *
 *  1. AGREGAR IMAGEN A UN LABORATORIO (en productos-data.js):
 *     ─────────────────────────────────────────────────────────
 *     Busca:  INSERTAR_IMAGEN_AQUI
 *     Ctrl+H → Reemplazar uno a uno con la ruta correcta.
 *
 *     Ejemplo ANTES:
 *       genfar_s_a: {
 *         nombre: 'GENFAR S.A.',
 *         nombreProducto: 'ACETAMINOFEN 500MG X 48 TAB',
 *         imagen: 'INSERTAR_IMAGEN_AQUI', // TODO: reemplazar
 *         precios: { caja: { label: 'Caja', precio: 33000 } }
 *       }
 *
 *     Ejemplo DESPUÉS:
 *       genfar_s_a: {
 *         nombre: 'GENFAR S.A.',
 *         nombreProducto: 'ACETAMINOFEN 500MG X 48 TAB',
 *         imagen: 'img/productos/Genfar-Acetaminofen-500mg.jpg',
 *         precios: { caja: { label: 'Caja', precio: 33000 } }
 *       }
 *
 *  2. BOTÓN DE LABORATORIO EN HTML:
 *     ─────────────────────────────────────────────────────────
 *     <button
 *       class="btn-lab"
 *       data-lab-key="genfar_s_a"
 *       onclick="cambiarLaboratorio(1, 'genfar_s_a')">
 *       Genfar
 *     </button>
 *
 *  3. VERIFICAR IMÁGENES PENDIENTES:
 *     ─────────────────────────────────────────────────────────
 *     En la consola del navegador:
 *       CATALOGO.flatMap(p =>
 *         Object.entries(p.laboratorios || {})
 *           .filter(([k,v]) => v.imagen === 'INSERTAR_IMAGEN_AQUI')
 *           .map(([k,v]) => ({producto: p.nombre, lab: v.nombre}))
 *       )
 *
 *  4. STOCK POR LABORATORIO:
 *     ─────────────────────────────────────────────────────────
 *     Si quieres stock por laboratorio, agrega el campo en el bloque:
 *       genfar_s_a: {
 *         nombre: 'GENFAR S.A.',
 *         nombreProducto: '...',
 *         imagen: 'img/...',
 *         stock: 50,           ← NUEVO: stock de este lab específico
 *         precios: { ... }
 *       }
 * ══════════════════════════════════════════════════════════════
 */
