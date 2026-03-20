"""
Audit qualité des données — à exécuter depuis la racine du projet.
Usage : python3 scripts/audit_qualite.py
"""
import json
from collections import defaultdict

errors = []
warnings = []

# 1. Charger les données
with open('public/data/candidats-evolution.json') as f:
    elections = json.load(f)

with open('public/data/familles-evolution.json') as f:
    familles = json.load(f)

FAMILLES_VALIDES = {'extreme_gauche', 'gauche', 'centre', 'droite', 'extreme_droite', 'divers'}

# 2. Candidats significatifs classés "divers"
print("=== Candidats >5% classés 'divers' ===")
for e in elections:
    for c in e['candidats']:
        if c['famille'] == 'divers' and c['pourcentage'] > 5:
            nom = f"{c.get('prenom') or ''} {c.get('nom') or ''}".strip() or c['nuance']
            msg = f"  {e['id_election']:22s} {nom:30s} {c['pourcentage']}% -> divers"
            print(msg)
            warnings.append(msg)

# 3. Cohérence temporelle
print("\n=== Cohérence temporelle (même candidat, familles différentes) ===")
candidat_familles = defaultdict(lambda: defaultdict(set))
for e in elections:
    for c in e['candidats']:
        if c['pourcentage'] > 2:
            nom = (c.get('nom') or '').upper()
            if nom and nom != 'NAN':
                candidat_familles[nom][c['famille']].add(e['id_election'])
for nom, fams in sorted(candidat_familles.items()):
    if len(fams) > 1:
        details = ', '.join(f"{f} ({', '.join(sorted(ids))})" for f, ids in sorted(fams.items()))
        msg = f"  {nom}: {details}"
        print(msg)
        errors.append(msg)

# 4. Somme des familles
print("\n=== Somme familles != ~100% ===")
for e in familles:
    total = sum(e.get(f, 0) for f in FAMILLES_VALIDES)
    if abs(total - 100) > 0.2:
        msg = f"  {e['id_election']:22s} total={total:.1f}%"
        print(msg)
        errors.append(msg)

# 5. Familles invalides
print("\n=== Familles invalides ===")
for e in elections:
    for c in e['candidats']:
        if c['famille'] not in FAMILLES_VALIDES:
            msg = f"  {e['id_election']} : famille '{c['famille']}' inconnue"
            print(msg)
            errors.append(msg)

# 6. Candidats >2% sans nom
print("\n=== Candidats >2% sans nom identifiable ===")
for e in elections:
    for c in e['candidats']:
        if c['pourcentage'] > 2:
            nom = f"{c.get('prenom') or ''} {c.get('nom') or ''}".strip()
            if not nom or nom == 'nan':
                msg = f"  {e['id_election']:22s} nuance={c['nuance']:8s} {c['pourcentage']}% -> nom inconnu"
                print(msg)
                warnings.append(msg)

# Résumé
print(f"\n{'='*50}")
print(f"Erreurs : {len(errors)}")
print(f"Avertissements : {len(warnings)}")
if not errors and not warnings:
    print("Aucun probleme detecte")
