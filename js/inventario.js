/* ══════════════════════════════════════════════════════════
 *  Droguerías Económicas — inventario.js v1.0
 *  Muestra estados de stock en tarjetas del catálogo.
 *  IIIFE autocontenido — no modifica archivos existentes.
 *  Estados: disponible | pocas | agotado | proximamente
 * ══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Determinar estado de un producto ── */
  function getEstado(p) {
    if (p.estado) return p.estado;
    var stock = (p.stock !== undefined && p.stock !== null) ? Number(p.stock) : null;
    if (stock === 0) return 'agotado';
    if (stock !== null && stock > 0 && stock <= 5) return 'pocas';
    return 'disponible';
  }

  /* ── HTML de badge de estado ── */
  function htmlBadge(estado) {
    var cfg = {
      disponible:    { cls: 'inv-badge-disp',   txt: '✅ Disponible' },
      pocas:         { cls: 'inv-badge-pocas',  txt: '⚠️ Pocas unidades' },
      agotado:       { cls: 'inv-badge-agot',   txt: '❌ Agotado' },
      proximamente:  { cls: 'inv-badge-prox',   txt: '🔜 Próximamente' }
    };
    var c = cfg[estado] || cfg.disponible;
    return '<span class="inv-badge ' + c.cls + '" aria-label="Estado: ' + c.txt + '">' + c.txt + '</span>';
  }

  /* ── Inyectar badge y efecto agotado en una tarjeta ── */
  function procesarTarjeta(card) {
    if (card.getAttribute('data-inv-processed')) return;
    card.setAttribute('data-inv-processed', '1');

    var id = Number(card.getAttribute('data-id'));
    if (!id || typeof CATALOGO === 'undefined') return;

    var p = CATALOGO.find(function (x) { return x.id === id; });
    if (!p) return;

    var estado = getEstado(p);
    if (estado === 'disponible') return; /* sin badge para disponibles */

    /* Inyectar badge */
    var badge = document.createElement('span');
    badge.className = 'inv-badge ' + (
      estado === 'agotado'      ? 'inv-badge-agot'  :
      estado === 'pocas'        ? 'inv-badge-pocas' :
      estado === 'proximamente' ? 'inv-badge-prox'  : 'inv-badge-disp'
    );
    badge.setAttribute('aria-label', 'Estado: ' + badge.className);
    badge.textContent = (
      estado === 'agotado'      ? '❌ Agotado'        :
      estado === 'pocas'        ? '⚠️ Pocas unidades' :
      estado === 'proximamente' ? '🔜 Próximamente'   : '✅ Disponible'
    );

    card.appendChild(badge);

    /* Efecto visual si agotado */
    if (estado === 'agotado') {
      card.classList.add('inv-agotado');
      /* Deshabilitar botones de agregar al carrito */
      card.querySelectorAll('.btn-agregar-carrito, .btn-add-cart, [onclick*="agregarDesdeGrid"], [onclick*="agregarAlCarrito"]').forEach(function (btn) {
        btn.disabled = true;
        btn.title = 'Producto no disponible actualmente';
        btn.setAttribute('aria-disabled', 'true');
        btn.style.opacity = '.45';
        btn.style.pointerEvents = 'none';
      });
    }

    if (estado === 'pocas') {
      card.classList.add('inv-pocas');
    }
  }

  /* ── Inyectar en todas las tarjetas actuales ── */
  function procesarGrid() {
    document.querySelectorAll('.producto-card[data-id]').forEach(procesarTarjeta);
  }

  /* ── Observer para nuevas tarjetas (cuando el grid se actualiza) ── */
  function observarGrid() {
    var grid = document.getElementById('productosGrid');
    if (!grid) return;
    new MutationObserver(function () {
      /* Pequeño timeout para dejar que catalogo.js termine de renderizar */
      setTimeout(procesarGrid, 80);
    }).observe(grid, { childList: true, subtree: false });
  }

  /* ── Init ── */
  function init() {
    procesarGrid();
    observarGrid();
  }

  if (document.readyState !== 'loading') {
    /* CATALOGO puede no estar listo aún — esperar */
    setTimeout(init, 300);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(init, 300);
    });
  }

  /* ── API pública ── */
  window.DEInventario = {
    getEstado:     getEstado,
    htmlBadge:     htmlBadge,
    procesarGrid:  procesarGrid
  };

})();
