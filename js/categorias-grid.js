/**
 * ══════════════════════════════════════════════════════════
 *  Droguerías Económicas — categorias-grid.js v1.0
 *  ✔ Tarjetas de categoría modernas con imágenes
 *  ✔ Diseño responsive tipo Farmatodo/Cruz Verde
 *  ✔ Animaciones suaves
 *  ✔ Compatible con sistema de filtros existente
 * ══════════════════════════════════════════════════════════
 */

'use strict';

var CATS_VISUAL_PRO = {
  'Medicamentos': {
    emoji: '💊',
    gradiente: 'linear-gradient(135deg,#1565C0 0%,#1976D2 60%,#42A5F5 100%)',
    iconColor: '#fff',
    icon: 'fas fa-pills',
    imgUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=75&auto=format&fit=crop',
    tag: 'Más vendidos',
    tagColor: '#E65100',
  },
  'Cuidado Personal': {
    emoji: '🧴',
    gradiente: 'linear-gradient(135deg,#00695C 0%,#00897B 60%,#4DB6AC 100%)',
    iconColor: '#fff',
    icon: 'fas fa-hand-sparkles',
    imgUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=75&auto=format&fit=crop',
    tag: 'Higiene',
    tagColor: '#00695C',
  },
  'Belleza': {
    emoji: '💄',
    gradiente: 'linear-gradient(135deg,#AD1457 0%,#C2185B 60%,#F06292 100%)',
    iconColor: '#fff',
    icon: 'fas fa-spa',
    imgUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=75&auto=format&fit=crop',
    tag: 'Tendencia',
    tagColor: '#AD1457',
  },
  'Bebé y Mamá': {
    emoji: '👶',
    gradiente: 'linear-gradient(135deg,#E65100 0%,#F57C00 60%,#FFB74D 100%)',
    iconColor: '#fff',
    icon: 'fas fa-baby',
    imgUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&q=75&auto=format&fit=crop',
    tag: 'Cuidado',
    tagColor: '#E65100',
  },
  'Mercado y Hogar': {
    emoji: '🏠',
    gradiente: 'linear-gradient(135deg,#6A1B9A 0%,#7B1FA2 60%,#AB47BC 100%)',
    iconColor: '#fff',
    icon: 'fas fa-home',
    imgUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=75&auto=format&fit=crop',
    tag: 'Hogar',
    tagColor: '#6A1B9A',
  },
  'Marcas Propias': {
    emoji: '⭐',
    gradiente: 'linear-gradient(135deg,#1B5E20 0%,#2E7D32 60%,#66BB6A 100%)',
    iconColor: '#fff',
    icon: 'fas fa-star',
    imgUrl: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&q=75&auto=format&fit=crop',
    tag: 'Exclusivo',
    tagColor: '#1B5E20',
  },
};

/* ════════════════════════════════════════
   RENDER GRID PRO
   ════════════════════════════════════════ */
