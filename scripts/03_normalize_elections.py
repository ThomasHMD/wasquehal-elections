import pandas as pd
import json
import os

# Create directories if they don't exist
os.makedirs('data/processed', exist_ok=True)

print("Loading general results...")
df_gen = pd.read_csv('data/raw/elections/general_results_wasquehal.csv', sep=';', dtype=str)
print("Loading candidates results...")
df_cand = pd.read_csv('data/raw/elections/candidats_results_wasquehal.csv', sep=';', dtype=str)

print("Normalizing data...")

# Convert numeric columns
for col in ['inscrits', 'votants', 'abstentions', 'blancs', 'nuls', 'exprimes']:
    df_gen[col] = pd.to_numeric(df_gen[col], errors='coerce').fillna(0).astype(int)

df_cand['voix'] = pd.to_numeric(df_cand['voix'], errors='coerce').fillna(0).astype(int)
df_cand['ratio_voix_exprimes'] = pd.to_numeric(df_cand['ratio_voix_exprimes'], errors='coerce').fillna(0.0)

# Chargement du mapping depuis le fichier JSON éditable
mapping_path = os.path.join(os.path.dirname(__file__), 'nuance-famille-mapping.json')
with open(mapping_path, encoding='utf-8') as f:
    _mapping = json.load(f)

# Fusion des nuances génériques + codes présidentiels en un seul dict
nuance_mapping = {**_mapping['nuances'], **_mapping['codes_presidentiels']}
candidat_famille_mapping = _mapping['candidats_presidentiels']
tete_liste_famille_mapping = _mapping['tetes_de_liste']

def get_famille(nuance, nom=None, tete_liste=None):
    if pd.isna(nuance) or nuance == '' or nuance == 'nan':
        if nom and nom in candidat_famille_mapping:
            return candidat_famille_mapping[nom]
        if tete_liste and tete_liste in tete_liste_famille_mapping:
            return tete_liste_famille_mapping[tete_liste]
        return 'divers'
    return nuance_mapping.get(nuance, 'divers')

elections_list = []
participation_data = []

grouped_gen = df_gen.groupby(['id_election', 'code_bv'])

for (id_el, bv), row in grouped_gen:
    row = row.iloc[0]
    
    parts = str(id_el).split('_')
    if len(parts) < 2: continue
    
    annee = int(parts[0])
    scrutin_map = {
        'pres': 'presidentielle',
        'legi': 'legislatives',
        'muni': 'municipales',
        'euro': 'europeenne',
        'regi': 'regionales',
        'dpmt': 'departementales',
        'cant': 'cantonal',
    }
    scrutin = scrutin_map.get(parts[1], parts[1])
    
    tour = 1
    if len(parts) > 2 and parts[2].startswith('t'):
        try:
            tour = int(parts[2][1:])
        except:
            pass
            
    # Filter candidates for this election and BV
    cands_bv = df_cand[(df_cand['id_election'] == id_el) & (df_cand['code_bv'] == bv)]
    
    candidats_list = []
    for _, c_row in cands_bv.iterrows():
        nom_val = c_row.get('nom', '')
        prenom_val = c_row.get('prenom', '')
        tete_liste_val = c_row.get('nom_tete_liste', '')
        # Convertir NaN pandas en None
        nom = None if pd.isna(nom_val) else str(nom_val).strip() or None
        prenom = None if pd.isna(prenom_val) else str(prenom_val).strip() or None
        tete_liste = None if pd.isna(tete_liste_val) else str(tete_liste_val).strip() or None
        # Pour les européennes sans nom, utiliser la tête de liste
        display_nom = nom
        display_prenom = prenom
        if not nom and tete_liste:
            parts_tl = tete_liste.split(' ', 1)
            display_nom = parts_tl[0] if parts_tl else None
            display_prenom = parts_tl[1] if len(parts_tl) > 1 else None
        candidats_list.append({
            "nom": display_nom,
            "prenom": display_prenom,
            "nuance": str(c_row.get('nuance', '')),
            "famille": get_famille(str(c_row.get('nuance', '')), nom, tete_liste),
            "voix": int(c_row['voix']),
            "pourcentage": float(c_row['ratio_voix_exprimes'])
        })
        
    election_obj = {
        "id_election": id_el,
        "scrutin": scrutin,
        "annee": annee,
        "tour": tour,
        "bureau_vote": str(bv),
        "inscrits": int(row['inscrits']),
        "votants": int(row['votants']),
        "abstentions": int(row['abstentions']),
        "blancs": int(row['blancs']),
        "nuls": int(row['nuls']),
        "exprimes": int(row['exprimes']),
        "candidats": candidats_list
    }
    elections_list.append(election_obj)
    
    # Participation
    participation_data.append({
        "id_election": id_el,
        "scrutin": scrutin,
        "annee": annee,
        "tour": tour,
        "bureau_vote": str(bv),
        "taux_abstention": float((row['abstentions'] / row['inscrits'] * 100)) if row['inscrits'] > 0 else 0.0
    })

print("Exporting elections.json...")
with open('data/processed/elections.json', 'w', encoding='utf-8') as f:
    json.dump(elections_list, f, ensure_ascii=False, separators=(',', ':'))

print("Exporting participation.json...")
with open('data/processed/participation.json', 'w', encoding='utf-8') as f:
    json.dump(participation_data, f, ensure_ascii=False, separators=(',', ':'))

print("Done!")
