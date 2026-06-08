/**
 * ══════════════════════════════════════════════════════════
 *  Droguerías Económicas — cupones-regalo.js v1.0
 *  ✔ Sistema de Cupones con límite de usos
 *  ✔ Tarjetas Regalo (Gift Cards)
 *  ✔ Integración con carrito y checkout
 *  ✔ Persistencia en localStorage
 * ══════════════════════════════════════════════════════════
 */

'use strict';

/* ════════════════════════════════════════
   BASE DE DATOS DE CUPONES
   ════════════════════════════════════════ */
var CUPONES_DB = [
  {
    codigo:     'CUPON10',
    tipo:       'porcentaje',
    valor:      10,
    descripcion: '10% de descuento en tu primera compra',
    fechaExpira: '2026-12-31',
    limiteUsos:  100,
    usosActuales: 35,
    activo:      true,
    condicion:   'Compra mínima $20.000',
    minCompra:   20000,
  },
  {
    codigo:     'SALUD15',
    tipo:       'porcentaje',
    valor:      15,
    descripcion: '15% en vitaminas y suplementos',
    fechaExpira: '2026-12-31',
    limiteUsos:  80,
    usosActuales: 22,
    activo:      true,
    condicion:   'Sin mínimo de compra',
    minCompra:   0,
  },
  {
    codigo:     'BIENVENIDO20',
    tipo:       'porcentaje',
    valor:      20,
    descripcion: '20% al afiliarte al programa',
    fechaExpira: '2026-12-31',
    limiteUsos:  50,
    usosActuales: 48,
    activo:      true,
    condicion:   'Compra mínima $30.000',
    minCompra:   30000,
  },
  {
    codigo:     'PROMO5K',
    tipo:       'fijo',
    valor:      5000,
    descripcion: '$5.000 de descuento directo',
    fechaExpira: '2026-06-30',
    limiteUsos:  200,
    usosActuales: 67,
    activo:      true,
    condicion:   'Compra mínima $40.000',
    minCompra:   40000,
  },
  {
    codigo:     'DOMICILIO',
    tipo:       'envio_gratis',
    valor:      3000,
    descripcion: 'Domicilio gratis en cualquier pedido',
    fechaExpira: '2026-09-30',
    limiteUsos:  150,
    usosActuales: 89,
    activo:      true,
    condicion:   'Sin mínimo de compra',
    minCompra:   0,
  },
];

/* ════════════════════════════════════════
   ESTADO GLOBAL
   ════════════════════════════════════════ */
var CUPON_ACTIVO   = null;
var REGALO_ACTIVO  = null;

/* ════════════════════════════════════════
   HELPERS LOCALSTORAGE
   ════════════════════════════════════════ */
function guardarCuponesDB() {
  try { localStorage.setItem('de_cupones_db', JSON.stringify(CUPONES_DB)); } catch(e) {}
}

function cargarCuponesDB() {
  try {
    var stored = localStorage.getItem('de_cupones_db');
    if (stored) {
      var parsed = JSON.parse(stored);
      parsed.forEach(function(c) {
        var idx = CUPONES_DB.findIndex(function(x) { return x.codigo === c.codigo; });
        if (idx > -1) CUPONES_DB[idx].usosActuales = c.usosActuales;
      });
    }
  } catch(e) {}
}

function guardarTarjetas() {
  try {
    var tarjetas = JSON.parse(localStorage.getItem('de_gift_cards') || '[]');
    return tarjetas;
  } catch(e) { return []; }
}

function saveTarjetas(tarjetas) {
  try { localStorage.setItem('de_gift_cards', JSON.stringify(tarjetas)); } catch(e) {}
}

/* ════════════════════════════════════════
   SISTEMA DE CUPONES
   ════════════════════════════════════════ */