function renderCategoriasGridPro(containerEl, catalogo, estadoFiltros, onFiltrar) {
  if (!containerEl || !catalogo) return;

  var cats = [...new Set(catalogo.map(function(p) { return p.categoria; }))];
  var totalTodos = catalogo.length;

  inyectarEstilosCatsGridPro();

  var html = '<div class="cats-grid-pro">';

  // Card "Todos"
  html += `
    <button class="cgp-card cgp-card-todos ${(!estadoFiltros || !estadoFiltros.categoria) ? 'activo' : ''}"
            onclick="(${onFiltrar ? 'window.__cgpFiltrar' : 'filtrarCategoria'})(null)"
            aria-label="Mostrar todos los productos">
      <div class="cgp-card-inner">
        <div class="cgp-todos-bg">
          <div class="cgp-todos-dots"></div>
        </div>
        <div class="cgp-card-content">
          <div class="cgp-card-icon-wrap" style="background:rgba(255,255,255,.15)">
            <i class="fas fa-store" style="color:#fff"></i>
          </div>
          <div class="cgp-card-info">
            <span class="cgp-card-name">Todos</span>
            <span class="cgp-card-desc">Catálogo completo</span>
            <span class="cgp-card-count">${totalTodos} productos</span>
          </div>
          <div class="cgp-explore-btn">Explorar <i class="fas fa-arrow-right"></i></div>
        </div>
        <div class="cgp-check-badge"><i class="fas fa-check"></i></div>
      </div>
    </button>
  `;

  cats.forEach(function(cat) {
    var meta  = CATS_VISUAL_PRO[cat] || { emoji:'📦', gradiente:'linear-gradient(135deg,#1565C0,#42A5F5)', icon:'fas fa-box', imgUrl:'', tag:'Ver más', tagColor:'#1565C0' };
    var count = catalogo.filter(function(p) { return p.categoria === cat; }).length;
    var activo = estadoFiltros && estadoFiltros.categoria === cat;
    var seed = encodeURIComponent(cat);

    html += `
      <button class="cgp-card ${activo ? 'activo' : ''}"
              onclick="${onFiltrar ? 'window.__cgpFiltrar' : 'filtrarCategoria'}('${cat.replace(/'/g,"\\'")}'"
              aria-label="Filtrar por ${cat}"
              style="--cgp-grad:${meta.gradiente}">
        <div class="cgp-card-inner">
          <div class="cgp-card-img">
            <img src="${meta.imgUrl || 'https://picsum.photos/seed/' + seed + '/400/240'}"
                 alt="${cat}"
                 loading="lazy"
                 onerror="this.src='https://picsum.photos/seed/${seed}/400/240'"
                 >
            <div class="cgp-img-overlay" style="background:${meta.gradiente};opacity:.55"></div>
            <span class="cgp-tag" style="background:${meta.tagColor}">${meta.tag}</span>
          </div>
          <div class="cgp-card-content">
            <div class="cgp-card-icon-wrap" style="background:${meta.gradiente}">
              <i class="${meta.icon}" style="color:#fff"></i>
            </div>
            <div class="cgp-card-info">
              <span class="cgp-card-name">${meta.emoji} ${cat}</span>
              <span class="cgp-card-count">${count} productos</span>
            </div>
            <div class="cgp-explore-btn">Explorar <i class="fas fa-arrow-right"></i></div>
          </div>
          <div class="cgp-check-badge"><i class="fas fa-check"></i></div>
        </div>
      </button>
    `;
  });

  html += '</div>';
  containerEl.innerHTML = html;

  // Animación escalonada
  requestAnimationFrame(function() {
    containerEl.querySelectorAll('.cgp-card').forEach(function(card, i) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(22px)';
      setTimeout(function() {
        card.style.transition = 'opacity .35s ease, transform .35s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, i * 55);
    });
  });
}

window.renderCategoriasGridPro = renderCategoriasGridPro;

/* ════════════════════════════════════════
   ESTILOS
   ════════════════════════════════════════ */
function inyectarEstilosCatsGridPro() {
  if (document.getElementById('cats-grid-pro-styles')) return;
  var s = document.createElement('style');
  s.id = 'cats-grid-pro-styles';
  s.textContent = `
    .cats-grid-pro {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 2.5rem;
    }

    .cgp-card {
      position: relative;
      border: 2px solid transparent;
      border-radius: 18px;
      overflow: hidden;
      cursor: pointer;
      background: #fff;
      box-shadow: 0 2px 12px rgba(0,0,0,.08);
      transition: transform .28s cubic-bezier(.4,0,.2,1),
                  box-shadow .28s,
                  border-color .28s;
      font-family: inherit;
      padding: 0;
      text-align: left;
    }
    .cgp-card:hover {
      transform: translateY(-6px) scale(1.01);
      box-shadow: 0 12px 36px rgba(0,0,0,.16);
      border-color: #1565C0;
    }
    .cgp-card.activo {
      border-color: #1565C0;
      box-shadow: 0 6px 24px rgba(21,101,192,.28);
    }

    .cgp-card-inner { position: relative; }

    /* Imagen */
    .cgp-card-img {
      position: relative;
      height: 110px;
      overflow: hidden;
    }
    .cgp-card-img img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform .55s ease;
      display: block;
    }
    .cgp-card:hover .cgp-card-img img { transform: scale(1.08); }
    .cgp-img-overlay {
      position: absolute;
      inset: 0;
      transition: opacity .3s;
    }
    .cgp-card:hover .cgp-img-overlay { opacity: .4 !important; }
    .cgp-tag {
      position: absolute;
      top: 8px;
      left: 8px;
      color: #fff;
      font-size: .58rem;
      font-weight: 900;
      padding: .15rem .55rem;
      border-radius: 50px;
      letter-spacing: .05em;
      text-transform: uppercase;
      box-shadow: 0 2px 6px rgba(0,0,0,.2);
    }

    /* Contenido */
    .cgp-card-content {
      padding: .8rem .85rem;
      display: flex;
      align-items: center;
      gap: .65rem;
    }
    .cgp-card-icon-wrap {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: .9rem;
      flex-shrink: 0;
    }
    .cgp-card-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: .06rem;
    }
    .cgp-card-name {
      font-size: .82rem;
      font-weight: 800;
      color: #1a1a2e;
      line-height: 1.2;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cgp-card-desc {
      font-size: .66rem;
      color: #9e9e9e;
      display: block;
    }
    .cgp-card-count {
      font-size: .7rem;
      font-weight: 800;
      color: #1565C0;
      display: block;
    }
    .cgp-explore-btn {
      display: flex;
      align-items: center;
      gap: .22rem;
      font-size: .67rem;
      font-weight: 800;
      color: #1565C0;
      white-space: nowrap;
      opacity: 0;
      transform: translateX(-6px);
      transition: opacity .2s, transform .2s;
    }
    .cgp-card:hover .cgp-explore-btn {
      opacity: 1;
      transform: translateX(0);
    }

    /* Check badge */
    .cgp-check-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 22px;
      height: 22px;
      background: #1565C0;
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: .6rem;
      opacity: 0;
      transform: scale(0);
      transition: opacity .2s, transform .2s;
      box-shadow: 0 2px 6px rgba(21,101,192,.4);
    }
    .cgp-card.activo .cgp-check-badge {
      opacity: 1;
      transform: scale(1);
    }

    /* Card "Todos" especial */
    .cgp-card-todos .cgp-card-inner {
      background: linear-gradient(135deg,#1565C0,#0d47a1);
      padding: 1.2rem .85rem;
    }
    .cgp-todos-bg {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }
    .cgp-todos-dots::before, .cgp-todos-dots::after {
      content: '';
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,.07);
    }
    .cgp-todos-dots::before { width: 80px; height: 80px; top: -20px; right: -20px; }
    .cgp-todos-dots::after  { width: 50px; height: 50px; bottom: -10px; left: 10px; }
    .cgp-card-todos .cgp-card-name { color: #fff; }
    .cgp-card-todos .cgp-card-desc { color: rgba(255,255,255,.65); }
    .cgp-card-todos .cgp-card-count { color: #FFD54F; }
    .cgp-card-todos .cgp-explore-btn { color: rgba(255,255,255,.8); }
    .cgp-card-todos .cgp-card-content { position: relative; z-index: 1; }
    .cgp-card-todos .cgp-check-badge { background: #FFD54F; color: #1565C0; }

    @media (max-width: 768px) {
      .cats-grid-pro {
        grid-template-columns: repeat(2, 1fr);
        gap: .75rem;
      }
      .cgp-card-img { height: 90px; }
      .cgp-explore-btn { display: none; }
    }
    @media (max-width: 400px) {
      .cats-grid-pro { grid-template-columns: repeat(2, 1fr); gap: .5rem; }
      .cgp-card-img { height: 75px; }
      .cgp-card-content { padding: .6rem; }
      .cgp-card-name { font-size: .72rem; }
    }
  `;
  document.head.appendChild(s);
}

/* ════════════════════════════════════════
   INTEGRACIÓN — sobrescribe renderCategorias si
   estamos en productos.html (no en index)
   ════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  // Esperar a que catalogo.js inicialice
  setTimeout(function() {
    var el = document.getElementById('categoriasGrid');
    if (!el || typeof CATALOGO === 'undefined') return;

    // Parchear renderCategorias en productos.html
    var isProductos = !!document.querySelector('.page-hero');
    if (isProductos) {
      // Override de la función en catalogo.js
      window.__cgpFiltrar = function(cat) {
        if (typeof filtrarCategoria === 'function') filtrarCategoria(cat);
      };

      // Renderizar inmediatamente
      renderCategoriasGridPro(el, CATALOGO, window.ESTADO ? window.ESTADO.filtros : null, true);

      // Re-renderizar en cada filtro para actualizar estado activo
      var _origFiltrar = window.filtrarCategoria;
      window.filtrarCategoria = function(cat) {
        _origFiltrar && _origFiltrar(cat);
        setTimeout(function() {
          renderCategoriasGridPro(el, CATALOGO, window.ESTADO ? window.ESTADO.filtros : null, true);
        }, 50);
      };
    } else {
      // En index, también mejorar
      window.__cgpFiltrar = function(cat) {
        if (typeof filtrarCategoria === 'function') filtrarCategoria(cat);
        renderCategoriasGridPro(el, CATALOGO, window.ESTADO ? window.ESTADO.filtros : null, true);
      };
      renderCategoriasGridPro(el, CATALOGO, window.ESTADO ? window.ESTADO.filtros : null, true);
    }
  }, 300);
});