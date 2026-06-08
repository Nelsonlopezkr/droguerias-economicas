#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Quick Informe Analysis - Direct approach
"""

import re
from pathlib import Path
from collections import defaultdict

def extract_from_informe():
    """Extrae usando regex directo en lugar de HTMLParser"""
    informe_file = Path(__file__).parent.parent / 'Informe.html'
    
    with open(informe_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract PRESENTACIONES_PVP column values
    # They están in <td class="s0">TIPO PVP: $ precio</td>
    
    # Find all presentacion_pvp values by looking for text between <td> tags
    # in the context of rows
    
    # Use a simpler approach: find all instances of "PVP: $"
    pvp_pattern = r'([\w\s]+?)\s+PVP:\s*\$\s*([\d.,]+)'
    matches = re.findall(pvp_pattern, content)
    
    return matches

def main():
    print('=' * 70)
    print('DROGUERÍAS ECONÓMICAS - INFORME QUICK ANALYSIS')
    print('=' * 70)
    print()
    
    print('[1] Extrayendo presentaciones y precios...')
    matches = extract_from_informe()
    
    print(f'    ✓ {len(matches)} presentaciones/precios encontrados')
    print()
    
    # Analyze
    presentation_types = defaultdict(list)
    
    for tipo, precio_str in matches:
        tipo = tipo.strip().upper()
        precio_str = precio_str.replace(',', '').replace('.', '')
        try:
            precio = int(precio_str)
            if precio > 0:
                presentation_types[tipo].append(precio)
        except:
            pass
    
    print('[2] TIPOS DE PRESENTACIÓN DETECTADOS:')
    print()
    
    for tipo in sorted(presentation_types.keys(), 
                       key=lambda x: len(presentation_types[x]), reverse=True):
        prices = presentation_types[tipo]
        print(f'    • {tipo}')
        print(f'      Cantidad: {len(prices)} productos')
        print(f'      Rango: ${min(prices):,} - ${max(prices):,}')
        print(f'      Promedio: ${sum(prices) // len(prices):,}')
        print()
    
    print('[3] RESUMEN:')
    print(f'    Total de presentaciones diferentes: {len(presentation_types)}')
    print(f'    Total de registro precio: {len(matches)}')
    print()
    
    print('✓ Análisis completado')

if __name__ == '__main__':
    main()
