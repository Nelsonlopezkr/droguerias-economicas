# 📊 Sistema de Multiplicadores de Precio por Laboratorio

## 🎯 Cómo funciona

Tu sitio web ahora tiene un **sistema dinámico de precios por laboratorio**. Cada laboratorio/marca tiene un multiplicador que se aplica automáticamente a todos los precios base.

**Ejemplo en tiempo real:**
- Producto: Acetaminofén 500mg
- Precio base en `variantes`: **$3,200**

### Precios finales según laboratorio:
| Laboratorio | Multiplicador | Precio Final | Ajuste |
|---|---|---|---|
| **Laprof** | 0.82 | **$2,624** | 18% descuento ✅ |
| **Lafrancol** | 0.80 | **$2,560** | 20% descuento ✅ |
| **Genfar** | 0.90 | **$2,880** | 10% descuento ✅ |
| **Cronofen** | 1.00 | **$3,200** | Precio normal |
| **MK** | 1.30 | **$4,160** | 30% más caro ⬆️ |
| **Novartis** | 1.32 | **$4,224** | 32% más caro ⬆️ |
| **Roche** | 1.40 | **$4,480** | 40% más caro ⬆️ |

---

## 📂 Archivos modificados

### 1. **js/laboratorio-precios.js** (NUEVO)
Archivo con todos los multiplicadores y funciones de cálculo:
- `MULTIPLICADORES_LABORATORIO` — diccionario de laboratorios y sus multiplicadores
- `obtenerMultiplicadorLaboratorio()` — obtiene el multiplicador de un lab
- `calcularPrecioLaboratorio()` — calcula el precio ajustado
- `obtenerInfoAjuste()` — retorna info de descuento/sobreprecio
- `obtenerRangoLaboratorios()` — lista todos ordenados de + barato a + caro

### 2. **js/catalogo.js** (MODIFICADO)
- Función `_precioCard()` — ahora aplica multiplicador
- Función `selVarianteModal()` — calcula precio al cambiar laboratorio
- Función `renderTarjeta()` — muestra precios ajustados en botones de variantes

### 3. **HTML** — Scripts insertados en:
- `productos.html`
- `index.html`
- `promociones.html`
- `afiliaciones.html`

---

## 💰 Multiplicadores actuales

### 📉 LABORATORIOS GENÉRICOS / ECONÓMICOS (Descuentos)
```javascript
'Lafrancol': 0.80,    // 20% OFF
'Laprof':    0.82,    // 18% OFF
'Genfar':    0.90,    // 10% OFF
'Genérico':  0.75,    // 25% OFF (el más barato)
```

### 📈 MARCAS PREMIUM (Sobreprecios)
```javascript
'Roche':     1.40,    // 40% más caro
'Bayer':     1.35,    // 35% más caro
'Novartis':  1.32,    // 32% más caro
'Abbott':    1.25,    // 25% más caro
'J&J':       1.15,    // 15% más caro
'Pfizer':    1.28,    // 28% más caro
```

### ⚖️ MARCAS INTERMEDIAS
```javascript
'GSK':       1.12,    // 12% más caro
'Sanofi':    1.10,    // 10% más caro
'Takeda':    1.08,    // 8% más caro
'MK':        1.30,    // 30% más caro
```

### 🏪 MARCAS PROPIAS
```javascript
'DE':        0.70,    // 30% OFF
'Económica': 0.72,    // 28% OFF
```

---

## ✅ Dónde se aplican los precios

### En la TARJETA del producto:
✅ Precio en el footer de la card
✅ Precios en botones de laboratorios
✅ Presentaciones (mantenienen sus precios base)

### En el MODAL del producto:
✅ Precio destacado al cambiar laboratorio
✅ Precios en etiquetas de laboratorios
✅ Link WhatsApp con precio actualizado

### En el CARRITO:
✅ El carrito ya usa los precios ajustados

---

## 🔧 Cómo editar los multiplicadores

**Archivo:** `js/laboratorio-precios.js` (líneas 23-42)

**Para cambiar precios:**
1. Abre `js/laboratorio-precios.js`
2. Busca el objeto `MULTIPLICADORES_LABORATORIO`
3. Ajusta los valores:
   - `< 1.0` = descuento
   - `= 1.0` = precio normal
   - `> 1.0` = sobreprecio

**Ejemplo: Cambiar MK a 1.40 (40% más caro)**
```javascript
'MK': 1.40,  // cambiar de 1.30 a 1.40
```

**Ejemplo: Agregar nuevo laboratorio**
```javascript
'Nuevo Lab': 0.95,  // 5% descuento
```

---

## 📱 Comportamiento en la interfaz

### Cuando el usuario:
1. **Abre un producto** → Ve precios con multiplicadores aplicados
2. **Cambia de laboratorio** → Precio se actualiza automáticamente
3. **Selecciona presentación** → Presentación mantiene su precio (sin multiplicador)
4. **Agrega al carrito** → Se guarda el precio final correcto
5. **Comparte en WhatsApp** → Envía el precio actualizado

---

## 💡 Casos de uso

### Escenario 1: Promover laboratorios genéricos
Baja los multiplicadores de genéricos para que sean irresistibles:
```javascript
'Genérico': 0.60,  // 40% descuento vs antes (25%)
```

### Escenario 2: Subir precios de marcas premium
```javascript
'Roche': 1.50,  // 50% más vs antes (40%)
```

### Escenario 3: Evento especial - Black Friday
```javascript
// Temporalmente bajar todos los genéricos
'Lafrancol': 0.60,  // normalmente 0.80
'Laprof':    0.65,  // normalmente 0.82
'Genérico':  0.50,  // normalmente 0.75
```

---

## 🚀 Próximas mejoras sugeridas

- [ ] Panel admin para editar multiplicadores sin código
- [ ] Histórico de cambios de precios
- [ ] Mostrar "20% descuento" en la UI junto al precio
- [ ] Comparativa de precios entre laboratorios
- [ ] Alertas cuando precio es "demasiado bajo"

---

## 📝 Notas técnicas

- **Performance:** Los multiplicadores se calculan al renderizar (no afecta carga)
- **Redondeo:** Los precios se redondean al entero más cercano
- **Presentaciones:** No son afectadas por multiplicadores (mantienen precio fijo)
- **localStorage:** Las selecciones de laboratorio se guardan por usuario
- **Compatibilidad:** Funciona en navegadores modernos (ES5+)

---

## 🐛 Troubleshooting

**P: Los precios no cambian**
- Verifica que laboratorio-precios.js esté cargado antes de catalogo.js
- Asegúrate que el campo `laboratorio` existe en las variantes
- Abre DevTools Console para ver errores

**P: Quiero precios diferentes para el MISMO producto en diferentes laboratorios**
- Crea variantes separadas con laboratorios diferentes (ya soportado)
- Cada variante tendrá su propio multiplicador automáticamente

**P: ¿Los descuentos se aplican en presentaciones?**
- No, las presentaciones tienen precios fijos definidos en `presentaciones[]`
- Solo las variantes (laboratorios) reciben el multiplicador

---

**Sistema creado:** 2026-06-06
**Versión:** 1.0
