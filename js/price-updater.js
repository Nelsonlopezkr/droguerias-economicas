/**
 * Price Updater - Droguerías Económicas
 * Fase 1-7: Extrae datos de Informe.html y actualiza productos-data.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ============================================================================
// FASE 1: EXTRAE DATOS EXISTENTES DE productos-data.js
// ============================================================================

function extractExistingProducts() {
  const dataFile = path.join(__dirname, 'productos-data.js');
  let content = fs.readFileSync(dataFile, 'utf8');
  
  // Remove 'use strict' and comments, extract array
  content = content.replace(/^'use strict';/, '');
  content = content.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Extract CATALOGO array
  const catalogMatch = content.match(/const\s+CATALOGO\s*=\s*(\[[\s\S]*?\]);/);
  if (!catalogMatch) throw new Error('Could not find CATALOGO array');
  
  const catalogStr = catalogMatch[1];
  const CATALOGO = eval('(' + catalogStr + ')');
  
  console.log(`✓ Productos existentes: ${CATALOGO.length}`);
  return CATALOGO;
}

// ============================================================================
// FASE 2: EXTRAE DATOS DE Informe.html
// ============================================================================

function extractFromInforme() {
  const informeFile = path.join(__dirname, '..', 'Informe.html');
  const content = fs.readFileSync(informeFile, 'utf8');
  
  // Extract all table rows
  const rowRegex = /<tr[\s\S]*?<\/tr>/g;
  const rows = content.match(rowRegex) || [];
  
  if (rows.length < 2) throw new Error('No rows found in Informe.html');
  
  const products = [];
  
  // Skip first row (header is actually row 2)
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    
    // Extract cells - look for <td...>content</td>
    const cellRegex = /<td[^>]*>[\s\S]*?<\/td>/g;
    const cells = row.match(cellRegex) || [];
    
    if (cells.length < 8) continue; // Skip incomplete rows
    
    // Extract text from each cell (remove HTML tags and clean)
    const getCellText = (cell) => {
      let text = cell.replace(/<td[^>]*>|<\/td>/g, '');
      text = text.replace(/<[^>]*>/g, ''); // Remove all tags
      text = text.replace(/&nbsp;/g, ' ');
      text = text.replace(/\s+/g, ' ').trim();
      return text;
    };
    
    try {
      const barcode = getCellText(cells[0]); // CODIGO_BARRAS
      const nombre = getCellText(cells[1]); // NOMBRE_PRODUCTO
      const fabricante = getCellText(cells[2]); // FABRICANTE
      const categoria = getCellText(cells[3]); // CATEGORIA
      const ubicacion = getCellText(cells[4]); // UBICACION
      const cantidadLote = getCellText(cells[5]); // CANTIDAD_LOTE
      const invima = getCellText(cells[6]); // INVIMA
      const presentacionesPvp = getCellText(cells[7]); // PRESENTACIONES_PVP
      
      if (!barcode || !nombre || !presentacionesPvp) continue;
      
      products.push({
        barcode,
        nombre,
        fabricante,
        categoria,
        ubicacion,
        cantidadLote,
        invima,
        presentacionesPvp
      });
    } catch (e) {
      // Skip malformed rows
    }
  }
  
  console.log(`✓ Productos en Informe.html: ${products.length}`);
  return products;
}

// ============================================================================
// PARSE PRESENTACIONES_PVP: "UNIDAD PVP: $ 6500" -> {tipo: "UNIDAD", precio: 6500}
// ============================================================================

function parsePresentacionesPvp(pvpText) {
  if (!pvpText) return [];
  
  const presentaciones = [];
  
  // Match patterns like "UNIDAD PVP: $ 6500", "BLISTER PVP: $2500", etc.
  const regex = /([A-Z\s]+?)\s+PVP:\s*\$\s*([\d.,]+)/gi;
  let match;
  
  while ((match = regex.exec(pvpText)) !== null) {
    const tipo = match[1].trim();
    const precioStr = match[2].replace(/[.,]/g, '');
    const precio = parseInt(precioStr, 10);
    
    if (!isNaN(precio) && precio > 0) {
      presentaciones.push({
        tipo: tipo,
        precio: precio
      });
    }
  }
  
  return presentaciones;
}

// ============================================================================
// FASE 3: EMPAREJAMIENTO - Busca coincidencias
// ============================================================================

function matchProducts(existingProducts, informeProducts) {
  const matches = [];
  const unmatched = [];
  const stats = {
    byBarcode: 0,
    byName: 0,
    byFabricante: 0,
    unmatched: 0
  };
  
  for (const informeProduct of informeProducts) {
    let found = false;
    
    // Prioridad 1: Por código de barras
    for (const existing of existingProducts) {
      if (!existing.barcodes) continue;
      
      const barcodes = Array.isArray(existing.barcodes) 
        ? existing.barcodes 
        : [existing.barcodes];
      
      for (const barcode of informeProduct.barcode.split('-')) {
        if (barcodes.includes(barcode)) {
          matches.push({
            existingId: existing.id,
            informeData: informeProduct,
            matchType: 'barcode'
          });
          stats.byBarcode++;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    
    if (!found) {
      // Prioridad 2: Por nombre exacto + laboratorio
      const searchName = informeProduct.nombre.toUpperCase().trim();
      const searchFab = informeProduct.fabricante.toUpperCase().trim();
      
      for (const existing of existingProducts) {
        const existingName = (existing.nombre || '').toUpperCase().trim();
        
        // Check if name matches
        if (existingName.includes(searchName) || searchName.includes(existingName)) {
          // Check if fabricante matches in any laboratory
          let labMatches = false;
          if (existing.laboratorios) {
            for (const labKey in existing.laboratorios) {
              const lab = existing.laboratorios[labKey];
              if (lab.nombre && lab.nombre.toUpperCase().includes(searchFab)) {
                labMatches = true;
                break;
              }
            }
          }
          
          if (labMatches) {
            matches.push({
              existingId: existing.id,
              informeData: informeProduct,
              matchType: 'nameAndFab'
            });
            stats.byName++;
            found = true;
            break;
          }
        }
      }
    }
    
    if (!found) {
      unmatched.push(informeProduct);
      stats.unmatched++;
    }
  }
  
  console.log(`✓ Coincidencias encontradas:
  - Por código de barras: ${stats.byBarcode}
  - Por nombre + laboratorio: ${stats.byName}
  - No coincidencias: ${stats.unmatched}`);
  
  return { matches, unmatched, stats };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    console.log('='.repeat(70));
    console.log('DROGUERÍAS ECONÓMICAS - PRICE UPDATER');
    console.log('='.repeat(70));
    console.log();
    
    // FASE 1
    console.log('FASE 1: Extrayendo productos existentes...');
    const existing = extractExistingProducts();
    console.log();
    
    // FASE 2
    console.log('FASE 2: Extrayendo datos de Informe.html...');
    const informe = extractFromInforme();
    console.log();
    
    // Test parsing
    console.log('Prueba de parseo de presentaciones:');
    const testCases = [
      'UNIDAD PVP: $ 6500',
      'BLISTER PVP: $2500',
      'CAJA PVP: $50000',
      'BOTELLA PVP: $10600',
      'PAR PVP: $8300',
      'UNIDAD PVP: $ 6500 CAJA PVP: $50000'
    ];
    for (const testCase of testCases) {
      const parsed = parsePresentacionesPvp(testCase);
      console.log(`  "${testCase}" -> ${JSON.stringify(parsed)}`);
    }
    console.log();
    
    // FASE 3
    console.log('FASE 3: Emparejando productos...');
    const { matches, unmatched, stats } = matchProducts(existing, informe);
    console.log();
    
    // Summary
    console.log('RESUMEN:');
    console.log(`  Productos existentes: ${existing.length}`);
    console.log(`  Productos en Informe: ${informe.length}`);
    console.log(`  Coincidencias encontradas: ${matches.length}`);
    console.log(`  Sin coincidencia: ${unmatched.length}`);
    console.log();
    
    console.log('✓ Fase de análisis completada. Listo para actualizar.');
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

main();
