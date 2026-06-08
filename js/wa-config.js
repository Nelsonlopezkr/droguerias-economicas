/* ══════════════════════════════════════════════════════════
 *  Droguerías Económicas — Configuración Global
 *  Carga este archivo PRIMERO en todos los HTML, antes de
 *  carrito.js, pago.js y catalogo.js
 * ══════════════════════════════════════════════════════════ */
'use strict';

window.DE_CONFIG = {
  /* ── Contacto ── */
  WA_NUM:     '573124213986',       /* ← número único; cámbialo aquí si cambia */
  WA_NEQUI:   '3224395198',
  TEL:        '+573124213986',

  /* ── Tienda ── */
  NOMBRE:     'Droguerías Económicas',
  DIRECCION:  'Diagonal 5 Este 7D 7-06, Facatativá, Cundinamarca',
  HORARIO:    'Lun – Dom: 7 am – 10 pm',
  EMAIL:      'contacto@drogeriaseconomicas.com',

  /* ── Envío ── */
  ENVIO_PRECIO:       3000,
  ENVIO_GRATIS_DESDE: 50000,

  /* ── Bancolombia ── */
  BANCO_NOMBRE:   'Bancolombia',
  BANCO_TIPO:     'Cuenta de Ahorros',
  BANCO_NUMERO:   '123-456789-00',
  BANCO_TITULAR:  'Droguerías Económicas',
  BANCO_NIT:      '1.234.567.890',
};

/* Helpers globales */
window.waLink = function(msg) {
  return 'https://wa.me/' + window.DE_CONFIG.WA_NUM + '?text=' + encodeURIComponent(msg || '');
};
window.copCurrency = function(n) {
  return '$' + Number(n).toLocaleString('es-CO');
};