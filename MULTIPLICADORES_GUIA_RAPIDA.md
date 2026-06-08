# 💰 MULTIPLICADORES DE PRECIO — GUÍA RÁPIDA

## 🎯 Cómo funcionan los multiplicadores

**Precio Final = Precio Base × Multiplicador**

**Ejemplos:**
- Precio base $1000 × 0.80 (Lafrancol) = **$800** ✅ (20% descuento)
- Precio base $1000 × 1.00 (Cronofen) = **$1000** ➡️ (precio normal)  
- Precio base $1000 × 1.30 (MK) = **$1300** ⬆️ (30% más caro)

---

## 📊 TABLA DE MULTIPLICADORES

### 🟢 DESCUENTOS (Laboratorios genéricos - más baratos)

| Laboratorio | Multiplicador | % Descuento | Ejemplo ($1000) |
|---|---|---|---|
| **Genérico** | 0.75 | **-25%** | $750 |
| **Lafrancol** | 0.80 | **-20%** | $800 |
| **Laprof** | 0.82 | **-18%** | $820 |
| **Económica** | 0.72 | **-28%** | $720 |
| **DE** | 0.70 | **-30%** | $700 |
| **Genfar** | 0.90 | **-10%** | $900 |

### ➡️ PRECIO NORMAL

| Laboratorio | Multiplicador | Ajuste | Ejemplo ($1000) |
|---|---|---|---|
| **Cronofen** | 1.00 | Sin cambios | $1000 |

### 🔴 SOBREPRECIOS (Marcas premium - más caras)

| Laboratorio | Multiplicador | % Más caro | Ejemplo ($1000) |
|---|---|---|---|
| **Takeda** | 1.08 | **+8%** | $1080 |
| **Sanofi** | 1.10 | **+10%** | $1100 |
| **GSK** | 1.12 | **+12%** | $1120 |
| **J&J** | 1.15 | **+15%** | $1150 |
| **Abbott** | 1.25 | **+25%** | $1250 |
| **Pfizer** | 1.28 | **+28%** | $1280 |
| **MK** | 1.30 | **+30%** | $1300 |
| **Novartis** | 1.32 | **+32%** | $1320 |
| **Bayer** | 1.35 | **+35%** | $1350 |
| **Roche** | 1.40 | **+40%** | $1400 |

---

## 🎬 EJEMPLO PRÁCTICO COMPLETO

### Producto: Ibuprofeno 400mg
**Precio base en datos: $2,500**

#### Cliente A: Elige Laprof
```
Precio base:        $2,500
Multiplicador:      0.82  (18% descuento)
─────────────────────────
PRECIO FINAL:       $2,050  ✅ Ahorró $450
```

#### Cliente B: Elige MK  
```
Precio base:        $2,500
Multiplicador:      1.30  (30% más caro)
─────────────────────────
PRECIO FINAL:       $3,250  ⬆️ Pagó $750 más
```

#### Cliente C: Elige Cronofen
```
Precio base:        $2,500
Multiplicador:      1.00  (precio normal)
─────────────────────────
PRECIO FINAL:       $2,500  ➡️ Precio base
```

---

## 📋 RANGO COMPLETO DE PRECIOS

Si tienes un producto a **$3,000** y cambias el laboratorio:

```
LABORATORIO         MULTIPLICADOR    PRECIO FINAL
────────────────────────────────────────────────
Genérico            0.75             $2,250    ← MÁS BARATO
DE                  0.70             $2,100    ← EXTREMADAMENTE BARATO
Económica           0.72             $2,160
Lafrancol           0.80             $2,400
Laprof              0.82             $2,460
Genfar              0.90             $2,700
Cronofen            1.00             $3,000    ← NORMAL
Takeda              1.08             $3,240
Sanofi              1.10             $3,300
GSK                 1.12             $3,360
J&J                 1.15             $3,450
Abbott              1.25             $3,750
Pfizer              1.28             $3,840
MK                  1.30             $3,900
Novartis            1.32             $3,960
Bayer               1.35             $4,050
Roche               1.40             $4,200    ← MÁS CARO
────────────────────────────────────────────────
RANGO: De $2,100 a $4,200 (95% más caro)
```

