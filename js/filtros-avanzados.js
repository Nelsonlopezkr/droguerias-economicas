/**
 * ══════════════════════════════════════════════════════════
 *  Droguerías Económicas — filtros-avanzados.js v1.0
 *  ✔ Filtros por: categoría, marca, precio, tags
 *  ✔ Filtros combinables
 *  ✔ Diseño pill-tags moderno
 *  ✔ Chips de filtros activos con "X" para quitar
 *  ✔ Contador de resultados en tiempo real
 * ══════════════════════════════════════════════════════════
 */

'use strict';

/* ════════════════════════════════════════
   ESTADO FILTROS AVANZADOS
   ════════════════════════════════════════ */
var FA_ESTADO = {
  categoria:   null,
  marcas:      [],
  precioMax:   200000,
  tags:        [],
  busqueda:    '',
};

/* ════════════════════════════════════════
   INYECTAR PANEL DE FILTROS MEJORADO
   ════════════════════════════════════════ */
function inyectarFiltrosAvanzadosPro() {
  var wrapper = document.querySelector('.filtros-avanzados');
  if (!wrapper || typeof CATALOGO === 'undefined') return;

  inyectarEstilosFiltrosPro();

  // Obtener marcas únicas del catálogo
  var marcasUnicas = [...new Set(CATALOGO.map(function(p) { return p.marca.split('/')[0].trim(); }))]
    .sort()
    .slice(0, 30);

  wrapper.innerHTML = `
    <div class="fap-header">
      <h3 class="fap-titulo"><i class="fas fa-sliders-h"></i> Filtros</h3>
      <div id="fap-chips-activos" class="fap-chips"></div>
      <button id="fap-limpiar" class="fap-limpiar-btn" onclick="limpiarFiltrosAvanzadosPro()">
        <i class="fas fa-redo"></i> Limpiar todo
      </button>
    </div>
    <div class="fap-body">

      <div class="fap-grupo">
        <div class="fap-grupo-label"><i class="fas fa-tag"></i> Filtrar por</div>
        <div class="fap-tags-wrap" id="fapTagsWrap">
          <button class="fap-tag" data-tag="Oferta" onclick="toggleTagFAP(this,'Oferta')">
            🔴 Ofertas
          </button>
          <button class="fap-tag" data-tag="Más vendido" onclick="toggleTagFAP(this,'Más vendido')">
            🔥 Más vendidos
          </button>
          <button class="fap-tag" data-tag="Nuevo" onclick="toggleTagFAP(this,'Nuevo')">
            🟢 Nuevos
          </button>
        </div>
      </div>

      <div class="fap-grupo fap-precio-grupo">
        <div class="fap-grupo-label"><i class="fas fa-dollar-sign"></i> Precio máximo: <span id="fapPrecioLabel">$200.000</span></div>
        <div class="fap-precio-slider">
          <span class="fap-slider-min">$0</span>
          <input type="range" id="fapSliderPrecio" min="1000" max="200000" step="1000" value="200000"
                 oninput="onChangePrecioFAP(this)">
          <span class="fap-slider-max">$200k</span>
        </div>
      </div>

      <div class="fap-grupo">
        <div class="fap-grupo-label"><i class="fas fa-industry"></i> Marca</div>
        <div class="fap-marcas-scroll" id="fapMarcasWrap">
          ${marcasUnicas.map(function(m) {
            return `<button class="fap-tag fap-marca-tag" data-marca="${m}" onclick="toggleMarcaFAP(this,'${m.replace(/'/g,"\\'")}')">
              ${m}
            </button>`;
          }).join('')}
        </div>
      </div>

    </div>
    <div id="fap-resultados-badge" class="fap-resultados-badge"></div>
  `;

  // Sincronizar con ESTADO existente
  if (window.ESTADO) {
    FA_ESTADO.categoria = window.ESTADO.filtros.categoria;
  }

  actualizarFiltrosAvanzadosPro();
}

window.inyectarFiltrosAvanzadosPro = inyectarFiltrosAvanzadosPro;