function validarCupon(codigo, subtotal) {
  cargarCuponesDB();
  var c = CUPONES_DB.find(function(x) { return x.codigo === codigo.toUpperCase().trim(); });

  if (!c) return { ok: false, msg: '❌ Cupón no encontrado. Verifica el código e intenta de nuevo.' };
  if (!c.activo) return { ok: false, msg: '❌ Este cupón no está activo.' };

  var hoy = new Date().toISOString().split('T')[0];
  if (c.fechaExpira < hoy) return { ok: false, msg: '❌ Este cupón ha expirado el ' + c.fechaExpira + '.' };

  if (c.usosActuales >= c.limiteUsos) {
    c.activo = false;
    guardarCuponesDB();
    return { ok: false, msg: '❌ Este cupón ha alcanzado el máximo de usos permitidos.' };
  }

  if (subtotal < c.minCompra) {
    return { ok: false, msg: '❌ Compra mínima requerida: ' + formatCOP(c.minCompra) };
  }

  var disponibles = c.limiteUsos - c.usosActuales;
  var descuento = calcularDescuentoCupon(c, subtotal);

  return {
    ok: true,
    cupon: c,
    descuento: descuento,
    disponibles: disponibles,
    msg: '✅ Cupón aplicado: ' + c.descripcion + ' — Ahorras ' + formatCOP(descuento),
  };
}

function calcularDescuentoCupon(cupon, subtotal) {
  if (!cupon) return 0;
  if (cupon.tipo === 'porcentaje') return Math.round(subtotal * cupon.valor / 100);
  if (cupon.tipo === 'fijo') return Math.min(cupon.valor, subtotal);
  if (cupon.tipo === 'envio_gratis') return cupon.valor;
  return 0;
}

function aplicarCupon(codigo, subtotal) {
  var resultado = validarCupon(codigo, subtotal);
  if (!resultado.ok) return resultado;

  CUPON_ACTIVO = resultado.cupon;
  return resultado;
}

function removerCupon() {
  CUPON_ACTIVO = null;
  actualizarResumenCarrito();
}

function incrementarUsoCupon(codigo) {
  var c = CUPONES_DB.find(function(x) { return x.codigo === codigo; });
  if (c) {
    c.usosActuales++;
    if (c.usosActuales >= c.limiteUsos) c.activo = false;
    guardarCuponesDB();
  }
}

function formatCOP(n) {
  return '$' + Number(n).toLocaleString('es-CO');
}

/* ════════════════════════════════════════
   SISTEMA DE TARJETAS REGALO
   ════════════════════════════════════════ */
function generarCodigoGift() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var codigo = 'GIFT-';
  for (var i = 0; i < 6; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}

function crearTarjetaRegalo(monto) {
  var tarjetas = guardarTarjetas();
  var nueva = {
    codigo:       generarCodigoGift(),
    montoInicial: monto,
    saldoActual:  monto,
    fechaCreacion: new Date().toISOString(),
    historial:    [],
    activa:       true,
  };
  tarjetas.push(nueva);
  saveTarjetas(tarjetas);
  return nueva;
}

function validarTarjetaRegalo(codigo) {
  var tarjetas = guardarTarjetas();
  var t = tarjetas.find(function(x) { return x.codigo === codigo.toUpperCase().trim(); });
  if (!t) return { ok: false, msg: '❌ Tarjeta regalo no encontrada.' };
  if (!t.activa) return { ok: false, msg: '❌ Esta tarjeta regalo ya fue utilizada completamente.' };
  if (t.saldoActual <= 0) return { ok: false, msg: '❌ Esta tarjeta regalo no tiene saldo disponible.' };
  return { ok: true, tarjeta: t, saldo: t.saldoActual };
}

function usarSaldoTarjeta(codigo, monto) {
  var tarjetas = guardarTarjetas();
  var idx = tarjetas.findIndex(function(x) { return x.codigo === codigo.toUpperCase().trim(); });
  if (idx === -1) return false;
  var t = tarjetas[idx];
  var montoUsado = Math.min(monto, t.saldoActual);
  t.saldoActual -= montoUsado;
  t.historial.push({ fecha: new Date().toISOString(), montoUsado: montoUsado, saldoRestante: t.saldoActual });
  if (t.saldoActual <= 0) t.activa = false;
  saveTarjetas(tarjetas);
  return montoUsado;
}

