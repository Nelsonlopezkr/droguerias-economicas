#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Price Updater - Phase 4: Advanced Matching by Name & Laboratory
Uses fuzzy matching since barcodes are not in productos-data.js
"""

import re
import json
from pathlib import Path
from collections import defaultdict
from html.parser import HTMLParser
from difflib import SequenceMatcher

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
            
            products.append({
                'barcodes': [b.strip() for b in barcodes_str.split('-')],
                'nombre': nombre,
                'fabricante': fabricante,
                'categoria': categoria,
                'presentacionesPvp': presentaciones_pvp,
                'presentaciones': presentaciones
            })
        except (IndexError, AttributeError):
            continue
    
    return products

def parse_pvp_text(pvp_text):
    """Parsea "UNIDAD PVP: $ 6500" y variantes"""
    presentaciones = {}
    
    for part in re.split(r'\|\|', pvp_text):
        part = part.strip()
        
        # Match "TIPO PVP: $ precio"
        match = re.search(r'^([A-Za-z\s]+?)\s+PVP:\s*\$\s*([\d.,]+)$', part)
        if match:
            tipo = match.group(1).strip().upper()
            precio_str = match.group(2).replace(',', '').replace('.', '')
            try:
                precio = int(precio_str)
                if precio > 0:
                    presentaciones[tipo] = precio
            except ValueError:
                pass
    
    return presentaciones

def extract_js_products():
    """Extrae productos del archivo JavaScript"""
    datafile = Path(__file__).parent / 'productos-data.js'
    
    with open(datafile, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Buscar objetos de productos
    products = []
    
    # Regex para encontrar objetos con id
    pattern = r'\{\s*id:\s*(\d+),\s*nombre:\s*["\']([^"\']+)["\']'
    matches = re.finditer(pattern, content)
    
    for match in matches:
        prod_id = int(match.group(1))
        nombre = match.group(2)
        
        # Encontrar el laboratorio principal (primera ocurrencia de 'nombre:')
        # dentro de 'laboratorios:'
        start_pos = match.start()
        
        # Buscar hacia adelante para encontrar laboratorios
        end_pos = min(start_pos + 5000, len(content))
        prod_section = content[start_pos:end_pos]
        
        # Extraer laboratorios
        labs = re.findall(r'nombre:\s*["\']([^"\']+)["\']', prod_section[:2000])
        
        products.append({
            'id': prod_id,
            'nombre': nombre,
            'laboratories': labs[1:] if len(labs) > 1 else [],  # Skip the product name itself
            'raw_section': prod_section[:2000]
        })
    
    return products

def similarity_score(str1, str2):
    """Calcula similitud entre dos strings"""
    str1 = str1.upper().strip()
    str2 = str2.upper().strip()
    
    # Exact match
    if str1 == str2:
        return 1.0
    
    # Substring match
    if str1 in str2 or str2 in str1:
        return 0.9
    
    # Use SequenceMatcher
    return SequenceMatcher(None, str1, str2).ratio()

def find_best_match(informe_prod, js_products, threshold=0.7):
    """Encuentra el mejor match para un producto del Informe en los productos JS"""
    best_match = None
    best_score = 0
    
    informe_nombre = informe_prod['nombre'].upper()
    informe_fab = informe_prod['fabricante'].upper()
    
    for js_prod in js_products:
        js_nombre = js_prod['nombre'].upper()
        
        # Score 1: Similitud de nombre
        name_score = similarity_score(informe_nombre, js_nombre)
        
        # Score 2: Laboratorio
        lab_score = 0
        for lab in js_prod['laboratories']:
            lab_score = max(lab_score, similarity_score(informe_fab, lab))
        
        # Score combinado: 70% nombre, 30% laboratorio
        combined_score = name_score * 0.7 + lab_score * 0.3
        
        if combined_score > best_score and combined_score >= threshold:
            best_score = combined_score
            best_match = (js_prod, combined_score)
    
    return best_match

def main():
    print('=' * 70)
    print('DROGUERÍAS ECONÓMICAS - PRICE UPDATER PHASE 4')
    print('Advanced Matching by Name & Laboratory')
    print('=' * 70)
    print()
    
    try:
        # Extract products
        print('[1] Extrayendo productos de Informe.html...')
        informe_products = extract_informe_products()
        print(f'    ✓ {len(informe_products)} productos únicos')
        print()
        
        print('[2] Extrayendo productos de productos-data.js...')
        js_products = extract_js_products()
        print(f'    ✓ {len(js_products)} productos encontrados')
        print()
        
        # Match products
        print('[3] Emparejando productos (fuzzy matching)...')
        matches = []
        unmatched = []
        
        for i, informe_prod in enumerate(informe_products):
            if i % 100 == 0:
                print(f'    Procesando {i}/{len(informe_products)}...', end='\r')
            
            result = find_best_match(informe_prod, js_products, threshold=0.6)
            if result:
                js_prod, score = result
                matches.append({
                    'js_id': js_prod['id'],
                    'js_nombre': js_prod['nombre'],
                    'informe_nombre': informe_prod['nombre'],
                    'informe_fabricante': informe_prod['fabricante'],
                    'informe_presentaciones': informe_prod['presentaciones'],
                    'score': score
                })
            else:
                unmatched.append(informe_prod)
        
        print(f'    ✓ Emparejamiento completado     ')
        print()
        
        # Statistics
        print('[4] ESTADÍSTICAS:')
        print(f'    Coincidencias encontradas: {len(matches)}')
        print(f'    Sin coincidencia: {len(unmatched)}')
        print(f'    Porcentaje de emparejamiento: {100*len(matches)/len(informe_products):.1f}%')
        print()
        
        # Score distribution
        if matches:
            scores = [m['score'] for m in matches]
            print('    Distribución de scores de similitud:')
            print(f'      Score > 0.9: {len([s for s in scores if s > 0.9])}')
            print(f'      Score 0.8-0.9: {len([s for s in scores if 0.8 <= s <= 0.9])}')
            print(f'      Score 0.7-0.8: {len([s for s in scores if 0.7 <= s <= 0.8])}')
            print(f'      Score 0.6-0.7: {len([s for s in scores if 0.6 <= s <= 0.7])}')
        print()
        
        # Show samples
        print('[5] EJEMPLOS DE COINCIDENCIAS:')
        for i, match in enumerate(matches[:5]):
            print(f'    {i+1}. Score: {match["score"]:.2f}')
            print(f'       JS: {match["js_nombre"][:50]}')
            print(f'       Informe: {match["informe_nombre"][:50]} ({match["informe_fabricante"]})')
            print(f'       Precios: {json.dumps(match["informe_presentaciones"], ensure_ascii=False)[:80]}')
        print()
        
        print('[6] EJEMPLOS DE SIN COINCIDENCIA:')
        for i, prod in enumerate(unmatched[:5]):
            print(f'    {i+1}. {prod["nombre"][:60]} ({prod["fabricante"]})')
        print()
        
        # Save matches
        matches_file = Path(__file__).parent / 'matches_phase4.json'
        with open(matches_file, 'w', encoding='utf-8') as f:
            json.dump(matches, f, indent=2, ensure_ascii=False)
        
        print(f'    ✓ Coincidencias guardadas: matches_phase4.json')
        print()
        print('✓ Phase 4 completada')
        
    except Exception as e:
        print(f'✗ Error: {e}')
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
