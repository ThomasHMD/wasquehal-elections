# Spec Qualité des Données — WasquehalElections

Ce document décrit **comment les données électorales sont construites, transformées et classées** dans le projet. Il est conçu pour qu'un LLM ou un humain puisse :

1. **Comprendre** le pipeline de bout en bout
2. **Auditer** les classements par famille politique
3. **Corriger** les erreurs en éditant un fichier JSON
4. **Ajouter** de nouvelles élections en suivant la procédure

---

## 1. Vue d'ensemble du pipeline

```
data/raw/elections/
  ├── general_results_wasquehal.csv     ← résultats par BV (inscrits, votants, etc.)
  └── candidats_results_wasquehal.csv   ← résultats par candidat par BV
        │
        ▼
scripts/03_normalize_elections.py       ← lit scripts/nuance-famille-mapping.json
        │
        ▼
data/processed/
  ├── elections.json          ← tous les scrutins normalisés
  └── participation.json      ← taux d'abstention par BV
        │
        ▼
scripts/06_sync_to_public.py
        │
        ▼
public/data/
  ├── elections/*.json              ← 1 fichier par scrutin (ex: 2022_pres_t1.json)
  ├── elections.json                ← copie complète
  ├── familles-evolution.json       ← % par famille par scrutin (agrégé)
  ├── candidats-evolution.json      ← candidats agrégés par scrutin (généré séparément)
  └── participation.json
```

### Commandes pour tout régénérer

```bash
cd WasquehalElections/

# Étape 1 : normaliser les CSV bruts → JSON
python3 scripts/03_normalize_elections.py

# Étape 2 : copier vers public/data + générer familles-evolution.json
python3 scripts/06_sync_to_public.py

# Étape 3 : régénérer candidats-evolution.json (le script inline ci-dessous)
python3 -c "
import json
from pathlib import Path

elections_dir = Path('public/data/elections')
result = []
for f in sorted(elections_dir.glob('*.json')):
    with open(f) as fh:
        bvs = json.load(fh)
    if not bvs: continue
    first = bvs[0]
    candidates = {}
    total_exprimes = 0
    for bv in bvs:
        total_exprimes += bv.get('exprimes', 0)
        for c in bv.get('candidats', []):
            key = (c.get('nom') or '', c.get('prenom') or '', c.get('nuance', ''))
            if key not in candidates:
                candidates[key] = {'nom': key[0], 'prenom': key[1], 'nuance': key[2], 'famille': c['famille'], 'voix': 0}
            candidates[key]['voix'] += c['voix']
    sorted_cands = sorted(candidates.values(), key=lambda x: -x['voix'])
    for c in sorted_cands:
        c['pourcentage'] = round(c['voix'] / total_exprimes * 100, 2) if total_exprimes > 0 else 0
    result.append({
        'id_election': first['id_election'], 'scrutin': first['scrutin'],
        'annee': first['annee'], 'tour': first['tour'],
        'total_exprimes': total_exprimes, 'candidats': sorted_cands,
    })
with open('public/data/candidats-evolution.json', 'w') as fh:
    json.dump(result, fh, ensure_ascii=False)
print(f'Generated {len(result)} elections')
"

# Étape 4 : rebuild le frontend
npm run build
```

---

## 2. Sources de données brutes

### 2.1 Fichiers CSV électoraux