function aplicarTarjetaRegalo(codigo) {
  var resultado = validarTarjetaRegalo(codigo);
  if (!resultado.ok) return resultado;
  REGALO_ACTIVO = resultado.tarjeta;
  actualizarResumenCarrito();
  return resultado;
}

function removerTarjetaRegalo() {
  REGALO_ACTIVO = null;
  actualizarResumenCarrito();
}

/* ════════════════════════════════════════
   ACTUALIZAR RESUMEN CARRITO CON DESCUENTOS
   ════════════════════════════════════════ */
function actualizarResumenCarrito() {
  var subtotalEl = document.getElementById('carritoSubtotal');
  var totalEl    = document.getElementById('carritoTotal');
  var envioEl    = document.getElementById('carritoEnvio');
  if (!subtotalEl || !totalEl) return;

  var subtotal = parseInt(subtotalEl.textContent.replace(/[^0-9]/g,''), 10) || 0;
  var envio = parseInt(envioEl ? envioEl.textContent.replace(/[^0-9]/g,'') : '0', 10) || 0;

  var descCupon  = CUPON_ACTIVO  ? calcularDescuentoCupon(CUPON_ACTIVO, subtotal)  : 0;
  var descRegalo = REGALO_ACTIVO ? Math.min(REGALO_ACTIVO.saldoActual, subtotal - descCupon + envio) : 0;

  // Mostrar líneas de descuento
  actualizarLineaDescuento('cupon-desc-linea', CUPON_ACTIVO, descCupon);
  actualizarLineaDescuento('regalo-desc-linea', REGALO_ACTIVO, descRegalo, true);

  var total = Math.max(0, subtotal + envio - descCupon - descRegalo);
  totalEl.textContent = formatCOP(total);
}

function actualizarLineaDescuento(id, obj, monto, esRegalo) {
  var existing = document.getElementById(id);
  var resumen = document.querySelector('.carrito-resumen');
  if (!resumen) return;

  if (!obj || monto === 0) {
    if (existing) existing.remove();
    return;
  }

  if (!existing) {
    existing = document.createElement('div');
    existing.id = id;
    existing.className = 'carrito-resumen-fila desc-aplicado';
    resumen.appendChild(existing);
  }

  var label = esRegalo
    ? '🎁 Tarjeta Regalo (' + (obj.codigo || '') + ')'
    : '🏷️ Cupón ' + obj.codigo;

  existing.innerHTML = '<span>' + label + '</span><span style="color:var(--verde);font-weight:900">-' + formatCOP(monto) + '</span>';
}

/* ════════════════════════════════════════
   UI — SECCIÓN DE CUPONES EN CARRITO
   ════════════════════════════════════════ */
function inyectarCuponUIEnCarrito() {
  var footer = document.querySelector('.carrito-footer');
  if (!footer || document.getElementById('cupon-gift-section')) return;

  var seccion = document.createElement('div');
  seccion.id = 'cupon-gift-section';
  seccion.innerHTML = `
    <div class="cupon-gift-tabs">
      <button class="cg-tab activo" onclick="switchCGTab('cupon')">🏷️ Cupón</button>
      <button class="cg-tab" onclick="switchCGTab('regalo')">🎁 Tarjeta Regalo</button>
    </div>
    <div id="cg-cupon-panel" class="cg-panel">
      <div class="cg-input-row">
        <input id="inputCupon" type="text" placeholder="Código del cupón..." maxlength="20">
        <button onclick="handleAplicarCupon()">Aplicar</button>
      </div>
      <div id="cupon-msg" class="cg-msg"></div>
      <div id="cupon-activo-info" class="cg-activo-info" style="display:none"></div>
    </div>
    <div id="cg-regalo-panel" class="cg-panel" style="display:none">
      <div class="cg-input-row">
        <input id="inputRegalo" type="text" placeholder="Código GIFT-XXXXXX..." maxlength="12">
        <button onclick="handleAplicarRegalo()">Aplicar</button>
      </div>
      <div id="regalo-msg" class="cg-msg"></div>
      <div id="regalo-activo-info" class="cg-activo-info" style="display:none"></div>
      <a href="#" onclick="event.preventDefault();abrirModalComprarRegalo()" class="cg-comprar-link">
        ¿No tienes una? <strong>Comprar Tarjeta Regalo →</strong>
      </a>
    </div>
  `;

  // Insertar antes del resumen
  var resumen = footer.querySelector('.carrito-resumen');
  if (resumen) {
    footer.insertBefore(seccion, resumen);
  } else {
    footer.prepend(seccion);
  }
}

