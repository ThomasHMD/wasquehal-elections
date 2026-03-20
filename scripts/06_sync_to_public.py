"""
Sync data/processed/ → public/data/
- Copy socio-iris.json, bv-iris-mapping.json, participation.json, elections.json
- Split elections.json into individual files in public/data/elections/
- Regenerate familles-evolution.json from elections.json
"""
import json
import os
import shutil
from collections import defaultdict

SRC = 'data/processed'
DST = 'public/data'

os.makedirs(f'{DST}/elections', exist_ok=True)

# 1. Copy simple files
for fname in ['socio-iris.json', 'bv-iris-mapping.json', 'participation.json', 'elections.json']:
    src_path = f'{SRC}/{fname}'
    if os.path.exists(src_path):
        shutil.copy2(src_path, f'{DST}/{fname}')
        print(f"Copied {fname}")

# 2. Split elections.json into individual files
with open(f'{SRC}/elections.json', encoding='utf-8') as f:
    elections = json.load(f)

by_id = defaultdict(list)
for entry in elections:
    by_id[entry['id_election']].append(entry)

# Remove old election files
for f in os.listdir(f'{DST}/elections'):
    os.remove(f'{DST}/elections/{f}')

for id_el, entries in by_id.items():
    with open(f'{DST}/elections/{id_el}.json', 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False, separators=(',', ':'))

print(f"Split {len(by_id)} election files")

# 3. Regenerate familles-evolution.json
familles_data = []
for id_el, entries in sorted(by_id.items()):
    total_voix = 0
    famille_voix = defaultdict(int)
    first = entries[0]

    for bv in entries:
        for c in bv['candidats']:
            total_voix += c['voix']
            famille_voix[c['famille']] += c['voix']

    if total_voix == 0:
        continue

    ALL_FAMILLES = ['extreme_gauche', 'gauche', 'centre', 'droite', 'extreme_droite', 'divers']
    point = {
        "scrutin": first['scrutin'],
        "annee": first['annee'],
        "tour": first['tour'],
        "id_election": id_el,
        "total_voix": total_voix,
    }
    # Always include ALL families (0 if absent) so Recharts stacks correctly
    for fam in ALL_FAMILLES:
        point[fam] = round(famille_voix.get(fam, 0) / total_voix * 100, 2)

    familles_data.append(point)

with open(f'{DST}/familles-evolution.json', 'w', encoding='utf-8') as f:
    json.dump(familles_data, f, ensure_ascii=False, indent=2)

print(f"Generated familles-evolution.json with {len(familles_data)} entries")
