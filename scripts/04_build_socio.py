"""
Build socio-iris.json from real INSEE IRIS data (millésime 2021).
Requires: pandas, openpyxl
Sources in data/raw/insee/:
  - base-ic-evol-struct-pop-2021.xlsx   → population, age
  - base-ic-diplomes-formation-2021.xlsx → diplomes
  - base-ic-activite-residents-2021.xlsx → CSP, chomage
  - BASE_TD_FILO_IRIS_2021_DISP.xlsx    → revenus, pauvrete
  - base-ic-logement-2021.xlsx          → logement
"""
import pandas as pd
import json
import os

COMMUNE = '59646'
INSEE_DIR = 'data/raw/insee'
OUT = 'data/processed/socio-iris.json'
os.makedirs('data/processed', exist_ok=True)


def safe(val):
    """Convert to float, returning None for non-numeric ('ns', NaN, etc.)."""
    try:
        if isinstance(val, str):
            val = val.replace(',', '.').strip()
            if val in ('ns', 's', 'nd', ''):
                return None
        v = float(val)
        return v if pd.notna(v) else None
    except (ValueError, TypeError):
        return None


def pct(num, den):
    n, d = safe(num), safe(den)
    if n is None or d is None or d == 0:
        return None
    return round(n / d * 100, 2)


print("Loading INSEE data...")

# 1. Population & age
df_pop = pd.read_excel(f'{INSEE_DIR}/base-ic-evol-struct-pop-2021.xlsx',
                        sheet_name='IRIS', header=5, dtype={'IRIS': str})
df_pop = df_pop[df_pop['IRIS'].str.startswith(COMMUNE)]

# 2. Diplomes
df_dipl = pd.read_excel(f'{INSEE_DIR}/base-ic-diplomes-formation-2021.xlsx',
                         sheet_name='IRIS', header=5, dtype={'IRIS': str})
df_dipl = df_dipl[df_dipl['IRIS'].str.startswith(COMMUNE)]

# 3. Activité & CSP
df_act = pd.read_excel(f'{INSEE_DIR}/base-ic-activite-residents-2021.xlsx',
                        sheet_name='IRIS', header=5, dtype={'IRIS': str})
df_act = df_act[df_act['IRIS'].str.startswith(COMMUNE)]

# 4. Filosofi (revenus)
df_filo = pd.read_excel(f'{INSEE_DIR}/BASE_TD_FILO_IRIS_2021_DISP.xlsx',
                         sheet_name='IRIS_DISP', header=5, dtype={'IRIS': str})
df_filo = df_filo[df_filo['IRIS'].str.startswith(COMMUNE)]

# 5. Logement
df_log = pd.read_excel(f'{INSEE_DIR}/base-ic-logement-2021.xlsx',
                        sheet_name='IRIS', header=5, dtype={'IRIS': str})
df_log = df_log[df_log['IRIS'].str.startswith(COMMUNE)]

print(f"Found {len(df_pop)} IRIS for commune {COMMUNE}")

# Index by IRIS code
pop = df_pop.set_index('IRIS')
dipl = df_dipl.set_index('IRIS')
act = df_act.set_index('IRIS')
filo = df_filo.set_index('IRIS')
log = df_log.set_index('IRIS')

results = []

for iris_code in pop.index:
    p = pop.loc[iris_code]
    d = dipl.loc[iris_code]
    a = act.loc[iris_code]
    f = filo.loc[iris_code] if iris_code in filo.index else pd.Series()
    l = log.loc[iris_code]

    population = safe(p.get('P21_POP'))

    # Age: compute % < 25 and % >= 65
    pop_total = safe(p.get('P21_POP'))
    # < 25 = 0-14 + 15-24 (approx via P21_POP0014 + part of P21_POP1529)
    # More precisely: P21_POP0002 + P21_POP0305 + P21_POP0610 + P21_POP1117 + P21_POP1824
    pop_0024 = sum(filter(None, [
        safe(p.get('P21_POP0002')), safe(p.get('P21_POP0305')),
        safe(p.get('P21_POP0610')), safe(p.get('P21_POP1117')),
        safe(p.get('P21_POP1824'))
    ]))
    pop_65p = safe(p.get('P21_POP65P'))

    # Estimate median age from age brackets (weighted midpoints)
    brackets = [
        ('P21_POP0002', 1), ('P21_POP0305', 4), ('P21_POP0610', 8),
        ('P21_POP1117', 14), ('P21_POP1824', 21), ('P21_POP2539', 32),
        ('P21_POP4054', 47), ('P21_POP5564', 59.5), ('P21_POP6579', 72),
        ('P21_POP80P', 85)
    ]
    weighted_sum = 0
    total_pop_brackets = 0
    for col, mid in brackets:
        v = safe(p.get(col))
        if v:
            weighted_sum += v * mid
            total_pop_brackets += v
    age_moyen = round(weighted_sum / total_pop_brackets, 1) if total_pop_brackets > 0 else None

    # Diplomes: % sans diplome et % superieur parmi non-scolaires 15+
    nscol15p = safe(d.get('P21_NSCOL15P'))
    diplmin = safe(d.get('P21_NSCOL15P_DIPLMIN'))
    sup = sum(filter(None, [
        safe(d.get('P21_NSCOL15P_SUP2')),
        safe(d.get('P21_NSCOL15P_SUP34')),
        safe(d.get('P21_NSCOL15P_SUP5'))
    ]))

    # CSP among active 15-64
    act_total = safe(a.get('C21_ACT1564'))
    cadres = safe(a.get('C21_ACT1564_CS3'))      # CS3 = cadres et professions intellectuelles
    ouvriers = safe(a.get('C21_ACT1564_CS6'))     # CS6 = ouvriers
    employes = safe(a.get('C21_ACT1564_CS5'))     # CS5 = employes

    # Chomage: P21_CHOM1564 / P21_ACT1564
    chom = safe(a.get('P21_CHOM1564'))
    act1564 = safe(a.get('P21_ACT1564'))

    # Revenus
    revenu_med = safe(f.get('DISP_MED21')) if not f.empty else None
    taux_pauv = safe(f.get('DISP_TP6021')) if not f.empty else None

    # Logement
    rp = safe(l.get('P21_RP'))
    prop = safe(l.get('P21_RP_PROP'))
    hlm = safe(l.get('P21_RP_LOCHLMV'))

    results.append({
        "code_iris": str(iris_code),
        "nom_iris": str(p.get('LIBIRIS', f'IRIS {iris_code}')),
        "population": round(population) if population else 0,
        "age_median": age_moyen,
        "pct_moins_25": pct(pop_0024, pop_total),
        "pct_plus_65": pct(pop_65p, pop_total),
        "revenu_median": round(revenu_med) if revenu_med else None,
        "taux_pauvrete": round(taux_pauv, 2) if taux_pauv else None,
        "pct_cadres": pct(cadres, act_total),
        "pct_ouvriers": pct(ouvriers, act_total),
        "pct_employes": pct(employes, act_total),
        "pct_sans_diplome": pct(diplmin, nscol15p),
        "pct_superieur": pct(sup, nscol15p),
        "pct_proprietaires": pct(prop, rp),
        "pct_logement_social": pct(hlm, rp),
        "taux_chomage": pct(chom, act1564),
    })

with open(OUT, 'w', encoding='utf-8') as fp:
    json.dump(results, fp, ensure_ascii=False, indent=2)

print(f"Wrote {OUT} with {len(results)} IRIS")
for r in results:
    print(f"  {r['code_iris']} {r['nom_iris']}: pop={r['population']}, rev={r['revenu_median']}, pauv={r['taux_pauvrete']}%")