function switchCGTab(tab) {
  document.querySelectorAll('.cg-tab').forEach(function(t) { t.classList.remove('activo'); });
  document.querySelectorAll('.cg-panel').forEach(function(p) { p.style.display = 'none'; });
  document.querySelector('.cg-tab[onclick*="' + tab + '"]').classList.add('activo');
  document.getElementById('cg-' + tab + '-panel').style.display = 'block';
}
window.switchCGTab = switchCGTab;

function handleAplicarCupon() {
  var input    = document.getElementById('inputCupon');
  var msgEl    = document.getElementById('cupon-msg');
  var infoEl   = document.getElementById('cupon-activo-info');
  var subtotalEl = document.getElementById('carritoSubtotal');
  if (!input || !msgEl) return;

  var subtotal = parseInt(subtotalEl ? subtotalEl.textContent.replace(/[^0-9]/g,'') : '0', 10) || 0;
  var resultado = aplicarCupon(input.value, subtotal);

  msgEl.textContent = resultado.msg;
  msgEl.className   = 'cg-msg ' + (resultado.ok ? 'ok' : 'err');

  if (resultado.ok && infoEl) {
    var c = resultado.cupon;
    var pct = Math.round((c.usosActuales / c.limiteUsos) * 100);
    infoEl.style.display = 'block';
    infoEl.innerHTML = `
      <div class="cg-badge-activo">
        <span>🏷️ ${c.codigo}</span>
        <button onclick="handleRemoverCupon()" title="Quitar cupón">✕</button>
      </div>
      <div class="cg-usos-bar">
        <div class="cg-usos-fill" style="width:${pct}%"></div>
      </div>
      <div class="cg-usos-txt">
        Usados: <b>${c.usosActuales}</b> / ${c.limiteUsos} &nbsp;·&nbsp; 
        <span style="color:var(--verde);font-weight:800">Disponibles: ${resultado.disponibles}</span>
      </div>
    `;
    actualizarResumenCarrito();
  }
}
window.handleAplicarCupon = handleAplicarCupon;

function handleRemoverCupon() {
  removerCupon();
  var msgEl  = document.getElementById('cupon-msg');
  var infoEl = document.getElementById('cupon-activo-info');
  var input  = document.getElementById('inputCupon');
  if (msgEl)  { msgEl.textContent = ''; msgEl.className = 'cg-msg'; }
  if (infoEl) { infoEl.style.display = 'none'; infoEl.innerHTML = ''; }
  if (input)  input.value = '';
}
window.handleRemoverCupon = handleRemoverCupon;

