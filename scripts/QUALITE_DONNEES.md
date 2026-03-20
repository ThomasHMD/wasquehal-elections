# Spec Qualité des Données — WasquehalElections

## Vue d'ensemble du pipeline

```
data/raw/elections/*.csv
        │
        ▼
scripts/03_normalize_elections.py  ← lit scripts/nuance-famille-mapping.json
        │
        ▼
data/processed/elections.json + participation.json
        │
        ▼
scripts/06_sync_to_public.py
        │
        ▼
public/data/elections/*.json          (1 fichier par scrutin)
public/data/familles-evolution.json   (agrégation famille par scrutin)
public/data/candidats-evolution.json  (candidats agrégés par scrutin — généré séparément)
```

## Sources de données brutes

### Fichiers CSV (`data/raw/elections/`)

| Fichier | Contenu |
|---------|---------|
| `general_results_wasquehal.csv` | Résultats généraux par BV : inscrits, votants, abstentions, blancs, nuls, exprimés |
| `candidats_results_wasquehal.csv` | Résultats par candidat/liste par BV : voix, nuance, nom, prénom, liste, tête de liste |

**Colonnes importantes de `candidats_results_wasquehal.csv` :**
- `id_election` : identifiant unique (ex: `2022_pres_t1`)
- `nuance` : code nuance politique (ex: `LFI`, `RN`, `LEPE`). **Peut être vide/nan** pour certaines élections
- `nom`, `prenom` : nom du candidat. **Vide pour les européennes** (seulement `nom_tete_liste` rempli)
- `nom_tete_liste` : nom de la tête de liste (européennes uniquement)
- `voix`, `ratio_voix_exprimes` : résultats

## Mapping nuance → famille politique

Le mapping est stocké dans **`scripts/nuance-famille-mapping.json`** (fichier éditable).

### Structure du fichier JSON

```json
{
  "nuances": { ... },              // Codes nuance standards (EXG, LFI, RN, etc.)
  "codes_presidentiels": { ... },  // Codes raccourcis de noms (LEPE=Le Pen, SARK=Sarkozy)
  "candidats_presidentiels": { ... }, // Fallback par nom de famille
  "tetes_de_liste": { ... }        // Fallback pour européennes 2019
}
```

### Logique de résolution (dans `get_famille()`)

```
1. Si nuance non-vide et non-"nan" :
   → chercher dans nuances + codes_presidentiels (fusionnés)
   → si pas trouvé → "divers"

2. Si nuance vide/nan :
   a. Chercher le NOM du candidat dans candidats_presidentiels
   b. Sinon, chercher nom_tete_liste dans tetes_de_liste
   c. Sinon → "divers"
```

### 6 familles possibles

| Famille | Couleur | Exemples |
|---------|---------|----------|
| `extreme_gauche` | #7F1D1D | LO, NPA, LCR, Arthaud, Poutou, Besancenot |
| `gauche` | #DC2626 | PS, LFI, PCF, EELV, Mélenchon, Hollande |
| `centre` | #D97706 | LREM/Renaissance, MoDem, UDF, Macron, Bayrou |
| `droite` | #2563EB | LR, UMP, UDI, Sarkozy, Fillon, Chirac |
| `extreme_droite` | #1E3A5F | RN/FN, Reconquête, Le Pen, Zemmour, Bardella |
| `divers` | #6B7280 | Chasseurs, micro-partis, inclassables |

## Points de vigilance pour l'audit

### 1. Nuances absentes ou "nan"

Certaines élections du CSV n'ont pas de nuance renseignée :

| Élection | Nuance | Nom | Nom tête de liste | Résolution |
|----------|--------|-----|-------------------|------------|
| Présidentielles 2002, 2007, 2012 | Code raccourci (LEPE, SARK...) | Rempli | — | Via `codes_presidentiels` |
| Présidentielles 2017, 2022 | `nan` | Rempli | — | Via `candidats_presidentiels` (fallback nom) |
| Européennes 2019 | vide | Vide | Rempli | Via `tetes_de_liste` (fallback tête de liste) |
| Européennes 2024 | vide | Vide | Vide | Pas de fallback → classé `divers` par défaut |
| Départementales 2015, 2021 | vide | Vide | — | Classé `divers` |

**Action d'audit :** Pour chaque élection, vérifier qu'aucun candidat significatif (>2% des voix) n'est classé `divers` par erreur.

### 2. Codes à risque de confusion

| Code | Signifie | Famille | Confusion possible |
|------|----------|---------|-------------------|
| `LEPE` | Le Pen | extreme_droite | ~~Lepage (centre)~~ — c'est bien Le Pen |
| `LEPA` | Lepage | centre | ~~Le Pen~~ — c'est bien Lepage |
| `MAME` | Mamère | gauche | Pourrait sembler "droite" par le code |
| `MNA` | Mégret (MNR) | extreme_droite | ~~MNA = Mouvement National~~ |
| `SAIN` | Saint-Josse (CPNT) | divers | ~~Pas extrême droite~~ |
| `ROYA` | Royal | gauche | Placé dans section "droite" du code à l'origine |

### 3. Européennes 2024

Les européennes 2024 n'ont **aucune nuance, aucun nom, aucune tête de liste** exploitable dans le CSV. Les nuances sont mappées via les codes législatifs (`LREC`, `LFI`, etc.) quand ils existent. **Vérifier que les classements sont cohérents.**

### 4. Départementales 2015 et 2021

Ces élections par binôme n'ont ni nom ni nuance dans le CSV. Tous les candidats sont classés `divers`. C'est une **lacune connue** — les données brutes ne permettent pas de résoudre les familles.

## Procédure de vérification

### Script de vérification recommandé

Pour chaque élection dans `public/data/elections/*.json` :

1. **Charger les candidats** et les trier par voix décroissantes
2. **Pour chaque candidat avec >2% des voix** :
   - Vérifier que la `famille` est correcte (recherche du nom/parti sur Wikipédia ou résultats officiels)
   - Flag si classé `divers` avec >5% des voix (probablement un mapping manquant)
3. **Vérifier la cohérence temporelle** : un même candidat ne doit pas changer de famille entre deux scrutins (ex: Le Pen doit être `extreme_droite` partout)
4. **Croiser avec `familles-evolution.json`** : la somme des % par famille doit faire ~100% pour chaque scrutin

### Pour corriger une erreur

1. Éditer `scripts/nuance-famille-mapping.json` (la section appropriée)
2. Relancer : `python3 scripts/03_normalize_elections.py && python3 scripts/06_sync_to_public.py`
3. Regénérer `candidats-evolution.json` (script dans le README ou dans `06_sync_to_public.py`)
4. Rebuild : `npm run build`

## Données socio-démographiques

### Source
Fichiers Excel INSEE millésime 2021, commune 59646 (Wasquehal), découpés par IRIS.

### Points de vigilance
- L'IRIS "Centre-Noir Bonnet" (596460201) a une population de **18 habitants** — c'est la vraie donnée INSEE (zone d'activité)
- Certains champs sont `null` quand l'INSEE indique `ns` (non significatif), `s` (secret statistique) ou `nd` (non disponible)
- Le frontend affiche "–" pour les valeurs nulles
