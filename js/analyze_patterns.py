#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Price Updater - Extract and Analyze Informe.html for Price Patterns
Goal: Extract presentation types, price ranges, and update strategies
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
    """Extrae todos los productos y analiza presentaciones"""
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
            nombre = row[1].strip()
            fabricante = row[2].strip()
            categoria = row[3].strip()
            presentaciones_pvp = row[7].strip()
            
            if not nombre or not presentaciones_pvp:
                continue
            
            # Parsear presentaciones
            presentaciones = parse_pvp_text(presentaciones_pvp)
            
            if presentaciones:
                products.append({
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

def analyze_patterns(products):
    """Analiza patrones de precios y presentaciones"""
    
    # Presentación types
    presentation_types = defaultdict(list)
    
    # Categories
    categories = defaultdict(list)
    
    # Price ranges
    price_ranges = {}
    
    for prod in products:
        cat = prod['categoria']
        categories[cat].append(prod)
        
        for tipo, precio in prod['presentaciones'].items():
            presentation_types[tipo].append(precio)
            
            if cat not in price_ranges:
                price_ranges[cat] = {'min': precio, 'max': precio, 'count': 0}
            else:
                price_ranges[cat]['min'] = min(price_ranges[cat]['min'], precio)
                price_ranges[cat]['max'] = max(price_ranges[cat]['max'], precio)
            
            price_ranges[cat]['count'] += 1
    
    return presentation_types, categories, price_ranges

def generate_update_strategy(presentation_types, categories, price_ranges):
    """Genera estrategia de actualización"""
    
    strategy = {
        'presentation_types': {},
        'categories': [],
        'price_recommendations': {}
    }
    
    # Presentation types y sus estadísticas
    for tipo, prices in presentation_types.items():
        prices_sorted = sorted(prices)
        strategy['presentation_types'][tipo] = {
            'count': len(prices),
            'min_price': min(prices),
            'max_price': max(prices),
            'avg_price': sum(prices) // len(prices),
            'median_price': prices_sorted[len(prices) // 2]
        }
    
    # Category analysis
    for cat, prods in categories.items():
        strategy['categories'].append({
            'name': cat,
            'product_count': len(prods),
            'price_range': price_ranges.get(cat, {})
        })
    
    return strategy

def main():
    print('=' * 70)
    print('DROGUERÍAS ECONÓMICAS - INFORME ANALYSIS')
    print('Extracting Price Patterns for Update Strategy')
    print('=' * 70)
    print()
    
    try:
        # Extract
        print('[1] Extrayendo datos de Informe.html...')
        products = extract_informe_products()
        print(f'    ✓ {len(products)} productos con presentaciones y precios')
        print()
        
        # Analyze
        print('[2] Analizando patrones de precios y presentaciones...')
        presentation_types, categories, price_ranges = analyze_patterns(products)
        print(f'    ✓ {len(presentation_types)} tipos de presentación detectados')
        print(f'    ✓ {len(categories)} categorías encontradas')
        print()
        
        # Generate strategy
        print('[3] Generando estrategia de actualización...')
        strategy = generate_update_strategy(presentation_types, categories, price_ranges)
        print()
        
        # Display findings
        print('[4] TIPOS DE PRESENTACIÓN DETECTADOS:')
        for tipo, stats in sorted(strategy['presentation_types'].items(), 
                                   key=lambda x: x[1]['count'], reverse=True):
            print(f'    • {tipo}')
            print(f'      Cantidad: {stats["count"]} productos')
            print(f'      Rango: ${stats["min_price"]:,} - ${stats["max_price"]:,}')
            print(f'      Promedio: ${stats["avg_price"]:,}')
            print()
        
        print('[5] CATEGORÍAS CON MÁS PRODUCTOS:')
        for cat_data in sorted(strategy['categories'], 
                               key=lambda x: x['product_count'], reverse=True)[:15]:
            print(f'    • {cat_data["name"]}: {cat_data["product_count"]} productos')
        print()
        
        # Save strategy
        strategy_file = Path(__file__).parent / 'informe_strategy.json'
        with open(strategy_file, 'w', encoding='utf-8') as f:
            json.dump(strategy, f, indent=2, ensure_ascii=False)
        
        print(f'    ✓ Estrategia guardada: informe_strategy.json')
        print()
        
        # Summary
        print('[6] RESUMEN PARA ACTUALIZACIÓN MANUAL:')
        print()
        print('RECOMENDACIONES:')
        print()
        print('1. PRESENTACIONES ESTÁNDAR A USAR:')
        presentation_list = sorted(strategy['presentation_types'].items(), 
                                    key=lambda x: x[1]['count'], reverse=True)[:8]
        for i, (tipo, stats) in enumerate(presentation_list, 1):
            print(f'   {i}. {tipo} (~${stats["avg_price"]:,})')
        
        print()
        print('2. ESTRATEGIA POR CATEGORÍA:')
        for cat_data in sorted(strategy['categories'], 
                               key=lambda x: x['product_count'], reverse=True)[:10]:
            pr = cat_data['price_range']
            if pr:
                print(f'   • {cat_data["name"]}:')
                print(f'     Rango de precios: ${pr.get("min", 0):,} - ${pr.get("max", 0):,}')
                print(f'     Productos: {cat_data["product_count"]}')
        
        print()
        print('3. PASOS PARA ACTUALIZAR productos-data.js:')
        print('   a) Abrir productos-data.js en editor')
        print('   b) Para cada producto:')
        print('      - Seleccionar presentaciones relevantes del listado anterior')
        print('      - Actualizar precios según rangos de categoría')
        print('      - Mantener laboratorios existentes')
        print('      - NO cambiar estructura o IDs')
        print()
        print('✓ Análisis completado')
        
    except Exception as e:
        print(f'✗ Error: {e}')
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
