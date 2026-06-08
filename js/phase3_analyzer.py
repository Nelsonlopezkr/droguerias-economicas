#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Price Updater - Phase 3: Extract, Match, and Update
"""

import re
import json
from pathlib import Path
from collections import defaultdict
from html.parser import HTMLParser

class TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows = []
        self.current_row = []
        self.in_table = False
        self.in_td = False
        self.td_content = []
        
    def handle_starttag(self, tag, attrs):
        if tag == 'table':
            self.in_table = True
        elif tag == 'tr' and self.in_table:
            self.current_row = []
        elif tag in ('td', 'th') and self.in_table:
            self.in_td = True
            self.td_content = []
            
    def handle_endtag(self, tag):
        if tag == 'table':
            self.in_table = False
        elif tag == 'tr' and self.in_table:
            if self.current_row:
                self.rows.append(self.current_row)
        elif tag in ('td', 'th') and self.in_td:
            self.in_td = False
            content = ''.join(self.td_content).strip()
            self.current_row.append(content)
            
    def handle_data(self, data):
        if self.in_td:
            self.td_content.append(data)

def extract_informe_products():
    """Extrae todos los productos del Informe.html"""
    informe_file = Path(__file__).parent.parent / 'Informe.html'
    
    with open(informe_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    parser = TableParser()
    parser.feed(html_content)
    
    products_by_barcode = {}
    products = []
    
    for row in parser.rows[2:]:  # Skip header rows
        if len(row) < 8:
            continue
        
        try:
            barcodes_str = row[0].strip()
            nombre = row[1].strip()
            fabricante = row[2].strip()
            categoria = row[3].strip()
            presentaciones_pvp = row[7].strip()
            
            if not barcodes_str or not nombre or not presentaciones_pvp:
                continue
            
            # Parsear múltiples presentaciones y precios
            presentaciones = parse_pvp_text(presentaciones_pvp)
            
            # Guardar por cada barcode
            for barcode in barcodes_str.split('-'):
                barcode = barcode.strip()
                if barcode:
                    products_by_barcode[barcode] = {
                        'nombre': nombre,
                        'fabricante': fabricante,
                        'categoria': categoria,
                        'presentacionesPvp': presentaciones_pvp,
                        'presentaciones': presentaciones
                    }
            
            products.append({
                'barcodes': barcodes_str.split('-'),
                'nombre': nombre,
                'fabricante': fabricante,
                'categoria': categoria,
                'presentacionesPvp': presentaciones_pvp,
                'presentaciones': presentaciones
            })
        except (IndexError, AttributeError):
            continue
    
    return products_by_barcode, products

def parse_pvp_text(pvp_text):
    """Parsea "UNIDAD PVP: $ 6500" y variantes"""
    presentaciones = {}
    
    for part in re.split(r'\|\|', pvp_text):
        part = part.strip()
        
        # Match "TIPO PVP: $ precio"
        match = re.search(r'^([A-Za-z\s]+?)\s+PVP:\s*\$\s*([\d.,]+)$', part)
        if match:
            tipo = match.group(1).strip()
            precio_str = match.group(2).replace(',', '').replace('.', '')
            try:
                precio = int(precio_str)
                if precio > 0:
                    presentaciones[tipo] = precio
            except ValueError:
                pass
    
    return presentaciones

def extract_barcodes_from_js_file():
    """Extrae todos los barcodes del archivo productos-data.js"""
    datafile = Path(__file__).parent / 'productos-data.js'
    
    with open(datafile, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Buscar patrones de barcodes
    # Los barcodes suelen estar en un array: barcodes: ['...', '...']
    barcodes_pattern = r'barcodes?\s*:\s*(\[[^\]]*\]|["\']([^"\']*)["\'])'
    
    all_barcodes = set()
    matches = re.finditer(barcodes_pattern, content, re.IGNORECASE)
    
    for match in matches:
        if '[' in match.group(1):
            # Es un array
            codes = re.findall(r'["\']([^"\']+)["\']', match.group(1))
            all_barcodes.update(codes)
        else:
            # Es un string
            code = match.group(2)
            if code:
                all_barcodes.add(code)
    
    return all_barcodes

def analyze_matches(js_barcodes, informe_by_barcode):
    """Analiza qué productos pueden ser emparejados"""
    matches = {}
    unmatched = defaultdict(list)
    
    for barcode in js_barcodes:
        if barcode in informe_by_barcode:
            matches[barcode] = informe_by_barcode[barcode]
    
    for barcode, prod in informe_by_barcode.items():
        if barcode not in matches:
            unmatched[prod['categoria']].append(prod)
    
    return matches, unmatched

# ============================================================================
# MAIN
# ============================================================================

def main():
    print('=' * 70)
    print('DROGUERÍAS ECONÓMICAS - PRICE UPDATER PHASE 3')
    print('=' * 70)
    print()
    
    try:
        # Extract Informe
        print('[1] Extrayendo productos de Informe.html...')
        informe_by_barcode, informe_products = extract_informe_products()
        print(f'    ✓ {len(informe_products)} productos únicos')
        print(f'    ✓ {len(informe_by_barcode)} códigos de barras')
        print()
        
        # Extract JS barcodes
        print('[2] Extrayendo barcodes de productos-data.js...')
        js_barcodes = extract_barcodes_from_js_file()
        print(f'    ✓ {len(js_barcodes)} códigos de barras encontrados')
        print()
        
        # Analyze matches
        print('[3] Analizando coincidencias...')
        matches, unmatched = analyze_matches(js_barcodes, informe_by_barcode)
        print(f'    ✓ Coincidencias encontradas: {len(matches)}')
        print(f'    ✓ Sin coincidencia: {sum(len(v) for v in unmatched.values())}')
        print()
        
        # Show statistics
        print('[4] ESTADÍSTICAS:')
        print()
        print('    Productos sin coincidencia por categoría:')
        for cat, prods in sorted(unmatched.items(), key=lambda x: len(x[1]), reverse=True)[:15]:
            print(f'      - {cat}: {len(prods)} productos')
        print()
        
        # Show sample matches
        print('[5] EJEMPLOS DE COINCIDENCIAS:')
        for i, (barcode, prod) in enumerate(list(matches.items())[:5]):
            print(f'    {i+1}. Barcode: {barcode}')
            print(f'       Nombre: {prod["nombre"][:60]}')
            print(f'       Precios: {json.dumps(prod["presentaciones"], ensure_ascii=False)}')
        print()
        
        # Save results for next phase
        results = {
            'matches_count': len(matches),
            'unmatched_count': sum(len(v) for v in unmatched.values()),
            'match_percentage': round(100 * len(matches) / len(informe_by_barcode), 2) if informe_by_barcode else 0
        }
        
        print('[6] RESUMEN:')
        print(f'    Porcentaje de coincidencias: {results["match_percentage"]}%')
        print(f'    Productos con precio actualizable: {len(matches)}')
        print(f'    Productos sin corresponder: {results["unmatched_count"]}')
        print()
        
        # Save matches to file for next phase
        matches_file = Path(__file__).parent / 'matches.json'
        with open(matches_file, 'w', encoding='utf-8') as f:
            # Convert dict to JSON-serializable format
            matches_serializable = {
                barcode: {
                    'nombre': prod['nombre'],
                    'fabricante': prod['fabricante'],
                    'categoria': prod['categoria'],
                    'presentacionesPvp': prod['presentacionesPvp'],
                    'presentaciones': prod['presentaciones']
                }
                for barcode, prod in matches.items()
            }
            json.dump(matches_serializable, f, indent=2, ensure_ascii=False)
        
        print(f'    ✓ Archivo de coincidencias guardado: matches.json')
        print()
        print('✓ Phase 3 completada. Listo para actualizar productos-data.js')
        
    except Exception as e:
        print(f'✗ Error: {e}')
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