function handleAplicarRegalo() {
  var input  = document.getElementById('inputRegalo');
  var msgEl  = document.getElementById('regalo-msg');
  var infoEl = document.getElementById('regalo-activo-info');
  if (!input || !msgEl) return;

  var resultado = aplicarTarjetaRegalo(input.value);
  msgEl.textContent = resultado.ok
    ? '✅ Tarjeta aplicada — Saldo disponible: ' + formatCOP(resultado.saldo)
    : resultado.msg;
  msgEl.className = 'cg-msg ' + (resultado.ok ? 'ok' : 'err');

  if (resultado.ok && infoEl) {
    var t = resultado.tarjeta;
    var pct = Math.round((1 - t.saldoActual / t.montoInicial) * 100);
    infoEl.style.display = 'block';
    infoEl.innerHTML = `
      <div class="cg-badge-activo gift">
        <span>🎁 ${t.codigo}</span>
        <button onclick="handleRemoverRegalo()" title="Quitar tarjeta">✕</button>
      </div>
      <div class="cg-usos-bar">
        <div class="cg-usos-fill gift" style="width:${pct}%"></div>
      </div>
      <div class="cg-usos-txt">
        Saldo inicial: <b>${formatCOP(t.montoInicial)}</b> &nbsp;·&nbsp; 
        <span style="color:var(--verde);font-weight:800">Disponible: ${formatCOP(t.saldoActual)}</span>
      </div>
    `;
  }
}
window.handleAplicarRegalo = handleAplicarRegalo;

function handleRemoverRegalo() {
  removerTarjetaRegalo();
  var msgEl  = document.getElementById('regalo-msg');
  var infoEl = document.getElementById('regalo-activo-info');
  var input  = document.getElementById('inputRegalo');
  if (msgEl)  { msgEl.textContent = ''; msgEl.className = 'cg-msg'; }
  if (infoEl) { infoEl.style.display = 'none'; infoEl.innerHTML = ''; }
  if (input)  input.value = '';
}
window.handleRemoverRegalo = handleRemoverRegalo;

/* ════════════════════════════════════════
   MODAL COMPRAR TARJETA REGALO
   ════════════════════════════════════════ */
function abrirModalComprarRegalo() {
  var existing = document.getElementById('modalGiftCard');
  if (existing) { existing.classList.add('activo'); return; }

  var modal = document.createElement('div');
  modal.id = 'modalGiftCard';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-gift-card">
      <button class="modal-close" onclick="document.getElementById('modalGiftCard').classList.remove('activo')" style="position:absolute;top:1rem;right:1rem;background:none;border:none;font-size:1.4rem;cursor:pointer;color:#666">✕</button>
      <div class="mgc-header">
        <div class="mgc-icon">🎁</div>
        <h2>Tarjetas Regalo</h2>
        <p>El regalo perfecto para la salud y bienestar de quien más quieres</p>
      </div>
      <div class="mgc-montos">
        ${[20000,50000,100000,200000].map(function(m) {
          return `<button class="mgc-monto-btn" onclick="seleccionarMontoGift(${m},this)">
            <span class="mgc-monto-val">${formatCOP(m)}</span>
            <span class="mgc-monto-sub">Tarjeta ${m >= 100000 ? 'Premium' : 'Estándar'}</span>
          </button>`;
        }).join('')}
      </div>
      <div id="mgc-monto-sel" class="mgc-sel-info" style="display:none">
        <div class="mgc-resumen">
          <i class="fas fa-gift"></i>
          <span id="mgc-monto-texto">Selecciona un monto</span>
        </div>
        <button class="mgc-btn-generar" onclick="generarYMostrarGift()">
          <i class="fas fa-magic"></i> Generar Código
        </button>
      </div>
      <div id="mgc-resultado" style="display:none">
        <div class="mgc-codigo-box">
          <div class="mgc-codigo-label">Tu código de regalo:</div>
          <div class="mgc-codigo-val" id="mgcCodigoVal"></div>
          <button onclick="copiarCodigoGift()" class="mgc-copiar-btn">
            <i class="fas fa-copy"></i> Copiar código
          </button>
        </div>
        <div class="mgc-instrucciones">
          <i class="fas fa-info-circle"></i>
          Guarda este código. Puedes usarlo en el carrito seleccionando "Tarjeta Regalo".
        </div>
        <a href="https://wa.me/573124213986?text=Hola%2C+acabo+de+generar+una+tarjeta+regalo.+Quiero+confirmar+el+pago."
           target="_blank" class="mgc-wa-btn">
          <i class="fab fa-whatsapp"></i> Confirmar pago por WhatsApp
        </a>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.classList.remove('activo');
  });
  modal.classList.add('activo');
}
window.abrirModalComprarRegalo = abrirModalComprarRegalo;

