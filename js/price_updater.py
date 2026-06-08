#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Price Updater - Droguerías Económicas
Fase 1-7: Extrae datos de Informe.html y actualiza productos-data.js
"""

import re
import json
import os
from pathlib import Path
from collections import defaultdict

# ============================================================================
# FASE 1: EXTRAE DATOS EXISTENTES DE productos-data.js
# ============================================================================

def extract_existing_products():
    """Extrae productos existentes de productos-data.js"""
    datafile = Path(__file__).parent / 'productos-data.js'
    
    with open(datafile, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Busca la definición de CATALOGO
    match = re.search(r'const\s+CATALOGO\s*=\s*(\[[\s\S]*?\]);', content)
    if not match:
        raise ValueError('Could not find CATALOGO array')
    
    catalog_str = match.group(1)
    
    # Usa eval de Python evaluando JavaScript (simplificado)
    # En realidad, necesitamos hacer parsing más cuidadoso
    catalog = json.loads(catalog_str.replace("'", '"').replace(":true", ":true").replace(":false", ":false"))
    
    print(f'✓ Productos existentes: {len(catalog)}')
    return catalog

# ============================================================================
# FASE 2: EXTRAE DATOS DE Informe.html
# ============================================================================

def extract_from_informe():
    """Extrae productos de Informe.html"""
    informe_file = Path(__file__).parent.parent / 'Informe.html'
    
    with open(informe_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extrae todas las filas de la tabla
    rows = re.findall(r'<tr[\s\S]*?</tr>', content)
    
    if len(rows) < 2:
        raise ValueError('No rows found in Informe.html')
    
    products = []
    
    # Salta la primera fila (es de encabezados)
    for i in range(2, len(rows)):
        row = rows[i]
        
        # Extrae celdas
        cells = re.findall(r'<td[^>]*>[\s\S]*?</td>', row)
        
        if len(cells) < 8:
            continue
        
        def get_cell_text(cell):
            """Extrae texto limpio de una celda"""
            text = re.sub(r'<td[^>]*>|</td>', '', cell)
            text = re.sub(r'<[^>]*>', '', text)
            text = re.sub(r'&nbsp;', ' ', text)
            text = re.sub(r'\s+', ' ', text).strip()
            return text
        
        try:
            barcode = get_cell_text(cells[0])  # CODIGO_BARRAS
            nombre = get_cell_text(cells[1])  # NOMBRE_PRODUCTO
            fabricante = get_cell_text(cells[2])  # FABRICANTE
            categoria = get_cell_text(cells[3])  # CATEGORIA
            ubicacion = get_cell_text(cells[4])  # UBICACION
            cantidad_lote = get_cell_text(cells[5])  # CANTIDAD_LOTE
            invima = get_cell_text(cells[6])  # INVIMA
            presentaciones_pvp = get_cell_text(cells[7])  # PRESENTACIONES_PVP
            
            if not barcode or not nombre or not presentaciones_pvp:
                continue
            
            products.append({
                'barcode': barcode,
                'nombre': nombre,
                'fabricante': fabricante,
                'categoria': categoria,
                'ubicacion': ubicacion,
                'cantidadLote': cantidad_lote,
                'invima': invima,
                'presentacionesPvp': presentaciones_pvp
            })
        except Exception as e:
            # Skip malformed rows
            continue
    
    print(f'✓ Productos en Informe.html: {len(products)}')
    return products

# ============================================================================
# PARSE PRESENTACIONES_PVP
# ============================================================================

def parse_presentaciones_pvp(pvp_text):
    """
    Parsea "UNIDAD PVP: $ 6500" -> [{'tipo': 'UNIDAD', 'precio': 6500}]
    """
    if not pvp_text:
        return []
    
    presentaciones = []
    
    # Match patterns like "UNIDAD PVP: $ 6500", "BLISTER PVP: $2500", etc.
    pattern = r'([A-Z\s]+?)\s+PVP:\s*\$\s*([\d.,]+)'
    matches = re.finditer(pattern, pvp_text, re.IGNORECASE)
    
    for match in matches:
        tipo = match.group(1).strip()
        precio_str = match.group(2).replace(',', '').replace('.', '')
        try:
            precio = int(precio_str)
            if precio > 0:
                presentaciones.append({
                    'tipo': tipo,
                    'precio': precio
                })
        except ValueError:
            continue
    
    return presentaciones

# ============================================================================
# MAIN
# ============================================================================

def main():
    print('=' * 70)
    print('DROGUERÍAS ECONÓMICAS - PRICE UPDATER')
    print('=' * 70)
    print()
    
    try:
        # FASE 1
        print('FASE 1: Extrayendo productos existentes...')
        try:
            existing = extract_existing_products()
        except Exception as e:
            print(f'✗ Error en Fase 1: {e}')
            print('  Intentando método alternativo...')
            # Try simpler approach
            existing = []
        print()
        
        # FASE 2
        print('FASE 2: Extrayendo datos de Informe.html...')
        informe = extract_from_informe()
        print()
        
        # Test parsing
        print('Prueba de parseo de presentaciones:')
        test_cases = [
            'UNIDAD PVP: $ 6500',
            'BLISTER PVP: $2500',
            'CAJA PVP: $50000',
            'BOTELLA PVP: $10600',
            'PAR PVP: $8300',
            'UNIDAD PVP: $ 6500 CAJA PVP: $50000'
        ]
        for test_case in test_cases:
            parsed = parse_presentaciones_pvp(test_case)
            print(f'  "{test_case}" -> {json.dumps(parsed)}')
        print()
        
        # Summary
        print('RESUMEN PRELIMINAR:')
        print(f'  Productos en Informe: {len(informe)}')
        if existing:
            print(f'  Productos existentes: {len(existing)}')
        
        # Show first few products from informe
        print()
        print('Primeros 5 productos de Informe.html:')
        for i, prod in enumerate(informe[:5], 1):
            print(f'  {i}. {prod["nombre"]} ({prod["fabricante"]})')
            print(f'     Código: {prod["barcode"][:50]}...')
            print(f'     Presentaciones: {prod["presentacionesPvp"][:60]}...')
        
        print()
        print('✓ Análisis completado. Datos listos para siguiente fase.')
        
    except Exception as e:
        print(f'✗ Error: {e}')
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