/* ════════════════════════════════════════
   HANDLERS
   ════════════════════════════════════════ */
function toggleTagFAP(btn, tag) {
  btn.classList.toggle('activo');
  var idx = FA_ESTADO.tags.indexOf(tag);
  if (idx > -1) FA_ESTADO.tags.splice(idx, 1);
  else FA_ESTADO.tags.push(tag);
  actualizarFiltrosAvanzadosPro();
}
window.toggleTagFAP = toggleTagFAP;

function toggleMarcaFAP(btn, marca) {
  btn.classList.toggle('activo');
  var idx = FA_ESTADO.marcas.indexOf(marca);
  if (idx > -1) FA_ESTADO.marcas.splice(idx, 1);
  else FA_ESTADO.marcas.push(marca);
  actualizarFiltrosAvanzadosPro();
}
window.toggleMarcaFAP = toggleMarcaFAP;

function onChangePrecioFAP(slider) {
  FA_ESTADO.precioMax = parseInt(slider.value);
  var label = document.getElementById('fapPrecioLabel');
  if (label) label.textContent = '$' + FA_ESTADO.precioMax.toLocaleString('es-CO');
  actualizarFiltrosAvanzadosPro();
}
window.onChangePrecioFAP = onChangePrecioFAP;

function limpiarFiltrosAvanzadosPro() {
  FA_ESTADO.marcas   = [];
  FA_ESTADO.tags     = [];
  FA_ESTADO.precioMax = 200000;

  // Reset UI
  document.querySelectorAll('.fap-tag.activo').forEach(function(b) { b.classList.remove('activo'); });
  var slider = document.getElementById('fapSliderPrecio');
  var label  = document.getElementById('fapPrecioLabel');
  if (slider) slider.value = 200000;
  if (label)  label.textContent = '$200.000';

  actualizarFiltrosAvanzadosPro();

  // También limpiar filtros del sistema original
  if (typeof limpiarFiltros === 'function') limpiarFiltros();
}
window.limpiarFiltrosAvanzadosPro = limpiarFiltrosAvanzadosPro;

/* ════════════════════════════════════════
   APLICAR FILTROS
   ════════════════════════════════════════ */
function actualizarFiltrosAvanzadosPro() {
  if (typeof CATALOGO === 'undefined' || typeof ESTADO === 'undefined') return;

  var q = (ESTADO.filtros.busqueda || '').toLowerCase();

  var resultados = CATALOGO.filter(function(p) {
    // Precio
    if (p.variantes[0].precio > FA_ESTADO.precioMax) return false;

    // Tags
    if (FA_ESTADO.tags.length) {
      var tieneTags = FA_ESTADO.tags.some(function(t) {
        return p.tags && p.tags.some(function(pt) { return pt.label === t; });
      });
      if (!tieneTags) return false;
    }

    // Marca
    if (FA_ESTADO.marcas.length) {
      var marcaBase = p.marca.split('/')[0].trim();
      if (!FA_ESTADO.marcas.some(function(m) { return marcaBase.includes(m) || m.includes(marcaBase); })) return false;
    }

    // Búsqueda
    if (q && !p.nombre.toLowerCase().includes(q) &&
             !p.categoria.toLowerCase().includes(q) &&
             !p.marca.toLowerCase().includes(q)) return false;

    // Categoría (del sistema original)
    if (ESTADO.filtros.categoria && p.categoria !== ESTADO.filtros.categoria) return false;

    return true;
  });

  ESTADO.resultados = resultados;
  ESTADO.pagina = 1;

  if (typeof renderGrilla === 'function') renderGrilla();

  // Actualizar contador
  var countEl = document.getElementById('productosCount');
  if (countEl) {
    countEl.innerHTML = '<strong>' + resultados.length + '</strong> producto' +
      (resultados.length !== 1 ? 's' : '') + ' encontrado' +
      (resultados.length !== 1 ? 's' : '');
  }

  // Actualizar badge de resultados en panel
  var badge = document.getElementById('fap-resultados-badge');
  if (badge) {
    var hayFiltros = FA_ESTADO.tags.length || FA_ESTADO.marcas.length || FA_ESTADO.precioMax < 200000;
    if (hayFiltros) {
      badge.style.display = 'block';
      badge.textContent = resultados.length + ' resultado' + (resultados.length !== 1 ? 's' : '');
    } else {
      badge.style.display = 'none';
    }
  }

  // Actualizar chips de filtros activos
  actualizarChipsFiltrosActivos();
}