var _montoSelGift = 0;
function seleccionarMontoGift(monto, btn) {
  _montoSelGift = monto;
  document.querySelectorAll('.mgc-monto-btn').forEach(function(b) { b.classList.remove('activo'); });
  btn.classList.add('activo');
  var sel = document.getElementById('mgc-monto-sel');
  var txt = document.getElementById('mgc-monto-texto');
  if (sel) sel.style.display = 'block';
  if (txt) txt.textContent = 'Tarjeta de ' + formatCOP(monto) + ' lista para generar';
  document.getElementById('mgc-resultado').style.display = 'none';
}
window.seleccionarMontoGift = seleccionarMontoGift;

function generarYMostrarGift() {
  if (!_montoSelGift) return;
  var tarjeta = crearTarjetaRegalo(_montoSelGift);
  document.getElementById('mgcCodigoVal').textContent = tarjeta.codigo;
  document.getElementById('mgc-resultado').style.display = 'block';
  document.querySelector('.mgc-btn-generar').style.display = 'none';
}
window.generarYMostrarGift = generarYMostrarGift;

function copiarCodigoGift() {
  var codigo = document.getElementById('mgcCodigoVal').textContent;
  navigator.clipboard.writeText(codigo).catch(function() {});
  var btn = document.querySelector('.mgc-copiar-btn');
  if (btn) { btn.innerHTML = '<i class="fas fa-check"></i> ¡Copiado!'; btn.style.background = '#2E7D32'; setTimeout(function() { btn.innerHTML = '<i class="fas fa-copy"></i> Copiar código'; btn.style.background = ''; }, 2000); }
}
window.copiarCodigoGift = copiarCodigoGift;

/* ════════════════════════════════════════
   INTEGRACIÓN CON CHECKOUT
   ════════════════════════════════════════ */
function obtenerDescuentosActivos(subtotal) {
  var descCupon  = CUPON_ACTIVO  ? calcularDescuentoCupon(CUPON_ACTIVO, subtotal) : 0;
  var descRegalo = REGALO_ACTIVO ? Math.min(REGALO_ACTIVO.saldoActual, subtotal)  : 0;
  return { cupon: descCupon, regalo: descRegalo, total: descCupon + descRegalo };
}

function confirmarDescuentosEnCheckout(subtotal) {
  if (CUPON_ACTIVO) incrementarUsoCupon(CUPON_ACTIVO.codigo);
  if (REGALO_ACTIVO) usarSaldoTarjeta(REGALO_ACTIVO.codigo, Math.min(REGALO_ACTIVO.saldoActual, subtotal));
}

window.obtenerDescuentosActivos    = obtenerDescuentosActivos;
window.confirmarDescuentosEnCheckout = confirmarDescuentosEnCheckout;
window.CUPON_ACTIVO  = CUPON_ACTIVO;
window.REGALO_ACTIVO = REGALO_ACTIVO;

/* ════════════════════════════════════════
   INYECTAR ESTILOS
   ════════════════════════════════════════ */
