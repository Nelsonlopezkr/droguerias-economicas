/* ══════════════════════════════════════════════════════════
 *  Droguerías Económicas — checkout.js  v1.0
 *  Sistema de pedidos, pagos y validaciones
 *  DEPENDE DE: carrito.js (cargado antes)
 * ══════════════════════════════════════════════════════════ */

'use strict';

/* ─── Generador de ID único de pedido ─── */
function generarIdPedido() {
  var ts   = Date.now().toString(36).toUpperCase();
  var rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return 'DE-' + ts + '-' + rand;
}

/* ─── Guardar pedido en localStorage ─── */
function guardarPedido(pedido) {
  try {
    var pedidos = JSON.parse(localStorage.getItem('de_pedidos') || '[]');
    pedidos.unshift(pedido); // más reciente primero
    if (pedidos.length > 50) pedidos = pedidos.slice(0, 50);
    localStorage.setItem('de_pedidos', JSON.stringify(pedidos));
  } catch (e) { console.warn('No se pudo guardar pedido:', e); }
}

/* ─── Obtener datos del usuario guardados ─── */
function obtenerDatosUsuario() {
  try {
    return JSON.parse(localStorage.getItem('de_usuario') || '{}');
  } catch (e) { return {}; }
}

/* ─── Guardar datos del usuario ─── */
function guardarDatosUsuario(datos) {
  try {
    localStorage.setItem('de_usuario', JSON.stringify(datos));
  } catch (e) {}
}

/* ══════════════════════════════════════════════════════════
   MODAL DE CHECKOUT — HTML inyectado dinámicamente
   ══════════════════════════════════════════════════════════ */