function actualizarChipsFiltrosActivos() {
  var chipsEl = document.getElementById('fap-chips-activos');
  if (!chipsEl) return;

  var chips = [];

  FA_ESTADO.tags.forEach(function(tag) {
    chips.push({ label: tag, fn: "quitarChipTag('" + tag + "')" });
  });

  FA_ESTADO.marcas.forEach(function(marca) {
    chips.push({ label: marca, fn: "quitarChipMarca('" + marca.replace(/'/g,"\\'") + "')" });
  });

  if (FA_ESTADO.precioMax < 200000) {
    chips.push({ label: 'Máx. $' + FA_ESTADO.precioMax.toLocaleString('es-CO'), fn: 'quitarChipPrecio()' });
  }

  if (!chips.length) {
    chipsEl.innerHTML = '';
    return;
  }

  chipsEl.innerHTML = chips.map(function(c) {
    return `<span class="fap-chip-activo" onclick="${c.fn}">${c.label} <i class="fas fa-times"></i></span>`;
  }).join('');
}

function quitarChipTag(tag) {
  FA_ESTADO.tags = FA_ESTADO.tags.filter(function(t) { return t !== tag; });
  var btn = document.querySelector('.fap-tag[data-tag="' + tag + '"]');
  if (btn) btn.classList.remove('activo');
  actualizarFiltrosAvanzadosPro();
}
function quitarChipMarca(marca) {
  FA_ESTADO.marcas = FA_ESTADO.marcas.filter(function(m) { return m !== marca; });
  var btn = document.querySelector('.fap-marca-tag[data-marca="' + marca + '"]');
  if (btn) btn.classList.remove('activo');
  actualizarFiltrosAvanzadosPro();
}
function quitarChipPrecio() {
  FA_ESTADO.precioMax = 200000;
  var slider = document.getElementById('fapSliderPrecio');
  var label  = document.getElementById('fapPrecioLabel');
  if (slider) slider.value = 200000;
  if (label)  label.textContent = '$200.000';
  actualizarFiltrosAvanzadosPro();
}
window.quitarChipTag   = quitarChipTag;
window.quitarChipMarca = quitarChipMarca;
window.quitarChipPrecio = quitarChipPrecio;

/* ════════════════════════════════════════
   ESTILOS
   ════════════════════════════════════════ */
function inyectarEstilosFiltrosPro() {
  if (document.getElementById('filtros-pro-styles')) return;
  var s = document.createElement('style');
  s.id = 'filtros-pro-styles';
  s.textContent = `
    .filtros-avanzados {
      background: #fff;
      border: 1.5px solid #e8edf5;
      border-radius: 16px;
      padding: 1rem 1.2rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,.05);
    }

    .fap-header {
      display: flex;
      align-items: center;
      gap: .7rem;
      flex-wrap: wrap;
      margin-bottom: .8rem;
      padding-bottom: .8rem;
      border-bottom: 1px solid #f0f0f0;
    }
    .fap-titulo {
      font-size: .88rem;
      font-weight: 800;
      color: #1a1a2e;
      margin: 0;
      display: flex;
      align-items: center;
      gap: .4rem;
      white-space: nowrap;
    }
    .fap-titulo i { color: #1565C0; }
    .fap-chips { display: flex; flex-wrap: wrap; gap: .3rem; flex: 1; }
    .fap-chip-activo {
      display: inline-flex;
      align-items: center;
      gap: .25rem;
      background: #E3F2FD;
      color: #1565C0;
      border-radius: 50px;
      padding: .2rem .65rem;
      font-size: .7rem;
      font-weight: 700;
      cursor: pointer;
      transition: background .2s;
    }
    .fap-chip-activo:hover { background: #BBDEFB; }
    .fap-chip-activo i { font-size: .55rem; }

    .fap-limpiar-btn {
      display: flex;
      align-items: center;
      gap: .3rem;
      padding: .35rem .85rem;
      border: 1.5px solid #e0e0e0;
      border-radius: 8px;
      background: #fff;
      font-family: inherit;
      font-size: .75rem;
      font-weight: 700;
      color: #616161;
      cursor: pointer;
      white-space: nowrap;
      transition: all .18s;
    }
    .fap-limpiar-btn:hover { border-color: #1565C0; color: #1565C0; }

    .fap-body {
      display: flex;
      flex-wrap: wrap;
      gap: .9rem 1.4rem;
      align-items: flex-start;
    }
    .fap-grupo {
      display: flex;
      flex-direction: column;
      gap: .4rem;
    }
    .fap-grupo-label {
      font-size: .7rem;
      font-weight: 800;
      color: #9e9e9e;
      text-transform: uppercase;
      letter-spacing: .07em;
      display: flex;
      align-items: center;
      gap: .3rem;
    }
    .fap-grupo-label i { color: #1565C0; }

    .fap-tags-wrap, .fap-marcas-scroll {
      display: flex;
      flex-wrap: wrap;
      gap: .3rem;
    }
    .fap-marcas-scroll {
      max-width: 500px;
      max-height: 80px;
      overflow-y: auto;
      scrollbar-width: thin;
    }
    .fap-tag {
      display: inline-flex;
      align-items: center;
      gap: .22rem;
      padding: .22rem .65rem;
      border: 1.5px solid #e0e0e0;
      border-radius: 50px;
      font-size: .72rem;
      font-weight: 700;
      cursor: pointer;
      transition: all .18s;
      background: #fff;
      color: #616161;
      font-family: inherit;
    }
    .fap-tag:hover:not(.activo) { border-color: #1565C0; color: #1565C0; }
    .fap-tag.activo {
      background: #1565C0;
      color: #fff;
      border-color: #1565C0;
    }
    .fap-marca-tag.activo { background: #00695C; border-color: #00695C; }

    .fap-precio-grupo { flex: 1; min-width: 220px; }
    .fap-precio-slider {
      display: flex;
      align-items: center;
      gap: .5rem;
    }
    .fap-precio-slider input[type="range"] {
      flex: 1;
      accent-color: #1565C0;
      cursor: pointer;
    }
    .fap-slider-min, .fap-slider-max {
      font-size: .65rem;
      color: #9e9e9e;
      font-weight: 700;
      white-space: nowrap;
    }

    .fap-resultados-badge {
      display: none;
      margin-top: .6rem;
      padding: .3rem .8rem;
      background: #E3F2FD;
      color: #1565C0;
      border-radius: 8px;
      font-size: .75rem;
      font-weight: 800;
      text-align: center;
    }

    @media (max-width: 600px) {
      .fap-body { flex-direction: column; gap: .7rem; }
      .fap-marcas-scroll { max-width: 100%; }
      .fap-precio-grupo { min-width: 100%; }
    }
  `;
  document.head.appendChild(s);
}

/* ════════════════════════════════════════
   INICIALIZACIÓN
   ════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  // Solo en productos.html
  if (!document.querySelector('.page-hero')) return;

  setTimeout(function() {
    if (typeof CATALOGO === 'undefined') return;
    inyectarFiltrosAvanzadosPro();

    // Sincronizar slider existente si hay
    var sliderViejo = document.getElementById('filtroPrecio');
    if (sliderViejo) {
      sliderViejo.addEventListener('input', function() {
        FA_ESTADO.precioMax = parseInt(sliderViejo.value);
        actualizarFiltrosAvanzadosPro();
      });
    }
  }, 350);
});