function inyectarEstilosCuponGift() {
  if (document.getElementById('cupon-gift-styles')) return;
  var s = document.createElement('style');
  s.id = 'cupon-gift-styles';
  s.textContent = `
    #cupon-gift-section {
      background: #f8faff;
      border: 1.5px solid #e3f2fd;
      border-radius: 12px;
      padding: .8rem;
      margin-bottom: .7rem;
    }
    .cupon-gift-tabs {
      display: flex;
      gap: .4rem;
      margin-bottom: .7rem;
    }
    .cg-tab {
      flex: 1;
      padding: .4rem;
      border: 1.5px solid #e0e0e0;
      border-radius: 8px;
      background: #fff;
      font-family: inherit;
      font-size: .75rem;
      font-weight: 700;
      cursor: pointer;
      transition: all .18s;
      color: #616161;
    }
    .cg-tab.activo {
      background: #1565C0;
      color: #fff;
      border-color: #1565C0;
    }
    .cg-panel { }
    .cg-input-row {
      display: flex;
      gap: .4rem;
    }
    .cg-input-row input {
      flex: 1;
      padding: .5rem .7rem;
      border: 1.5px solid #e0e0e0;
      border-radius: 8px;
      font-family: inherit;
      font-size: .8rem;
      font-weight: 700;
      text-transform: uppercase;
      outline: none;
      transition: border-color .2s;
    }
    .cg-input-row input:focus { border-color: #1565C0; }
    .cg-input-row button {
      padding: .5rem .9rem;
      background: #1565C0;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-family: inherit;
      font-size: .78rem;
      font-weight: 800;
      cursor: pointer;
      white-space: nowrap;
      transition: background .2s;
    }
    .cg-input-row button:hover { background: #0d47a1; }
    .cg-msg {
      font-size: .72rem;
      font-weight: 700;
      margin-top: .35rem;
      min-height: 1em;
      transition: color .2s;
    }
    .cg-msg.ok  { color: #2E7D32; }
    .cg-msg.err { color: #c62828; }
    .cg-activo-info { margin-top: .5rem; }
    .cg-badge-activo {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #E8F5E9;
      border: 1.5px solid #A5D6A7;
      border-radius: 8px;
      padding: .35rem .65rem;
      font-size: .75rem;
      font-weight: 800;
      color: #1B5E20;
      margin-bottom: .3rem;
    }
    .cg-badge-activo.gift { background: #FFF8E1; border-color: #FFD54F; color: #E65100; }
    .cg-badge-activo button {
      background: none;
      border: none;
      cursor: pointer;
      font-size: .8rem;
      color: inherit;
      opacity: .6;
      padding: 0;
      line-height: 1;
    }
    .cg-usos-bar {
      height: 5px;
      background: #e0e0e0;
      border-radius: 3px;
      overflow: hidden;
      margin: .2rem 0;
    }
    .cg-usos-fill { height: 100%; background: linear-gradient(90deg,#1565C0,#42A5F5); border-radius: 3px; transition: width .5s; }
    .cg-usos-fill.gift { background: linear-gradient(90deg,#E65100,#FFB74D); }
    .cg-usos-txt { font-size: .68rem; color: #616161; font-weight: 600; }
    .cg-comprar-link {
      display: block;
      text-align: center;
      margin-top: .5rem;
      font-size: .72rem;
      color: #1565C0;
      text-decoration: none;
    }
    .cg-comprar-link:hover { text-decoration: underline; }
    .desc-aplicado {
      background: #E8F5E9;
      border-radius: 6px;
      padding: .3rem .6rem;
      margin-top: .2rem;
      font-size: .78rem;
    }

    /* ── MODAL GIFT CARD ── */
    .modal-gift-card {
      background: #fff;
      border-radius: 22px;
      padding: 2rem;
      max-width: 480px;
      width: 92%;
      position: relative;
      max-height: 90vh;
      overflow-y: auto;
    }
    .mgc-header { text-align: center; margin-bottom: 1.4rem; }
    .mgc-icon { font-size: 3rem; margin-bottom: .5rem; animation: giftBounce .8s ease infinite alternate; }
    @keyframes giftBounce { from{transform:translateY(0)} to{transform:translateY(-6px)} }
    .mgc-header h2 { font-size: 1.4rem; font-weight: 900; margin: 0 0 .3rem; }
    .mgc-header p  { font-size: .88rem; color: #666; margin: 0; }
    .mgc-montos {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: .75rem;
      margin-bottom: 1rem;
    }
    .mgc-monto-btn {
      padding: 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 14px;
      background: #fff;
      cursor: pointer;
      font-family: inherit;
      transition: all .2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: .2rem;
    }
    .mgc-monto-btn:hover { border-color: #1565C0; transform: translateY(-2px); }
    .mgc-monto-btn.activo { border-color: #1565C0; background: #E3F2FD; }
    .mgc-monto-val { font-size: 1.2rem; font-weight: 900; color: #1565C0; }
    .mgc-monto-sub { font-size: .68rem; font-weight: 700; color: #888; }
    .mgc-sel-info  { background: #f0f4ff; border-radius: 10px; padding: .7rem 1rem; margin-bottom: .8rem; }
    .mgc-resumen   { display: flex; align-items: center; gap: .5rem; font-size: .88rem; font-weight: 700; color: #1565C0; margin-bottom: .6rem; }
    .mgc-btn-generar {
      width: 100%;
      padding: .85rem;
      background: linear-gradient(135deg,#1565C0,#0d47a1);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-family: inherit;
      font-weight: 800;
      font-size: .95rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: .5rem;
      transition: transform .2s;
    }
    .mgc-btn-generar:hover { transform: translateY(-2px); }
    .mgc-codigo-box {
      background: linear-gradient(135deg,#0d47a1,#1565C0);
      color: #fff;
      border-radius: 14px;
      padding: 1.4rem;
      text-align: center;
      margin-bottom: .8rem;
    }
    .mgc-codigo-label { font-size: .78rem; font-weight: 700; opacity: .8; margin-bottom: .4rem; }
    .mgc-codigo-val { font-size: 1.6rem; font-weight: 900; letter-spacing: .1em; margin-bottom: .8rem; font-family: 'Courier New', monospace; }
    .mgc-copiar-btn {
      display: inline-flex;
      align-items: center;
      gap: .35rem;
      background: rgba(255,255,255,.18);
      border: 1.5px solid rgba(255,255,255,.35);
      color: #fff;
      border-radius: 8px;
      padding: .4rem 1rem;
      font-family: inherit;
      font-weight: 700;
      font-size: .8rem;
      cursor: pointer;
      transition: background .2s;
    }
    .mgc-copiar-btn:hover { background: rgba(255,255,255,.28); }
    .mgc-instrucciones {
      background: #FFF8E1;
      border: 1px solid #FFD54F;
      border-radius: 10px;
      padding: .7rem .9rem;
      font-size: .78rem;
      color: #E65100;
      font-weight: 600;
      margin-bottom: .8rem;
    }
    .mgc-instrucciones i { margin-right: .3rem; }
    .mgc-wa-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: .45rem;
      width: 100%;
      padding: .85rem;
      background: #25D366;
      color: #fff;
      border-radius: 12px;
      font-weight: 800;
      font-size: .95rem;
      text-decoration: none;
      transition: background .2s;
    }
    .mgc-wa-btn:hover { background: #1EB358; }
  `;
  document.head.appendChild(s);
}

/* ════════════════════════════════════════
   INICIALIZACIÓN
   ════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  cargarCuponesDB();
  inyectarEstilosCuponGift();

  // Inyectar en carrito cuando se abra
  var btnAbrir = document.getElementById('btnAbrirCarrito');
  var btnMobile = document.getElementById('btnAbrirCarritoMobile');

  function onAbrirCarrito() {
    setTimeout(function() { inyectarCuponUIEnCarrito(); }, 200);
  }

  if (btnAbrir)  btnAbrir.addEventListener('click', onAbrirCarrito);
  if (btnMobile) btnMobile.addEventListener('click', onAbrirCarrito);

  // Observar cambios en subtotal para actualizar descuentos
  var subtotalEl = document.getElementById('carritoSubtotal');
  if (subtotalEl) {
    new MutationObserver(function() {
      if (CUPON_ACTIVO || REGALO_ACTIVO) actualizarResumenCarrito();
    }).observe(subtotalEl, { childList: true });
  }
});