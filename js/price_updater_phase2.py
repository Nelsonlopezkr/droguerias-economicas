#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Price Updater Phase 2 - Droguerías Económicas
Better extraction and matching
"""

import re
import json
from pathlib import Path

def extract_js_objects():
    """Extrae objetos JavaScript del archivo productos-data.js"""
    datafile = Path(__file__).parent / 'productos-data.js'
    
    with open(datafile, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all product objects (starts with { and id: N)
    # This is a more robust approach
    objects = []
    
    # Split by major sections
    lines = content.split('\n')
    current_obj = []
    brace_count = 0
    in_object = False
    
    for line in lines:
        # Count braces to track objects
        open_braces = line.count('{')
        close_braces = line.count('}')
        
        if '{' in line and 'id:' in line:
            in_object = True
            brace_count = 1
            current_obj = [line]
        elif in_object:
            current_obj.append(line)
            brace_count += open_braces - close_braces
            
            if brace_count <= 0:
                # End of object
                obj_str = '\n'.join(current_obj)
                try:
                    # Convert to JSON-compatible format
                    obj_str = obj_str.strip()
                    if obj_str.endswith(','):
                        obj_str = obj_str[:-1]
                    
                    # Try to extract ID
                    id_match = re.search(r'id:\s*(\d+)', obj_str)
                    if id_match:
                        objects.append(obj_str)
                except:
                    pass
                
                current_obj = []
                in_object = False
                brace_count = 0
    
    print(f'✓ Objetos de productos extraídos: {len(objects)}')
    return objects

def extract_barcodes_from_js(obj_str):
    """Extrae códigos de barras de un objeto JavaScript"""
    barcodes = []
    
    # Look for barcodes field (es un array o string)
    bc_match = re.search(r'barcodes?\s*:\s*(\[[^\]]*\]|["\']([^"\']*)["\'])', obj_str, re.IGNORECASE)
    if bc_match:
        if '[' in bc_match.group(1):
            # Es un array
            codes = re.findall(r'["\']([^"\']+)["\']', bc_match.group(1))
            barcodes.extend(codes)
        else:
            # Es un string
            code = bc_match.group(2)
            if code:
                barcodes.append(code)
    
    return barcodes

def extract_from_informe():
    """Extrae productos de Informe.html"""
    informe_file = Path(__file__).parent.parent / 'Informe.html'
    
    with open(informe_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    rows = re.findall(r'<tr[\s\S]*?</tr>', content)
    
    if len(rows) < 2:
        raise ValueError('No rows found in Informe.html')
    
    products = []
    
    for i in range(2, len(rows)):
        row = rows[i]
        cells = re.findall(r'<td[^>]*>[\s\S]*?</td>', row)
        
        if len(cells) < 8:
            continue
        
        def get_cell_text(cell):
            text = re.sub(r'<td[^>]*>|</td>', '', cell)
            text = re.sub(r'<[^>]*>', '', text)
            text = re.sub(r'&nbsp;', ' ', text)
            text = re.sub(r'\s+', ' ', text).strip()
            return text
        
        try:
            barcode = get_cell_text(cells[0])
            nombre = get_cell_text(cells[1])
            fabricante = get_cell_text(cells[2])
            categoria = get_cell_text(cells[3])
            presentaciones_pvp = get_cell_text(cells[7])
            
            if not barcode or not nombre or not presentaciones_pvp:
                continue
            
            products.append({
                'barcode': barcode,
                'nombre': nombre,
                'fabricante': fabricante,
                'categoria': categoria,
                'presentacionesPvp': presentaciones_pvp
            })
        except:
            continue
    
    return products

def parse_presentaciones_pvp(pvp_text):
    """Parsea "UNIDAD PVP: $ 6500" -> [{'tipo': 'UNIDAD', 'precio': 6500}]"""
    if not pvp_text:
        return []
    
    presentaciones = []
    
    # Manejar múltiples presentaciones separadas por || o similares
    for part in re.split(r'\|\||;|,', pvp_text):
        part = part.strip()
        
        # Match pattern like "UNIDAD PVP: $ 6500"
        match = re.search(r'([A-Z\s]+?)\s+PVP:\s*\$\s*([\d.,]+)', part, re.IGNORECASE)
        if match:
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

def find_matches(informe_products):
    """Encuentra coincidencias en el archivo productos-data.js"""
    datafile = Path(__file__).parent / 'productos-data.js'
    
    with open(datafile, 'r', encoding='utf-8') as f:
        content = f.read()
    
    matches = []
    unmatched = []
    
    for informe_prod in informe_products:
        found = False
        
        # Obtener códigos de barras del producto del informe
        informe_barcodes = informe_prod['barcode'].split('-')
        
        # Buscar coincidencias por código de barras
        for barcode in informe_barcodes:
            # Buscar este código en el archivo
            pattern = r'["\']' + re.escape(barcode) + r'["\']'
            if re.search(pattern, content):
                matches.append({
                    'informe': informe_prod,
                    'matchType': 'barcode'
                })
                found = True
                break
        
        if not found:
            unmatched.append(informe_prod)
    
    return matches, unmatched

# ============================================================================
# MAIN
# ============================================================================

def main():
    print('=' * 70)
    print('DROGUERÍAS ECONÓMICAS - PRICE UPDATER PHASE 2')
    print('=' * 70)
    print()
    
    try:
        # Extract existing products metadata
        print('Extrayendo estructura de productos existentes...')
        js_objects = extract_js_objects()
        print()
        
        # Extract from informe
        print('Extrayendo datos de Informe.html...')
        informe = extract_from_informe()
        print(f'✓ Productos en Informe: {len(informe)}')
        print()
        
        # Find matches
        print('Buscando coincidencias...')
        matches, unmatched = find_matches(informe)
        print(f'✓ Coincidencias encontradas: {len(matches)}')
        print(f'✓ Sin coincidencia: {len(unmatched)}')
        print()
        
        # Show statistics by category
        print('Productos sin coincidencia por categoría:')
        categories = {}
        for prod in unmatched:
            cat = prod.get('categoria', 'DESCONOCIDA')
            if cat not in categories:
                categories[cat] = 0
            categories[cat] += 1
        
        for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f'  {cat}: {count}')
        
        print()
        print('Ejemplos de productos sin coincidencia:')
        for prod in unmatched[:5]:
            print(f'  • {prod["nombre"][:50]}... ({prod["fabricante"]})')
        
        print()
        print('✓ Análisis de coincidencias completado.')
        
        # Save report
        report = {
            'total_js_objects': len(js_objects),
            'total_informe_products': len(informe),
            'matches_found': len(matches),
            'unmatched': len(unmatched),
            'match_percentage': round(100 * len(matches) / len(informe), 2) if informe else 0
        }
        
        print()
        print('REPORTE:')
        print(json.dumps(report, indent=2, ensure_ascii=False))
        
    except Exception as e:
        print(f'✗ Error: {e}')
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