function inyectarModalCheckout() {
  if (document.getElementById('checkoutModal')) return;

  var html = `
  <div id="checkoutModal" class="co-overlay" role="dialog" aria-modal="true" aria-label="Finalizar compra" style="display:none">
    <div class="co-panel">

      <!-- Cabecera -->
      <div class="co-header">
        <button class="co-btn-back" id="coBtnBack" aria-label="Volver">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h2 class="co-title">Finalizar Compra</h2>
        <button class="co-btn-close" id="coBtnClose" aria-label="Cerrar">✕</button>
      </div>

      <!-- Steps indicador -->
      <div class="co-steps" id="coSteps">
        <div class="co-step activo" data-step="1"><span>1</span> Mis datos</div>
        <div class="co-step-sep"></div>
        <div class="co-step" data-step="2"><span>2</span> Pago</div>
        <div class="co-step-sep"></div>
        <div class="co-step" data-step="3"><span>3</span> Confirmar</div>
      </div>

      <!-- Contenido scrollable -->
      <div class="co-body" id="coBody">

        <!-- ── PASO 1: Datos del cliente ── -->
        <div class="co-paso" id="coPaso1">
          <h3 class="co-section-title">📋 Tus datos de entrega</h3>

          <div class="co-form-grid">
            <div class="co-field">
              <label for="coNombre">Nombre completo <span class="co-req">*</span></label>
              <input type="text" id="coNombre" name="nombre" placeholder="Tu nombre completo"
                     autocomplete="name" class="co-input">
              <span class="co-error" id="errCoNombre"></span>
            </div>

            <div class="co-field">
              <label for="coTelefono">Teléfono / WhatsApp <span class="co-req">*</span></label>
              <input type="tel" id="coTelefono" name="telefono" placeholder="3XX XXX XXXX"
                     autocomplete="tel" class="co-input">
              <span class="co-error" id="errCoTelefono"></span>
            </div>

            <div class="co-field co-field-full">
              <label for="coEmail">Correo electrónico <span class="co-req">*</span></label>
              <input type="email" id="coEmail" name="email" placeholder="tu@correo.com"
                     autocomplete="email" class="co-input">
              <span class="co-error" id="errCoEmail"></span>
            </div>

            <div class="co-field co-field-full">
              <label for="coDireccion">Dirección de entrega <span class="co-req">*</span></label>
              <input type="text" id="coDireccion" name="direccion"
                     placeholder="Calle, Barrio, Municipio" class="co-input">
              <span class="co-error" id="errCoDireccion"></span>
            </div>

            <div class="co-field co-field-full">
              <label for="coNotas">Notas adicionales</label>
              <textarea id="coNotas" name="notas" rows="2" placeholder="Indicaciones de entrega, apartamento, punto de referencia..."
                        class="co-input co-textarea"></textarea>
            </div>
          </div>

          <!-- Política de datos OBLIGATORIA -->
          <label class="co-check-label" id="labelPolitica">
            <input type="checkbox" id="coAceptaPolitica">
            <span class="co-check-box"></span>
            <span>
              Acepto las
              <a href="politica-privacidad.html" target="_blank" class="co-link">Políticas de Tratamiento de Datos</a>
              conforme a la Ley 1581 de 2012. <span class="co-req">*</span>
            </span>
          </label>
          <span class="co-error" id="errCoPolitica"></span>

          <button class="co-btn-primary" id="coBtnPaso1" onclick="coIrPaso2()">
            Continuar al pago →
          </button>
        </div><!-- /coPaso1 -->

        <!-- ── PASO 2: Método de pago ── -->
        <div class="co-paso" id="coPaso2" style="display:none">
          <h3 class="co-section-title">💳 Método de pago</h3>

          <div class="co-pagos-grid">

            <label class="co-pago-card" data-metodo="nequi">
              <input type="radio" name="metodoPago" value="nequi">
              <div class="co-pago-inner">
                <div class="co-pago-icon co-icon-nequi">
                  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                    <rect width="40" height="40" rx="10" fill="#6C3CE1"/>
                    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="12" font-weight="bold" font-family="sans-serif">N</text>
                  </svg>
                </div>
                <div>
                  <div class="co-pago-nombre">Nequi</div>
                  <div class="co-pago-desc">Paga con tu billetera digital</div>
                </div>
                <div class="co-pago-check">✓</div>
              </div>
            </label>

            <label class="co-pago-card" data-metodo="tarjeta">
              <input type="radio" name="metodoPago" value="tarjeta">
              <div class="co-pago-inner">
                <div class="co-pago-icon co-icon-tarjeta">
                  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                    <rect width="40" height="40" rx="10" fill="#1565C0"/>
                    <rect x="6" y="13" width="28" height="4" rx="1" fill="white"/>
                    <rect x="6" y="22" width="10" height="3" rx="1" fill="rgba(255,255,255,0.7)"/>
                    <rect x="20" y="22" width="14" height="3" rx="1" fill="rgba(255,255,255,0.7)"/>
                  </svg>
                </div>
                <div>
                  <div class="co-pago-nombre">Tarjeta Crédito / Débito</div>
                  <div class="co-pago-desc">Visa, Mastercard, Amex</div>
                </div>
                <div class="co-pago-check">✓</div>
              </div>
            </label>

            <label class="co-pago-card" data-metodo="pse">
              <input type="radio" name="metodoPago" value="pse">
              <div class="co-pago-inner">
                <div class="co-pago-icon co-icon-pse">
                  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                    <rect width="40" height="40" rx="10" fill="#009245"/>
                    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="10" font-weight="bold" font-family="sans-serif">PSE</text>
                  </svg>
                </div>
                <div>
                  <div class="co-pago-nombre">PSE</div>
                  <div class="co-pago-desc">Débito bancario en línea</div>
                </div>
                <div class="co-pago-check">✓</div>
              </div>
            </label>

            <label class="co-pago-card" data-metodo="contraentrega">
              <input type="radio" name="metodoPago" value="contraentrega">
              <div class="co-pago-inner">
                <div class="co-pago-icon co-icon-contra">
                  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                    <rect width="40" height="40" rx="10" fill="#E65100"/>
                    <path d="M10 20h10M14 16l6 4-6 4M24 14h6v12h-6z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div class="co-pago-nombre">Contra entrega</div>
                  <div class="co-pago-desc">Paga al recibir tu pedido</div>
                </div>
                <div class="co-pago-check">✓</div>
              </div>
            </label>

          </div><!-- /co-pagos-grid -->
          <span class="co-error" id="errCoMetodo"></span>

          <!-- Sub-panel Nequi -->
          <div class="co-pago-detalle" id="detalleNequi" style="display:none">
            <div class="co-qr-box">
              <div class="co-qr-placeholder">
                <div style="font-size:3rem">📱</div>
                <p><strong>Número Nequi:</strong> 322 439 5198</p>
                <p style="font-size:.8rem;color:#666">Escanea el QR o transfiere al número indicado.<br>Envía el comprobante por WhatsApp.</p>
                <div class="co-qr-img">
                  <!-- QR placeholder visual -->
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="120" height="120" fill="white" rx="8"/>
                    <rect x="8" y="8" width="44" height="44" rx="4" fill="#6C3CE1"/>
                    <rect x="14" y="14" width="32" height="32" rx="2" fill="white"/>
                    <rect x="20" y="20" width="20" height="20" rx="1" fill="#6C3CE1"/>
                    <rect x="68" y="8" width="44" height="44" rx="4" fill="#6C3CE1"/>
                    <rect x="74" y="14" width="32" height="32" rx="2" fill="white"/>
                    <rect x="80" y="20" width="20" height="20" rx="1" fill="#6C3CE1"/>
                    <rect x="8" y="68" width="44" height="44" rx="4" fill="#6C3CE1"/>
                    <rect x="14" y="74" width="32" height="32" rx="2" fill="white"/>
                    <rect x="20" y="80" width="20" height="20" rx="1" fill="#6C3CE1"/>
                    <rect x="68" y="68" width="14" height="14" fill="#6C3CE1"/>
                    <rect x="86" y="68" width="14" height="14" fill="#6C3CE1"/>
                    <rect x="68" y="86" width="14" height="14" fill="#6C3CE1"/>
                    <rect x="98" y="86" width="14" height="26" fill="#6C3CE1"/>
                    <rect x="86" y="98" width="14" height="14" fill="#6C3CE1"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Sub-panel Tarjeta (MercadoPago simulado) -->
          <div class="co-pago-detalle" id="detalleTarjeta" style="display:none">
            <div class="co-mp-banner">
              <span>🔒 Pago seguro vía</span>
              <strong>MercadoPago</strong>
            </div>
            <div class="co-form-grid" style="margin-top:1rem">
              <div class="co-field co-field-full">
                <label>Número de tarjeta</label>
                <input type="text" id="mpNumTarjeta" class="co-input" placeholder="1234 5678 9012 3456"
                       maxlength="19" oninput="formatarTarjeta(this)">
              </div>
              <div class="co-field">
                <label>Vencimiento</label>
                <input type="text" id="mpVencimiento" class="co-input" placeholder="MM/AA" maxlength="5"
                       oninput="formatarVencimiento(this)">
              </div>
              <div class="co-field">
                <label>CVV</label>
                <input type="text" id="mpCvv" class="co-input" placeholder="123" maxlength="4">
              </div>
              <div class="co-field co-field-full">
                <label>Nombre en la tarjeta</label>
                <input type="text" id="mpNombreTarjeta" class="co-input" placeholder="NOMBRE APELLIDO">
              </div>
            </div>
            <p class="co-mp-note">
              🔐 Tus datos son cifrados con SSL. No almacenamos información de tu tarjeta.
            </p>
          </div>

          <!-- Sub-panel PSE -->
          <div class="co-pago-detalle" id="detallePse" style="display:none">
            <div class="co-mp-banner" style="background:linear-gradient(135deg,#00693e,#009245)">
              <span>🏦 Pago seguro vía</span>
              <strong>PSE — ACH Colombia</strong>
            </div>
            <div class="co-form-grid" style="margin-top:1rem">
              <div class="co-field co-field-full">
                <label>Banco</label>
                <select id="pseBanco" class="co-input">
                  <option value="">Selecciona tu banco...</option>
                  <option value="bancolombia">Bancolombia</option>
                  <option value="davivienda">Davivienda</option>
                  <option value="bogota">Banco de Bogotá</option>
                  <option value="occidente">Banco de Occidente</option>
                  <option value="popular">Banco Popular</option>
                  <option value="bbva">BBVA</option>
                  <option value="av_villas">AV Villas</option>
                  <option value="nequi_pse">Nequi</option>
                  <option value="falabella">Banco Falabella</option>
                </select>
              </div>
              <div class="co-field">
                <label>Tipo de cuenta</label>
                <select id="pseTipoCuenta" class="co-input">
                  <option value="ahorros">Ahorros</option>
                  <option value="corriente">Corriente</option>
                </select>
              </div>
              <div class="co-field">
                <label>Tipo de persona</label>
                <select id="pseTipoPersona" class="co-input">
                  <option value="natural">Natural</option>
                  <option value="juridica">Jurídica</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Sub-panel Contra entrega -->
          <div class="co-pago-detalle" id="detalleContra" style="display:none">
            <div class="co-contra-info">
              <div style="font-size:2.5rem;margin-bottom:.5rem">🛵</div>
              <h4>Pagas al recibir tu pedido</h4>
              <p>Nuestro domiciliario llevará tu pedido y recibirás el pago en efectivo o transferencia.</p>
              <div class="co-contra-badge">Sin costo adicional</div>
            </div>
          </div>

          <div class="co-btn-row">
            <button class="co-btn-secondary" onclick="coIrPaso(1)">← Volver</button>
            <button class="co-btn-primary" onclick="coIrPaso3()">Revisar pedido →</button>
          </div>
        </div><!-- /coPaso2 -->

        <!-- ── PASO 3: Resumen y confirmación ── -->
        <div class="co-paso" id="coPaso3" style="display:none">
          <h3 class="co-section-title">🛒 Resumen de tu pedido</h3>

          <div class="co-resumen-box" id="coResumenItems"></div>

          <div class="co-resumen-totales" id="coResumenTotales"></div>

          <div class="co-resumen-datos" id="coResumenDatos"></div>

          <!-- Loader pago -->
          <div class="co-loader" id="coLoader" style="display:none">
            <div class="co-spinner"></div>
            <p>Procesando tu pago...</p>
          </div>

          <div class="co-btn-row" id="coBtnRowConfirmar">
            <button class="co-btn-secondary" onclick="coIrPaso(2)">← Cambiar pago</button>
            <button class="co-btn-primary co-btn-confirmar" id="coBtnConfirmar" onclick="confirmarPedido()">
              <span id="coBtnConfirmarTexto">✅ Confirmar y pagar</span>
            </button>
          </div>
        </div><!-- /coPaso3 -->

      </div><!-- /co-body -->
    </div><!-- /co-panel -->
  </div><!-- /checkoutModal -->

  <!-- ── MODAL ÉXITO ── -->
  <div id="exitoPedidoModal" class="co-exito-overlay" style="display:none" role="dialog" aria-modal="true">
    <div class="co-exito-panel">
      <div class="co-exito-icon">🎉</div>
      <h2>¡Pedido realizado!</h2>
      <p id="exitoIdPedido" class="co-exito-id"></p>
      <p id="exitoMensaje" class="co-exito-msg"></p>
      <div class="co-exito-btns">
        <button class="co-btn-wa" id="exitoBtnWa" onclick="enviarPedidoWhatsApp()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Confirmar por WhatsApp
        </button>
        <button class="co-btn-secondary co-btn-cerrar-exito" onclick="cerrarExito()">
          Seguir comprando
        </button>
      </div>
    </div>
  </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);

  // Eventos radio de pago
  document.querySelectorAll('input[name="metodoPago"]').forEach(function(radio) {
    radio.addEventListener('change', function() {
      var metodo = this.value;
      // Reset
      document.querySelectorAll('.co-pago-detalle').forEach(function(d) { d.style.display = 'none'; });
      document.querySelectorAll('.co-pago-card').forEach(function(c) { c.classList.remove('seleccionado'); });
      // Activar
      this.closest('.co-pago-card').classList.add('seleccionado');
      var detalles = { nequi: 'detalleNequi', tarjeta: 'detalleTarjeta', pse: 'detallePse', contraentrega: 'detalleContra' };
      var el = document.getElementById(detalles[metodo]);
      if (el) el.style.display = 'block';
    });
  });

  // Cerrar modal
  document.getElementById('coBtnClose').addEventListener('click', cerrarCheckout);
  document.getElementById('coBtnBack').addEventListener('click', function() {
    var paso = parseInt(document.querySelector('.co-paso:not([style*="none"])').id.replace('coPaso',''));
    if (paso === 1) cerrarCheckout();
    else coIrPaso(paso - 1);
  });

  // Cerrar al hacer clic fuera
  document.getElementById('checkoutModal').addEventListener('click', function(e) {
    if (e.target === this) cerrarCheckout();
  });

  // Pre-llenar datos guardados
  /* ══════════════════════════════════════════════════════════
 *  checkout.js — CONTINUACIÓN (pegar al final del archivo)
 * ══════════════════════════════════════════════════════════ */

/* ─── Pre-llenar datos guardados ─── */
function prefillDatosUsuario() {
  var datos = obtenerDatosUsuario();
  if (!datos) return;
  var campos = {
    coNombre:   datos.nombre,
    coTelefono: datos.telefono,
    coEmail:    datos.email,
    coDireccion: datos.direccion,
    coNotas:    datos.notas,
  };
  Object.keys(campos).forEach(function(id) {
    var el = document.getElementById(id);
    if (el && campos[id]) el.value = campos[id];
  });
  if (datos.aceptaPolitica) {
    var cb = document.getElementById('coAceptaPolitica');
    if (cb) cb.checked = true;
  }
}

/* ─── Validar paso 1 ─── */
function coValidarPaso1() {
  var errores = false;
  var campos = [
    { id: 'coNombre',    err: 'errCoNombre',   min: 3 },
    { id: 'coTelefono',  err: 'errCoTelefono', min: 7 },
    { id: 'coEmail',     err: 'errCoEmail',    tipo: 'email' },
    { id: 'coDireccion', err: 'errCoDireccion', min: 5 },
  ];
  campos.forEach(function(c) {
    var el  = document.getElementById(c.id);
    var err = document.getElementById(c.err);
    if (!el || !err) return;
    var val = el.value.trim();
    var ok  = true;
    if (c.tipo === 'email') { ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val); }
    else                    { ok = val.length >= (c.min || 1); }
    el.style.borderColor = ok ? '' : '#C62828';
    err.textContent = ok ? '' : (c.tipo === 'email' ? 'Correo inválido' : 'Campo requerido');
    if (!ok) errores = true;
  });
  var cb     = document.getElementById('coAceptaPolitica');
  var errCb  = document.getElementById('errCoPolitica');
  if (cb && !cb.checked) {
    if (errCb) errCb.textContent = 'Debes aceptar las políticas de datos';
    errores = true;
  } else if (errCb) { errCb.textContent = ''; }
  return !errores;
}

/* ─── Navegar entre pasos ─── */
function coIrPaso(num) {
  [1, 2, 3].forEach(function(n) {
    var paso  = document.getElementById('coPaso' + n);
    var step  = document.querySelector('.co-step[data-step="' + n + '"]');
    if (paso) paso.style.display  = n === num ? 'block' : 'none';
    if (step) {
      step.classList.toggle('activo',   n === num);
      step.classList.toggle('completado', n < num);
    }
  });
  var panel = document.querySelector('.co-panel');
  if (panel) panel.scrollTop = 0;
}
window.coIrPaso = coIrPaso;

function coIrPaso2() {
  if (!coValidarPaso1()) return;
  /* Guardar datos del usuario */
  var datos = {
    nombre:    document.getElementById('coNombre')?.value.trim()    || '',
    telefono:  document.getElementById('coTelefono')?.value.trim()  || '',
    email:     document.getElementById('coEmail')?.value.trim()     || '',
    direccion: document.getElementById('coDireccion')?.value.trim() || '',
    notas:     document.getElementById('coNotas')?.value.trim()     || '',
    aceptaPolitica: document.getElementById('coAceptaPolitica')?.checked || false,
  };
  guardarDatosUsuario(datos);
  coIrPaso(2);
}
window.coIrPaso2 = coIrPaso2;

function coIrPaso3() {
  var metodo = document.querySelector('input[name="metodoPago"]:checked');
  var err = document.getElementById('errCoMetodo');
  if (!metodo) {
    if (err) err.textContent = 'Selecciona un método de pago';
    return;
  }
  if (err) err.textContent = '';
  renderResumenPaso3();
  coIrPaso(3);
}
window.coIrPaso3 = coIrPaso3;

/* ─── Render resumen paso 3 ─── */
function renderResumenPaso3() {
  var itemsEl  = document.getElementById('coResumenItems');
  var totEl    = document.getElementById('coResumenTotales');
  var datosEl  = document.getElementById('coResumenDatos');
  if (!itemsEl || !totEl || !datosEl) return;

  /* Ítems del carrito */
  if (typeof carrito !== 'undefined' && carrito.length) {
    var cop = function(n) { return '$' + Number(n).toLocaleString('es-CO'); };
    itemsEl.innerHTML = '<div style="display:flex;flex-direction:column;gap:.55rem">' +
      carrito.map(function(i) {
        return '<div style="display:flex;align-items:center;gap:.75rem;padding:.5rem;background:var(--gris-50,#fafafa);border-radius:10px;border:1px solid var(--gris-200,#eee)">' +
          '<img src="' + (i.imagen || 'https://picsum.photos/seed/' + i.id + '/50/50') + '" style="width:44px;height:44px;object-fit:cover;border-radius:8px" onerror="this.src=\'https://picsum.photos/seed/' + i.id + '/50/50\'">' +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-size:.82rem;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + i.nombre + '</div>' +
            '<div style="font-size:.72rem;color:#888">' + (i.variante || '') + ' · x' + i.cantidad + '</div>' +
          '</div>' +
          '<span style="font-size:.88rem;font-weight:900;color:#1565C0;white-space:nowrap">' + cop(i.precio * i.cantidad) + '</span>' +
        '</div>';
      }).join('') + '</div>';
  } else {
    itemsEl.innerHTML = '<p style="text-align:center;color:#999;font-size:.85rem">Carrito vacío</p>';
  }

  /* Totales */
  var t   = (typeof calcularTotales === 'function') ? calcularTotales() : { subtotal:0, envio:0, total:0 };
  var cop2 = function(n) { return '$' + Number(n).toLocaleString('es-CO'); };
  var metodo = document.querySelector('input[name="metodoPago"]:checked');
  totEl.innerHTML =
    '<div style="background:var(--gris-50,#fafafa);border-radius:12px;padding:.9rem 1.1rem;border:1px solid var(--gris-200,#eee)">' +
      '<div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:.3rem"><span>Subtotal</span><span>' + cop2(t.subtotal) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:.3rem"><span>Envío</span><span>' + (t.envio === 0 && t.subtotal > 0 ? '🎉 Gratis' : cop2(t.envio)) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:1rem;font-weight:900;border-top:2px dashed var(--gris-300,#e0e0e0);padding-top:.5rem;margin-top:.4rem"><span>Total</span><span style="color:#1565C0">' + cop2(t.total) + '</span></div>' +
      (metodo ? '<div style="margin-top:.5rem;font-size:.75rem;color:#666"><i class="fas fa-credit-card" style="color:#1565C0"></i> Pago: <strong>' + metodo.value + '</strong></div>' : '') +
    '</div>';

  /* Datos de entrega */
  var nombre    = document.getElementById('coNombre')?.value    || '';
  var telefono  = document.getElementById('coTelefono')?.value  || '';
  var email     = document.getElementById('coEmail')?.value     || '';
  var direccion = document.getElementById('coDireccion')?.value || '';
  var notas     = document.getElementById('coNotas')?.value     || '';
  datosEl.innerHTML =
    '<div style="background:var(--azul-50,#e3f2fd);border-radius:12px;padding:.85rem 1rem;font-size:.8rem;margin-top:.75rem">' +
      '<div style="font-weight:800;color:#1565C0;margin-bottom:.5rem">📋 Datos de entrega</div>' +
      '<div style="display:grid;grid-template-columns:auto 1fr;gap:.2rem .75rem">' +
        '<span style="color:#888">Nombre</span><span>' + nombre + '</span>' +
        '<span style="color:#888">Teléfono</span><span>' + telefono + '</span>' +
        '<span style="color:#888">Email</span><span>' + email + '</span>' +
        '<span style="color:#888">Dirección</span><span>' + direccion + '</span>' +
        (notas ? '<span style="color:#888">Notas</span><span>' + notas + '</span>' : '') +
      '</div>' +
    '</div>';
}

/* ─── Confirmar pedido ─── */
function confirmarPedido() {
  var loader     = document.getElementById('coLoader');
  var btnRow     = document.getElementById('coBtnRowConfirmar');
  var btnConfirm = document.getElementById('coBtnConfirmar');
  if (!loader || !btnRow) return;

  loader.style.display    = 'flex';
  btnRow.style.display    = 'none';

  /* Armar mensaje WhatsApp */
  var cop    = function(n) { return '$' + Number(n).toLocaleString('es-CO'); };
  var t      = (typeof calcularTotales === 'function') ? calcularTotales() : { subtotal:0, envio:0, total:0 };
  var metodo = (document.querySelector('input[name="metodoPago"]:checked') || {}).value || 'No especificado';
  var nombre    = document.getElementById('coNombre')?.value    || '';
  var telefono  = document.getElementById('coTelefono')?.value  || '';
  var direccion = document.getElementById('coDireccion')?.value || '';
  var notas     = document.getElementById('coNotas')?.value     || '';
  var pedidoId  = generarIdPedido();

  var msg = '🛒 *PEDIDO ' + pedidoId + ' — Droguerías Económicas*\n\n';
  if (typeof carrito !== 'undefined') {
    carrito.forEach(function(i) {
      msg += '• ' + i.nombre + (i.variante ? ' (' + i.variante + ')' : '') + ' x' + i.cantidad + ' → ' + cop(i.precio * i.cantidad) + '\n';
    });
  }
  msg += '\n━━━━━━━━━━━━━━━━\n';
  msg += '💰 Subtotal: ' + cop(t.subtotal) + '\n';
  msg += '🚚 Envío: ' + (t.envio === 0 && t.subtotal > 0 ? 'Gratis 🎉' : cop(t.envio)) + '\n';
  msg += '━━━━━━━━━━━━━━━━\n';
  msg += '💳 *TOTAL: ' + cop(t.total) + '*\n\n';
  msg += '💳 Método de pago: ' + metodo + '\n';
  msg += '👤 Nombre: ' + nombre + '\n';
  msg += '📱 Teléfono: ' + telefono + '\n';
  msg += '📍 Dirección: ' + direccion + '\n';
  if (notas) msg += '📝 Notas: ' + notas + '\n';
  msg += '\n¿Confirman disponibilidad y tiempo de entrega? ✅';

  /* Guardar pedido */
  var pedido = {
    id:        pedidoId,
    fecha:     new Date().toISOString(),
    items:     typeof carrito !== 'undefined' ? JSON.parse(JSON.stringify(carrito)) : [],
    totales:   t,
    metodo:    metodo,
    cliente:   { nombre: nombre, telefono: telefono, direccion: direccion, notas: notas },
  };
  guardarPedido(pedido);

  /* Registrar uso de cupones si aplica */
  if (typeof confirmarDescuentosEnCheckout === 'function') {
    confirmarDescuentosEnCheckout(t.subtotal);
  }

  setTimeout(function() {
    loader.style.display = 'none';
    /* Abrir WhatsApp */
    var waNum = (window.DE_CONFIG && window.DE_CONFIG.WA_NUM) ? window.DE_CONFIG.WA_NUM : '573124213986';
    window.open('https://wa.me/' + waNum + '?text=' + encodeURIComponent(msg), '_blank');
    mostrarExitoPedido(pedidoId, cop(t.total), metodo, msg);
  }, 1200);
}
window.confirmarPedido = confirmarPedido;

/* ─── Pantalla de éxito ─── */
function mostrarExitoPedido(id, total, metodo, waMsg) {
  var exito = document.getElementById('exitoPedidoModal');
  var modal = document.getElementById('checkoutModal');
  if (modal) modal.style.display = 'none';
  if (!exito) return;

  document.getElementById('exitoIdPedido').textContent = 'Pedido: ' + id;
  document.getElementById('exitoMensaje').textContent  = 'Total: ' + total + ' · Método: ' + metodo;

  /* Guardar msg para el botón WA */
  exito._waMsg = waMsg;
  exito.style.display = 'flex';

  /* Vaciar carrito */
  if (typeof carrito !== 'undefined') {
    carrito = [];
    if (typeof guardarCarrito === 'function') guardarCarrito();
    if (typeof actualizarUI   === 'function') actualizarUI();
  }
}

function enviarPedidoWhatsApp() {
  var exito = document.getElementById('exitoPedidoModal');
  if (!exito || !exito._waMsg) return;
  var waNum = (window.DE_CONFIG && window.DE_CONFIG.WA_NUM) ? window.DE_CONFIG.WA_NUM : '573124213986';
  window.open('https://wa.me/' + waNum + '?text=' + encodeURIComponent(exito._waMsg), '_blank');
}
window.enviarPedidoWhatsApp = enviarPedidoWhatsApp;

function cerrarExito() {
  var exito = document.getElementById('exitoPedidoModal');
  if (exito) exito.style.display = 'none';
  cerrarCheckout();
}
window.cerrarExito = cerrarExito;

function cerrarCheckout() {
  var modal = document.getElementById('checkoutModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}
window.cerrarCheckout = cerrarCheckout;

function abrirCheckout() {
  inyectarModalCheckout();
  var modal = document.getElementById('checkoutModal');
  if (modal) { modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
  coIrPaso(1);
}
window.abrirCheckout = abrirCheckout;

/* ─── Formateo de campos de pago ─── */
function formatarTarjeta(input) {
  var v = input.value.replace(/\D/g, '').substring(0, 16);
  input.value = v.replace(/(.{4})/g, '$1 ').trim();
}
function formatarVencimiento(input) {
  var v = input.value.replace(/\D/g, '').substring(0, 4);
  if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2);
  input.value = v;
}
window.formatarTarjeta    = formatarTarjeta;
window.formatarVencimiento = formatarVencimiento;

/* ─── Estilos inyectados para el checkout ─── */
(function inyectarEstilosCheckout() {
  if (document.getElementById('co-styles')) return;
  var s = document.createElement('style');
  s.id = 'co-styles';
  s.textContent = [
    '.co-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(5px);z-index:9500;align-items:center;justify-content:center;padding:1rem}',
    '.co-panel{background:#fff;border-radius:22px;width:100%;max-width:560px;max-height:92vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.3);display:flex;flex-direction:column}',
    '.co-header{display:flex;align-items:center;gap:.75rem;padding:1.2rem 1.4rem;border-bottom:1.5px solid #e0e0e0;background:linear-gradient(135deg,#0d47a1,#1565C0);color:#fff;flex-shrink:0;border-radius:22px 22px 0 0}',
    '.co-title{flex:1;font-size:1.05rem;font-weight:800;margin:0}',
    '.co-btn-back,.co-btn-close{background:rgba(255,255,255,.15);border:none;border-radius:8px;color:#fff;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.2s}',
    '.co-btn-back:hover,.co-btn-close:hover{background:rgba(255,255,255,.3)}',
    '.co-steps{display:flex;align-items:center;padding:.9rem 1.4rem;background:#f8faff;border-bottom:1px solid #e0e0e0;flex-shrink:0}',
    '.co-step{display:flex;align-items:center;gap:.35rem;font-size:.78rem;font-weight:700;color:#9e9e9e;transition:.2s}',
    '.co-step span{width:22px;height:22px;border-radius:50%;background:#e0e0e0;color:#9e9e9e;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:800;transition:.2s}',
    '.co-step.activo{color:#1565C0}.co-step.activo span{background:#1565C0;color:#fff}',
    '.co-step.completado{color:#2E7D32}.co-step.completado span{background:#2E7D32;color:#fff}',
    '.co-step-sep{flex:1;height:2px;background:#e0e0e0;margin:0 .5rem}',
    '.co-body{padding:1.4rem;flex:1;overflow-y:auto}',
    '.co-section-title{font-size:.9rem;font-weight:800;color:#1565C0;margin:0 0 1rem;display:flex;align-items:center;gap:.4rem}',
    '.co-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}',
    '.co-field{display:flex;flex-direction:column;gap:.3rem}',
    '.co-field-full{grid-column:1/-1}',
    '.co-field label{font-size:.75rem;font-weight:700;color:#616161}',
    '.co-req{color:#e65100}',
    '.co-input{padding:.65rem .9rem;border:2px solid #e0e0e0;border-radius:10px;font-family:inherit;font-size:.88rem;outline:none;transition:.18s;width:100%;box-sizing:border-box;background:#fafafa}',
    '.co-input:focus{border-color:#1565C0;background:#fff}',
    '.co-textarea{resize:vertical;min-height:68px}',
    '.co-error{font-size:.7rem;color:#c62828;font-weight:700;min-height:.8em}',
    '.co-check-label{display:flex;align-items:flex-start;gap:.6rem;cursor:pointer;font-size:.8rem;line-height:1.5;margin-top:.5rem}',
    '.co-check-box{width:18px;height:18px;border:2px solid #1565C0;border-radius:4px;flex-shrink:0;margin-top:1px}',
    '#coAceptaPolitica{display:none}',
    '#coAceptaPolitica:checked ~ .co-check-box{background:#1565C0}',
    '.co-link{color:#1565C0;font-weight:700}',
    '.co-btn-primary{width:100%;padding:.9rem;background:#1565C0;color:#fff;border:none;border-radius:12px;font-family:inherit;font-weight:800;font-size:.95rem;cursor:pointer;margin-top:.75rem;transition:.2s}',
    '.co-btn-primary:hover{background:#0d47a1;transform:translateY(-1px)}',
    '.co-btn-secondary{padding:.8rem 1.4rem;background:#f5f5f5;color:#444;border:1.5px solid #e0e0e0;border-radius:11px;font-family:inherit;font-weight:700;font-size:.88rem;cursor:pointer;transition:.2s}',
    '.co-btn-secondary:hover{border-color:#1565C0;color:#1565C0}',
    '.co-btn-row{display:flex;gap:.75rem;margin-top:1rem;flex-wrap:wrap}',
    '.co-pagos-grid{display:grid;grid-template-columns:1fr 1fr;gap:.65rem;margin-bottom:.75rem}',
    '.co-pago-card{border:2px solid #e0e0e0;border-radius:14px;overflow:hidden;cursor:pointer;transition:.2s}',
    '.co-pago-card input{display:none}',
    '.co-pago-card.seleccionado{border-color:#1565C0;background:#e3f2fd}',
    '.co-pago-inner{display:flex;align-items:center;gap:.65rem;padding:.85rem}',
    '.co-pago-icon{width:40px;height:40px;border-radius:10px;overflow:hidden;flex-shrink:0}',
    '.co-pago-nombre{font-size:.82rem;font-weight:800;margin-bottom:.1rem}',
    '.co-pago-desc{font-size:.7rem;color:#888}',
    '.co-pago-check{margin-left:auto;font-size:.85rem;color:#1565C0;opacity:0;transition:.2s}',
    '.co-pago-card.seleccionado .co-pago-check{opacity:1}',
    '.co-pago-detalle{margin-top:.6rem;padding:.9rem;background:#f8faff;border-radius:12px;border:1.5px solid #e3f2fd;animation:fadeIn .25s ease}',
    '@keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}',
    '.co-mp-banner{display:flex;align-items:center;gap:.5rem;background:linear-gradient(135deg,#003087,#0070E0);color:#fff;border-radius:10px;padding:.65rem 1rem;font-size:.82rem;font-weight:700}',
    '.co-contra-info{text-align:center;padding:1rem}',
    '.co-contra-info h4{font-size:.95rem;font-weight:800;margin:.5rem 0 .3rem}',
    '.co-contra-info p{font-size:.82rem;color:#666;line-height:1.5}',
    '.co-contra-badge{display:inline-block;background:#e8f5e9;color:#2E7D32;border-radius:50px;padding:.25rem .9rem;font-size:.75rem;font-weight:800;margin-top:.5rem}',
    '.co-resumen-box{display:flex;flex-direction:column;gap:.5rem;margin-bottom:.75rem}',
    '.co-resumen-totales{margin-bottom:.75rem}',
    '.co-resumen-datos{margin-bottom:.75rem}',
    '.co-loader{display:flex;flex-direction:column;align-items:center;gap:1rem;padding:2rem;text-align:center;font-weight:700;color:#1565C0}',
    '.co-spinner{width:44px;height:44px;border:4px solid #e3f2fd;border-top-color:#1565C0;border-radius:50%;animation:spin .8s linear infinite}',
    '@keyframes spin{to{transform:rotate(360deg)}}',
    '.co-exito-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(5px);z-index:9600;align-items:center;justify-content:center;padding:1rem}',
    '.co-exito-panel{background:#fff;border-radius:24px;padding:2.5rem 2rem;max-width:420px;width:100%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.3);animation:exitoPop .4s cubic-bezier(.34,1.56,.64,1)}',
    '@keyframes exitoPop{from{transform:scale(.8);opacity:0}to{transform:scale(1);opacity:1}}',
    '.co-exito-icon{font-size:3.5rem;margin-bottom:1rem}',
    '.co-exito-panel h2{font-size:1.4rem;font-weight:900;margin-bottom:.4rem}',
    '.co-exito-id{font-size:.78rem;color:#888;margin-bottom:.3rem}',
    '.co-exito-msg{font-size:.9rem;color:#555;margin-bottom:1.5rem}',
    '.co-exito-btns{display:flex;flex-direction:column;gap:.65rem}',
    '.co-btn-wa{display:flex;align-items:center;justify-content:center;gap:.45rem;padding:.9rem;background:#25D366;color:#fff;border-radius:13px;font-weight:800;font-size:.95rem;cursor:pointer;border:none;font-family:inherit;transition:.2s;box-shadow:0 3px 12px rgba(37,211,102,.3)}',
    '.co-btn-wa:hover{background:#1EB358;transform:translateY(-1px)}',
    '.co-btn-cerrar-exito{padding:.8rem;background:#f5f5f5;color:#444;border:1.5px solid #e0e0e0;border-radius:11px;font-family:inherit;font-weight:700;font-size:.88rem;cursor:pointer;transition:.2s}',
    '@media(max-width:500px){.co-form-grid,.co-pagos-grid{grid-template-columns:1fr!important}.co-panel{max-height:100vh;border-radius:0}}',
  ].join('');
  document.head.appendChild(s);
})();

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', function() {
  /* Inyectar checkout al clic en el botón "Finalizar compra" si existe */
  document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'btnAbrirCheckout') {
      if (typeof carrito !== 'undefined' && carrito.length) {
        abrirCheckout();
      } else {
        if (typeof mostrarToast === 'function') mostrarToast('⚠️ Tu carrito está vacío');
      }
    }
  });
