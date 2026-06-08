#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Price Updater - Fast extraction and basic analysis
"""

import re
from pathlib import Path
from html.parser import HTMLParser
from collections import defaultdict

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

def extract_informe_data():
    """Extrae todos los datos del Informe.html"""
    informe_file = Path(__file__).parent.parent / 'Informe.html'
    
    with open(informe_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    parser = TableParser()
    parser.feed(html_content)
    
    products = []
    
    # Las primeras dos filas son encabezados, comenzar desde la tercera
    for row in parser.rows[2:]:
        if len(row) < 8:
            continue
        
        try:
            barcode = row[0].strip()
            nombre = row[1].strip()
            fabricante = row[2].strip()
            categoria = row[3].strip()
            ubicacion = row[4].strip()
            cantidad_lote = row[5].strip()
            invima = row[6].strip()
            presentaciones_pvp = row[7].strip()
            
            if barcode and nombre and presentaciones_pvp:
                products.append({
                    'barcode': barcode,
                    'nombre': nombre,
                    'fabricante': fabricante,
                    'categoria': categoria,
                    'ubicacion': ubicacion,
                    'invima': invima,
                    'presentaciones_pvp': presentaciones_pvp
                })
        except (IndexError, AttributeError):
            continue
    
    return products

def parse_pvp(pvp_text):
    """Parsea presentaciones PVP"""
    result = {}
    
    # Manejar múltiples presentaciones
    for part in re.split(r'\|\||;', pvp_text):
        part = part.strip()
        
        # Match "TIPO PVP: $ precio"
        match = re.search(r'^([A-Za-z\s]+?)\s+PVP:\s*\$\s*([\d.,]+)$', part)
        if match:
            tipo = match.group(1).strip()
            precio_str = match.group(2).replace(',', '').replace('.', '')
            try:
                precio = int(precio_str)
                if precio > 0:
                    result[tipo] = precio
            except ValueError:
                pass
    
    return result

def main():
    print('=' * 70)
    print('DROGUERÍAS ECONÓMICAS - EXTRACCIÓN DE DATOS')
    print('=' * 70)
    print()
    
    print('Extrayendo datos de Informe.html...')
    products = extract_informe_data()
    print(f'✓ Productos extraídos: {len(products)}')
    print()
    
    # Análisis
    print('ANÁLISIS:')
    print(f'  Total de productos: {len(products)}')
    
    # Categorías
    cats = defaultdict(int)
    for p in products:
        cats[p['categoria']] += 1
    
    print(f'  Categorías: {len(cats)}')
    for cat, count in sorted(cats.items(), key=lambda x: x[1], reverse=True):
        print(f'    - {cat}: {count}')
    
    print()
    
    # Fabricantes
    mfgs = defaultdict(int)
    for p in products:
        mfgs[p['fabricante']] += 1
    
    print(f'  Fabricantes: {len(mfgs)}')
    print('  Top 10:')
    for mfg, count in sorted(mfgs.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f'    - {mfg}: {count}')
    
    print()
    
    # Presentaciones
    pvps = defaultdict(list)
    for p in products:
        parsed = parse_pvp(p['presentaciones_pvp'])
        for tipo, precio in parsed.items():
            pvps[tipo].append(precio)
    
    print(f'  Tipos de presentación: {len(pvps)}')
    for tipo in sorted(pvps.keys()):
        prices = pvps[tipo]
        print(f'    - {tipo}: {len(prices)} productos, precio promedio ${sum(prices)/len(prices):,.0f}')
    
    print()
    print('✓ Extracción completada')
    
    # Guardar resumen
    with open('/tmp/informe_summary.txt', 'w', encoding='utf-8') as f:
        f.write(f'Total productos: {len(products)}\n')
        f.write(f'Categorías: {len(cats)}\n')
        f.write(f'Fabricantes: {len(mfgs)}\n')
        f.write(f'Tipos de presentación: {len(pvps)}\n')

if __name__ == '__main__':
    main()
