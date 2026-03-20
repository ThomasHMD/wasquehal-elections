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

# Family mapping — 117 nuance codes couverts
nuance_mapping = {
    # --- Gauche ---
    'EXG': 'extreme_gauche', 'LFI': 'gauche', 'COM': 'gauche', 'FI': 'gauche',
    'ECO': 'gauche', 'SOC': 'gauche', 'DVG': 'gauche', 'RDG': 'gauche',
    'UG': 'gauche', 'NUP': 'gauche', 'FG': 'gauche', 'VEC': 'gauche',
    'DXG': 'extreme_gauche', 'GAU': 'gauche',
    # Candidats présidentiels gauche
    'HOLL': 'gauche', 'JOSP': 'gauche', 'TAUB': 'gauche',
    'LAGU': 'extreme_gauche', 'MELE': 'extreme_gauche', 'MEGR': 'extreme_gauche',
    'BESA': 'extreme_gauche', 'BUFF': 'extreme_gauche', 'HUE': 'gauche',
    'BOVE': 'gauche', 'JOLY': 'gauche', 'ARTH': 'extreme_gauche',
    'POUT': 'extreme_gauche', 'GLUC': 'extreme_gauche',
    # Codes législatives préfixe L — gauche
    'LDVG': 'gauche', 'LSOC': 'gauche', 'LCOM': 'gauche', 'LFG': 'gauche',
    'LEXG': 'extreme_gauche', 'LDG': 'gauche', 'LUG': 'gauche', 'LUGE': 'gauche',
    'LECO': 'gauche', 'LVEC': 'gauche', 'LVEG': 'gauche', 'LVE': 'gauche',
    'LFI': 'gauche', 'LGA': 'gauche', 'LXG': 'extreme_gauche',
    'LO': 'extreme_gauche', 'LCR': 'extreme_gauche', 'LPS': 'gauche',
    'LEPA': 'gauche', 'LEPE': 'gauche',
    # Binômes cantonaux gauche
    'BC-SOC': 'gauche', 'BC-FG': 'gauche', 'BC-UGE': 'gauche', 'BC-VEC': 'gauche',

    # --- Centre ---
    'REM': 'centre', 'ENS': 'centre', 'MDM': 'centre', 'DVC': 'centre',
    'UC': 'centre', 'HOR': 'centre', 'CEN': 'centre', 'UDF': 'centre',
    'UDFD': 'centre', 'NCE': 'centre', 'MNA': 'centre',
    # Candidats présidentiels centre
    'BAYR': 'centre', 'MADE': 'centre', 'SCHI': 'centre',
    # Codes législatives préfixe L — centre
    'LREM': 'centre', 'LENS': 'centre', 'LCMD': 'centre', 'LDV': 'centre',
    'LPC': 'centre', 'LUDF': 'centre', 'LUC': 'centre',

    # --- Droite ---
    'LR': 'droite', 'DVD': 'droite', 'UDI': 'droite', 'UD': 'droite',
    'UMP': 'droite', 'DTE': 'droite', 'CPNT': 'droite',
    # Candidats présidentiels droite
    'SARK': 'droite', 'CHIR': 'droite', 'MAME': 'droite',
    'DUPO': 'droite', 'BOUT': 'droite', 'NIHO': 'droite',
    'VILL': 'droite', 'PREP': 'droite', 'VOYN': 'droite',
    'CHEV': 'droite', 'CHEM': 'droite', 'ROYA': 'gauche',
    # Codes législatives préfixe L — droite
    'LDVD': 'droite', 'LLR': 'droite', 'LUMP': 'droite', 'LDR': 'droite',
    'LUD': 'droite', 'LCOP': 'droite', 'LCP': 'droite', 'LMAJ': 'droite',
    'LDD': 'droite', 'LDLF': 'droite',
    # Binômes cantonaux droite
    'BC-UD': 'droite',

    # --- Extrême droite ---
    'RN': 'extreme_droite', 'REC': 'extreme_droite', 'EXD': 'extreme_droite',
    'FN': 'extreme_droite', 'MNR': 'extreme_droite', 'FRN': 'extreme_droite',
    'SAIN': 'extreme_droite', 'LAUT': 'extreme_droite',
    # Codes législatives préfixe L — extrême droite
    'LFN': 'extreme_droite', 'LRN': 'extreme_droite', 'LREC': 'extreme_droite',
    'LEXD': 'extreme_droite', 'LXD': 'extreme_droite',
    # Binômes cantonaux extrême droite
    'BC-FN': 'extreme_droite', 'BC-RN': 'extreme_droite',

    # --- Divers ---
    'DIV': 'divers', 'REG': 'divers', 'DSV': 'divers', 'M-NC': 'divers',
    'LDIV': 'divers', 'LDSV': 'divers',
}

# Fallback : mapping par nom de candidat (présidentielles 2017/2022 sans nuance)
candidat_famille_mapping = {
    # 2017
    'MACRON': 'centre', 'LE PEN': 'extreme_droite', 'FILLON': 'droite',
    'MÉLENCHON': 'gauche', 'HAMON': 'gauche', 'DUPONT-AIGNAN': 'droite',
    'LASSALLE': 'divers', 'POUTOU': 'extreme_gauche', 'ARTHAUD': 'extreme_gauche',
    'ASSELINEAU': 'divers', 'CHEMINADE': 'divers',
    # 2022
    'ZEMMOUR': 'extreme_droite', 'PÉCRESSE': 'droite', 'JADOT': 'gauche',
    'HIDALGO': 'gauche', 'ROUSSEL': 'gauche',
}

def get_famille(nuance, nom=None):
    if pd.isna(nuance) or nuance == '' or nuance == 'nan':
        if nom and nom in candidat_famille_mapping:
            return candidat_famille_mapping[nom]
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
        # Convertir NaN pandas en None
        nom = None if pd.isna(nom_val) else str(nom_val).strip() or None
        prenom = None if pd.isna(prenom_val) else str(prenom_val).strip() or None
        candidats_list.append({
            "nom": nom,
            "prenom": prenom,
            "nuance": str(c_row.get('nuance', '')),
            "famille": get_famille(str(c_row.get('nuance', '')), nom),
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