Les CSV proviennent de **data.gouv.fr** — dataset ["Données des élections agrégées"](https://www.data.gouv.fr/fr/datasets/donnees-des-elections-agregees/), filtrés pour la commune 59646 (Wasquehal).

#### `general_results_wasquehal.csv` (séparateur `;`)

| Colonne | Description |
|---------|-------------|
| `id_election` | Identifiant unique. Format : `YYYY_type_tN` (ex: `2022_pres_t1`) |
| `code_commune` | Toujours `59646` pour Wasquehal |
| `code_bv` | Numéro du bureau de vote (ex: `0001` à `0016`) |
| `inscrits` | Nombre d'inscrits sur les listes électorales |
| `votants` | Nombre de votants |
| `abstentions` | = inscrits - votants |
| `blancs` | Votes blancs |
| `nuls` | Votes nuls |
| `exprimes` | = votants - blancs - nuls |

#### `candidats_results_wasquehal.csv` (séparateur `;`)

| Colonne | Description | Rempli pour |
|---------|-------------|-------------|
| `id_election` | Même format que ci-dessus | Toujours |
| `code_bv` | Bureau de vote | Toujours |
| `nuance` | Code nuance politique (ex: `LFI`, `RN`, `LEPE`) | Variable (voir §3) |
| `nom` | Nom de famille du candidat | Variable |
| `prenom` | Prénom du candidat | Variable |
| `nom_tete_liste` | Nom de la tête de liste (listes) | Européennes seulement |
| `liste` | Nom abrégé de la liste | Européennes seulement |
| `voix` | Nombre de voix obtenues | Toujours |
| `ratio_voix_exprimes` | % des exprimés | Toujours |
| `binome` | Nom du binôme (départementales) | Départementales seulement |

### 2.2 Couverture des données par élection

Ce tableau montre **quelles colonnes sont remplies** pour chaque type d'élection. C'est critique pour comprendre pourquoi certaines élections nécessitent des fallbacks.

| id_election | Nuance | Nom | Tête de liste | Méthode de résolution famille |
|-------------|--------|-----|---------------|-------------------------------|
| `1999_euro_t1` | ✅ | ✅ | ❌ | Nuance directe |
| `2001_cant_t1/t2` | ✅ | ✅ | ❌ | Nuance directe |
| `2002_pres_t1/t2` | ✅ (codes raccourcis: CHIR, LEPE...) | ✅ | ❌ | Via `codes_presidentiels` |
| `2002_legi_t1/t2` | ✅ | ✅ | ❌ | Nuance directe |
| `2004_euro_t1` | ✅ (préfixe L: LCP, LDG...) | ✅ | ❌ | Nuance directe |
| `2004_regi_t1/t2` | ✅ | ✅ | ❌ | Nuance directe |
| `2007_pres_t1/t2` | ✅ (codes raccourcis) | ✅ | ❌ | Via `codes_presidentiels` |
| `2007_legi_t1/t2` | ✅ | ✅ | ❌ | Nuance directe |
| `2008_cant_t1/t2` | ✅ | ✅ | ❌ | Nuance directe |
| `2009_euro_t1` | ✅ (préfixe L) | ✅ | ❌ | Nuance directe |
| `2010_regi_t1/t2` | ✅ (préfixe L) | ✅ | ❌ | Nuance directe |
| `2012_pres_t1/t2` | ✅ (codes raccourcis) | ✅ | ❌ | Via `codes_presidentiels` |
| `2012_legi_t1/t2` | ✅ | ✅ | ❌ | Nuance directe |
| `2014_euro_t1` | ✅ (préfixe L) | ✅ | ❌ | Nuance directe |
| `2014_muni_t1/t2` | ✅ (préfixe L) | ✅ | ❌ | Nuance directe |
| `2015_dpmt_t1/t2` | ✅ (BC-SOC, BC-FN...) | ❌ | ❌ | Via `nuances` (binômes) |
| `2015_regi_t1/t2` | ✅ (préfixe L) | ✅ | ❌ | Nuance directe |
| **`2017_pres_t1/t2`** | **❌** | ✅ | ❌ | **Fallback `candidats_presidentiels`** (par nom) |
| `2017_legi_t1/t2` | ✅ | ✅ | ❌ | Nuance directe |
| **`2019_euro_t1`** | **❌** | **❌** | **✅** | **Fallback `tetes_de_liste`** |
| `2020_muni_t1/t2` | ✅ (préfixe L) | ✅ | ❌ | Nuance directe |
| `2021_dpmt_t1/t2` | ✅ (BC-RN, BC-UD...) | ❌ | ❌ | Via `nuances` (binômes) |
| `2021_regi_t1/t2` | ✅ (préfixe L) | ✅ | ❌ | Nuance directe |
| **`2022_pres_t1/t2`** | **❌** | ✅ | ❌ | **Fallback `candidats_presidentiels`** (par nom) |
| `2022_legi_t1/t2` | ✅ | ✅ | ❌ | Nuance directe |
| `2024_euro_t1` | ✅ (préfixe L) | ❌ | ❌ | Nuance directe |
| `2024_legi_t1/t2` | ✅ | ✅ | ❌ | Nuance directe |
| `2026_muni_t1` | ✅ (préfixe L) | ❌ | ❌ | Nuance directe |

**Élections à risque** (en gras) : celles sans nuance standard, qui dépendent d'un fallback.

### 2.3 Données socio-démographiques INSEE

Source : fichiers Excel INSEE millésime 2021 dans `data/raw/insee/`.

| Fichier | Indicateurs |
|---------|-------------|
| `base-ic-evol-struct-pop-2021.xlsx` | Population, âge (8 tranches), % jeunes/retraités |
| `base-ic-diplomes-formation-2021.xlsx` | % sans diplôme, % diplômés supérieur |
| `base-ic-activite-residents-2021.xlsx` | CSP (cadres, ouvriers, employés), chômage |
| `BASE_TD_FILO_IRIS_2021_DISP.xlsx` | Revenu médian, taux de pauvreté |
| `base-ic-logement-2021.xlsx` | % propriétaires, % logement social |

Script de traitement : `scripts/04_build_socio.py`. Filtrage sur commune `59646`.

Valeurs `ns` (non significatif), `s` (secret statistique), `nd` (non disponible) → converties en `null`.

---

## 3. Mapping nuance → famille politique

### 3.1 Le fichier de mapping

Stocké dans **`scripts/nuance-famille-mapping.json`**. C'est le **seul fichier à éditer** pour corriger un classement.

Le fichier contient **4 sections** :

#### Section `nuances` — Codes nuance standards

Codes officiels du Ministère de l'Intérieur utilisés dans la plupart des élections.

Conventions :
- Préfixe `L` = législatives/listes (ex: `LFI`, `LRN`, `LDVG`)
- Préfixe `BC-` = binômes cantonaux/départementaux (ex: `BC-SOC`, `BC-FN`)
- Sans préfixe = code standard (ex: `RN`, `SOC`, `DVD`)

#### Section `codes_presidentiels` — Raccourcis de noms

Pour les présidentielles 2002/2007/2012, la colonne `nuance` contient un raccourci du nom de famille (4 lettres) au lieu d'un code standard.

| Code | Candidat | Famille |
|------|----------|---------|
| `CHIR` | Chirac | droite |
| `LEPE` | Le Pen | extreme_droite |
| `SARK` | Sarkozy | droite |
| `ROYA` | Royal | gauche |
| `HOLL` | Hollande | gauche |
| `MELE` | Mélenchon | gauche |
| `MAME` | Mamère | gauche |
| `MEGR` | Mégret | extreme_droite |
| `LEPA` | Lepage | centre |
| `SAIN` | Saint-Josse | divers |
| ... | ... | ... |

**Pièges historiques corrigés :**
- `LEPE` = **Le Pen** (pas Lepage) → `extreme_droite`
- `LEPA` = **Lepage** (pas Le Pen) → `centre`
- `MAME` = **Mamère** (écologiste) → `gauche` (pas droite)
- `MNA` = **Mégret** (MNR, scission FN) → `extreme_droite` (pas centre)
- `SAIN` = **Saint-Josse** (CPNT, chasseurs) → `divers` (pas extrême droite)

#### Section `candidats_presidentiels` — Fallback par nom

Pour les présidentielles **2017 et 2022**, la colonne `nuance` est vide (`nan`). Le script utilise le **nom de famille** du candidat comme clé de fallback.

Tous les candidats des présidentielles 2002 à 2022 sont listés ici.

#### Section `tetes_de_liste` — Fallback européennes 2019

Pour les européennes 2019, ni la nuance ni le nom ne sont remplis — seule la colonne `nom_tete_liste` est disponible. Le mapping associe chaque tête de liste à sa famille.

Les 18 listes ayant obtenu des voix à Wasquehal sont couvertes.

### 3.2 Logique de résolution dans le script

Le script `03_normalize_elections.py` applique cette logique pour chaque candidat :

```python
def get_famille(nuance, nom=None, tete_liste=None):
    # 1. La nuance est renseignée ?
    if nuance non-vide et != "nan":
        → chercher dans nuances + codes_presidentiels (fusionnés)
        → si trouvé : retourner la famille
        → sinon : retourner "divers"

    # 2. Fallback par nom de candidat (présidentielles sans nuance)
    if nom dans candidats_presidentiels:
        → retourner la famille

    # 3. Fallback par tête de liste (européennes 2019)
    if tete_liste dans tetes_de_liste:
        → retourner la famille

    # 4. Aucun match
    → retourner "divers"
```

**Important** : l'ordre de priorité est `nuance > nom > tete_liste > divers`. Si une nuance existe mais est inconnue du mapping, le candidat est classé `divers` **même si son nom est dans le fallback**.

### 3.3 Les 6 familles

| Famille | Couleur | Partis / mouvements typiques |
|---------|---------|------------------------------|
| `extreme_gauche` | `#7F1D1D` | LO, NPA/LCR, Arthaud, Poutou, Besancenot, Laguiller, Gluckstein |
| `gauche` | `#DC2626` | PS, LFI, PCF, EELV, Génération.s, Hollande, Royal, Mélenchon, Jospin, Mamère |
| `centre` | `#D97706` | LREM/Renaissance, MoDem, UDF, Horizon, Macron, Bayrou, Lepage, Madelin |
| `droite` | `#2563EB` | LR/UMP, UDI, DLF, CPNT, Chirac, Sarkozy, Fillon, Pécresse, Dupont-Aignan |
| `extreme_droite` | `#1E3A5F` | RN/FN, MNR, Reconquête, Le Pen (père et fille), Zemmour, Bardella, Mégret |
| `divers` | `#6B7280` | Micro-partis, candidats sans étiquette, chasseurs (Saint-Josse), Lassalle, Cheminade |

---

## 4. Points de vigilance pour l'audit

### 4.1 Candidats significatifs classés "divers"

**Règle** : aucun candidat avec >5% des voix ne devrait être classé `divers` sauf s'il est réellement inclassable.

**Action** : pour chaque élection, vérifier `public/data/candidats-evolution.json`. Chercher les candidats avec `famille: "divers"` et `pourcentage > 5`. Si le candidat a un parti identifiable, ajouter son mapping.

Élections connues pour avoir des `divers` légitimes à >5% :
- Départementales 2015 et 2021 : candidats départementaux sans affiliation claire
- Cantonales 2008 : candidat `M-NC` (Mouvement National Citoyen, inclassable)

### 4.2 Cohérence temporelle

Un même candidat ne doit **jamais** changer de famille entre deux scrutins.

**Action** : pour chaque nom de candidat apparaissant dans >1 élection, vérifier qu'il est toujours dans la même famille. Exemple de bug corrigé : Le Pen était `gauche` en 2002/2012 (code `LEPE` mal mappé) puis `extreme_droite` en 2017/2022.

### 4.3 Somme des familles = ~100%

Pour chaque scrutin dans `public/data/familles-evolution.json`, la somme `extreme_gauche + gauche + centre + droite + extreme_droite + divers` doit être comprise entre 99.9% et 100.1% (arrondis).

### 4.4 Européennes 2024 — données partielles

Les européennes 2024 ont des nuances (préfixe L) mais **aucun nom** ni tête de liste. Les nuances sont mappées via la section `nuances` du JSON. Vérifier que les principales listes (RN, Renaissance, PS/PP, LFI, LR, EELV, Reconquête) sont bien classées.

### 4.5 Départementales — données minimales

Les départementales 2015 et 2021 n'ont ni nom ni tête de liste. Les nuances sont de type binôme (`BC-SOC`, `BC-FN`, `BC-UD`, `BC-UGE`, `BC-VEC`, `BC-RN`). Seuls ces codes permettent le classement. Si un binôme a un code inconnu, il sera classé `divers`.

### 4.6 Municipales 2026 — pas de noms

Les municipales 2026 ont des nuances (`LDVD`, `LDVG`) mais pas de noms de candidats.

---

## 5. Procédure de correction

### 5.1 Corriger un classement existant

1. Ouvrir `scripts/nuance-famille-mapping.json`
2. Trouver l'entrée (dans la bonne section) et modifier la famille
3. Relancer le pipeline complet (voir §1)
4. Vérifier le résultat dans `public/data/candidats-evolution.json`

### 5.2 Ajouter une nouvelle élection

Quand un nouveau scrutin est ajouté aux CSV source :

1. Ajouter les résultats dans `data/raw/elections/general_results_wasquehal.csv` et `candidats_results_wasquehal.csv`
2. Vérifier les nuances : si le nouveau scrutin utilise de nouveaux codes, les ajouter dans `scripts/nuance-famille-mapping.json` section `nuances`
3. Si c'est une présidentielle sans nuance, ajouter les noms dans `candidats_presidentiels`
4. Si c'est une européenne sans nom, ajouter les têtes de liste dans `tetes_de_liste`
5. Ajouter le scrutin dans `src/data/config.ts` (array `SCRUTINS`)
6. Relancer le pipeline complet

### 5.3 Ajouter un nouveau type de fallback

Si une future élection a un format de données non couvert (ni nuance, ni nom, ni tête de liste) :

1. Identifier quelle colonne du CSV est exploitable (ex: `liste`, `binome`)
2. Ajouter une nouvelle section dans `nuance-famille-mapping.json`
3. Modifier `get_famille()` dans `scripts/03_normalize_elections.py` pour lire cette section
4. Documenter dans ce fichier

---

## 6. Script d'audit automatisé

Voici un script Python qui vérifie automatiquement les points ci-dessus :

```python
"""
Audit qualité des données — à exécuter depuis la racine du projet.
Usage : python3 scripts/audit_qualite.py
"""
import json
from pathlib import Path
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
            msg = f"  {e['id_election']:22s} {nom:30s} {c['pourcentage']}% → divers"
            print(msg)
            warnings.append(msg)

# 3. Cohérence temporelle
print("\n=== Cohérence temporelle (même candidat, familles différentes) ===")
candidat_familles = defaultdict(set)
for e in elections:
    for c in e['candidats']:
        if c['pourcentage'] > 2:
            nom = (c.get('nom') or '').upper()
            if nom and nom != 'NAN':
                candidat_familles[nom].add(c['famille'])
for nom, fams in sorted(candidat_familles.items()):
    if len(fams) > 1:
        msg = f"  {nom}: {', '.join(sorted(fams))}"
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

# Résumé
print(f"\n{'='*50}")
print(f"Erreurs : {len(errors)}")
print(f"Avertissements : {len(warnings)}")
if not errors and not warnings:
    print("✅ Aucun problème détecté")
```

---

## 7. Données socio-démographiques — points spécifiques

| IRIS | Code | Population | Particularité |
|------|------|------------|---------------|
| L'Allumette | 596460101 | 2 882 | — |
| Le Vivier | 596460102 | 3 126 | Revenu le plus élevé |
| Louise Michel | 596460103 | 2 516 | — |
| Centre-Noir Bonnet | 596460201 | **18** | Micro-îlot INSEE, revenu/pauvreté = null |
| Noir Bonnet | 596460202 | 3 304 | — |
| La ville | 596460203 | 3 345 | — |
| Pharos-Haut Vinage | 596460301 | 3 792 | Plus fort taux logement social |
| Le haut Vinage | 596460302 | 1 854 | — |

- **Centre-Noir Bonnet (18 hab.)** : c'est la vraie donnée INSEE. Zone d'activité avec très peu de résidents. Les champs `revenu_median` et `taux_pauvrete` sont `null` (secret statistique).
- Le frontend affiche "–" pour les valeurs nulles.
- Script de traitement : `scripts/04_build_socio.py`
- Jointure BV↔IRIS : `scripts/05_join_bv_iris.py` (intersection géométrique Lambert-93, seuil 1%, normalisé à 100%)