---

## 🔄 IMPACTO EN COMPRAS

### Escenario: Cliente compra 10 unidades

| Laboratorio | Precio/unidad | Total compra |
|---|---|---|
| Laprof ✅ | $2,460 | **$24,600** |
| Cronofen | $3,000 | $30,000 |
| MK | $3,900 | $39,000 |
| **Diferencia** | — | **$14,400** (59% más caro en MK) |

---

## 🎨 ESTRATEGIA DE PRECIOS

### ¿Por qué estos multiplicadores?

**Laboratorios genéricos (descuentos):**
- Son productos "commodity" (commoditizados)
- Competencia alta → márgenes bajos
- Atraer clientes sensibles al precio

**Marcas intermedias (~10-15% más caro):**
- Buena calidad pero no premium
- Margen normal del sector
- Posicionamiento de "buen valor"

**Marcas premium (25-40% más caro):**
- Reconocimiento de marca
- Mayor calidad/confianza del cliente
- Mayor margen de ganancia

---

## ⚡ CASOS DE USO

### Caso 1: Cliente busca precio más bajo
→ Ve 6 laboratorios diferentes
→ Lafrancol y Laprof más baratos
→ Ahorra $450 en una compra típica

### Caso 2: Cliente busca marca de confianza  
→ Ve MK, Roche, Bayer
→ Paga 30-40% más pero obtiene reconocimiento de marca
→ Ganancia de margen para la droguería

### Caso 3: Cliente quiere equilibrio precio-calidad
→ Ve Genfar (10% descuento) o Cronofen (precio normal)
→ Opción intermedia entre genérico y premium

---

## 🔧 EDITAR LOS MULTIPLICADORES

**Ubicación:** `js/laboratorio-precios.js` líneas 23-42

**Ejemplos de cambios:**

### Hacer MK aún más premium (50% más caro):
```javascript
'MK': 1.50,  // cambiar de 1.30
```

### Promover Laprof con mayor descuento:
```javascript
'Laprof': 0.75,  // cambiar de 0.82 (más barato que antes)
```

### Agregar nuevo laboratorio:
```javascript
'MygenMed': 0.85,  // 15% descuento
```

### Temporalmente para Black Friday:
```javascript
// Temporalmente bajar TODOS los precios
'Genérico': 0.60,  // normalmente 0.75
'Laprof': 0.70,    // normalmente 0.82
'MK': 1.10,        // normalmente 1.30
```

---

## 📊 ANÁLISIS DE MARGEN

**Ejemplo con Acetaminofén 500mg:**

Si tu costo de compra es $500 y vendes a estos precios:

| Laboratorio | Venta | Ganancia | Margen % |
|---|---|---|---|
| Laprof | $2,460 | $1,960 | 80% ↓ |
| Genfar | $2,700 | $2,200 | 81% |
| Cronofen | $3,000 | $2,500 | 83% ✓ |
| Novartis | $3,960 | $3,460 | 87% ↑ |
| Roche | $4,200 | $3,700 | 88% ↑↑ |

→ **Genéricos**: margen menor pero volumen alto
→ **Premium**: margen mayor pero volumen bajo

---

## ✅ VALIDACIÓN RÁPIDA

Abre DevTools Console (F12) y ejecuta:

```javascript
// Verificar que funciona
calcularPrecioLaboratorio(3000, 'Laprof')  // Debe retornar 2460
calcularPrecioLaboratorio(3000, 'MK')      // Debe retornar 3900
calcularPrecioLaboratorio(3000, 'Cronofen') // Debe retornar 3000

// Ver todos los multiplicadores
obtenerRangoLaboratorios()  // Muestra lista ordenada
```

---

**Tabla actualizada:** 6 de junio de 2026  
**Todos los multiplicadores en producción:** ✅ ACTIVOS
