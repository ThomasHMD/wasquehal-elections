# Wasquehal Élections — Documentation technique

Application web interactive de visualisation des données électorales de Wasquehal (code INSEE : 59646), par bureau de vote.

- **URL prod** : https://thomashmd.github.io/wasquehal-elections/
- **Repo GitHub** : https://github.com/ThomasHMD/wasquehal-elections
- **Stack** : React 19 + TypeScript + Vite 6 + MapLibre GL JS 4 + Recharts + Tailwind CSS 4

---

## Démarrage rapide

```bash
npm install       # une seule fois
npm run dev       # http://localhost:5173
npm run build     # build de production dans dist/
```

---

## 1. Objectifs

- Explorer les résultats électoraux **par bureau de vote** (granularité la plus fine)
- Centraliser **49 scrutins** de 1999 à 2026 dans une interface unique
- Croiser les résultats avec le **profil socio-démographique** des quartiers (IRIS)
- Visualiser les dynamiques : abstention, bascules politiques, évolution des familles
- 100 % statique, hébergé sur GitHub Pages (pas de backend)

---

## 2. Sources de données

### 2.1 Résultats électoraux

| Scrutin | Années | Source | Granularité |
|---------|--------|--------|-------------|
| Municipales | 2014, 2020, 2026 | data.gouv.fr | Bureau de vote |
| Présidentielles | 2002, 2007, 2012, 2017, 2022 | data.gouv.fr | Bureau de vote |
| Législatives | 2002, 2007, 2012, 2017, 2022, 2024 | data.gouv.fr | Bureau de vote |
| Européennes | 1999, 2004, 2009, 2014, 2019, 2024 | data.gouv.fr | Bureau de vote |
| Régionales | 2004, 2010, 2015, 2021 | data.gouv.fr | Bureau de vote |
| Départementales | 2015, 2021 | data.gouv.fr | Bureau de vote |
| Cantonales | 2001, 2008 | data.gouv.fr | Bureau de vote |

### 2.2 Données socio-démographiques (INSEE, millésime 2021)

| Jeu de données | Granularité | Indicateurs clés |
|----------------|-------------|------------------|
| Recensement (RP) | IRIS | Population, âge, sexe |
| Revenus et pauvreté (Filosofi) | IRIS | Revenu médian, taux de pauvreté |
| Emploi — Activité (RP) | IRIS | CSP, taux de chômage |
| Diplômes — Formation (RP) | IRIS | Niveau de diplôme |
| Logement (RP) | IRIS | Propriétaires, logement social |

### 2.3 Données géographiques

| Donnée | Format | Usage |
|--------|--------|-------|
| Contours bureaux de vote | GeoJSON | Carte choroplèthe par BV |
| Contours IRIS | GeoJSON | Superposition données socio |
| Jointure BV ↔ IRIS | JSON (calculé) | Croisement résultats × profil socio |

### 2.4 Jointure BV ↔ IRIS

Les découpages BV et IRIS ne coïncident pas. Le script `05_join_bv_iris.py` calcule l'intersection géométrique entre les polygones (reprojection Lambert-93), puis normalise les chevauchements à 100% par BV.

---

## 3. Architecture

### 3.1 Vue d'ensemble

```
data/raw/elections/*.csv ─┐
data/raw/insee/*.xlsx ────┼─→ scripts/03_normalize_elections.py ──→ elections.json
data/raw/geo/*.geojson ─┐ │   scripts/04_build_socio.py ─────────→ socio-iris.json
                        └─┼─→ scripts/05_join_bv_iris.py ─────────→ bv-iris-mapping.json
                          └──→ scripts/06_sync_to_public.py ──────→ public/data/ (frontend)
```

### 3.2 Stack

| Couche | Techno | Justification |
|--------|--------|---------------|
| Bundler | Vite 6 | Build rapide, HMR |
| Frontend | React 19 + TypeScript | Écosystème riche, typage fort |
| Routing | React Router 7 | Navigation entre les 5 vues |
| Cartographie | MapLibre GL JS 4 | Rendu vectoriel, open source |
| Graphiques | Recharts | Tooltips, animations, intégration React |
| CSS | Tailwind CSS 4 | Utility-first, léger en production |
| Pipeline | Python 3 + pandas + geopandas | Nettoyage, jointures, exports JSON |
| CI/CD | GitHub Actions | Build + deploy auto sur push to main |

### 3.3 Structure du projet

```
WasquehalElections/
├── data/
│   ├── raw/elections/              ← CSV bruts (data.gouv.fr)
│   ├── raw/insee/                  ← Excel bruts INSEE
│   ├── raw/geo/                    ← GeoJSON bruts
│   └── processed/                  ← JSON normalisés (générés par scripts/)
├── docs/                           ← Documentation
├── public/
│   ├── data/                       ← JSON servis au frontend
│   │   ├── elections/              ← 1 fichier par scrutin
│   │   ├── elections.json          ← Tous scrutins (732 KB)
│   │   ├── familles-evolution.json ← Agrégation familles par scrutin
│   │   ├── candidats-evolution.json← Candidats agrégés par scrutin
│   │   ├── participation.json      ← Taux d'abstention par BV
│   │   ├── socio-iris.json         ← Profils socio par IRIS
│   │   └── bv-iris-mapping.json    ← Correspondance BV ↔ IRIS
│   └── geo/                        ← GeoJSON simplifiés
├── scripts/
│   ├── 03_normalize_elections.py   ← Normalisation CSV → JSON
│   ├── 04_build_socio.py           ← Construction profils IRIS
│   ├── 05_join_bv_iris.py          ← Jointure géométrique BV ↔ IRIS
│   ├── 06_sync_to_public.py        ← Sync processed → public/data
│   └── nuance-famille-mapping.json ← Mapping nuance → famille (EDITABLE)
├── src/
│   ├── data/config.ts              ← 49 scrutins + constantes carte
│   ├── utils/
│   │   ├── types.ts                ← Interfaces (BVResult, Candidat, etc.)
│   │   ├── colors.ts               ← Palette familles + scale abstention
│   │   ├── aggregations.ts         ← Calculs métriques par BV
│   │   └── evolutionHelpers.ts     ← Helpers courbes évolution
│   ├── hooks/                      ← useElectionData, useGeoData, etc.
│   ├── components/
│   │   ├── layout/                 ← Header, Sidebar, Layout
│   │   ├── map/                    ← ElectionMap, MapPopup
│   │   ├── charts/                 ← AbstentionChart, FamilleEvolutionChart, etc.
│   │   └── filters/                ← ScrutinSelector, MetriqueSelector
│   └── pages/
│       ├── MapView.tsx             ← Vue Carte
│       ├── EvolutionView.tsx       ← Vue Évolution
│       ├── SocioView.tsx           ← Vue Profil socio
│       ├── CompareView.tsx         ← Vue Comparaison
│       └── AboutView.tsx           ← Méthodologie
└── .github/workflows/deploy.yml    ← CI/CD GitHub Pages
```

---

## 4. Pipeline de données (Python)

### Régénérer les données

```bash
cd WasquehalElections/
python3 scripts/03_normalize_elections.py   # CSV → elections.json + participation.json
python3 scripts/04_build_socio.py           # INSEE → socio-iris.json
python3 scripts/05_join_bv_iris.py          # GeoJSON → bv-iris-mapping.json
python3 scripts/06_sync_to_public.py        # processed/ → public/data/
npm run build                               # rebuild frontend
```

### 4.1 Normalisation (`03_normalize_elections.py`)

Lit les CSV bruts et produit un JSON unifié. Le mapping nuance → famille est externalisé dans `scripts/nuance-famille-mapping.json` (voir `docs/QUALITE_DONNEES.md`).

**Schéma de sortie :**

```typescript
interface BVResult {
  id_election: string      // ex: "2022_pres_t2"
  scrutin: string          // "presidentielle" | "legislatives" | ...
  annee: number
  tour: number
  bureau_vote: string      // ex: "0001"
  inscrits: number
  votants: number
  abstentions: number
  blancs: number
  nuls: number
  exprimes: number
  candidats: {
    nom: string | null
    prenom: string | null
    nuance: string         // code ministère (RN, LFI, LDVG...)
    famille: Famille       // "gauche" | "centre" | "droite" | ...
    voix: number
    pourcentage: number    // % des exprimés
  }[]
}
```

### 4.2 Profil socio (`04_build_socio.py`)

Agrège 5 fichiers Excel INSEE (millésime 2021) pour les 8 IRIS de Wasquehal. Les valeurs `ns`/`s`/`nd` sont converties en `null`.

### 4.3 Jointure BV ↔ IRIS (`05_join_bv_iris.py`)

Intersection spatiale en Lambert-93 avec seuil 1%. Les chevauchements sont normalisés à 100% par BV.

### 4.4 Sync (`06_sync_to_public.py`)

Copie les JSON dans `public/data/`, split `elections.json` en fichiers individuels, et régénère `familles-evolution.json`.

---

## 5. Fonctionnalités

### 5.1 Vue Carte (`/carte`)

Carte choroplèthe interactive des bureaux de vote.

- **Métriques** : abstention, famille dominante, score d'un candidat spécifique
- **Interactions** : hover (highlight), clic (popup résultats détaillés)
- **Contrôles** : sélecteur scrutin, sélecteur métrique + légende

### 5.2 Vue Évolution (`/evolution`)

3 onglets :
- **Abstention** : courbe par scrutin, option BV individuels
- **Familles politiques** : stacked area chart 100% + tableau des candidats par élection
- **Heatmap BV** : grille BV × scrutin, colorée par taux d'abstention

### 5.3 Vue Profil socio (`/profil`)

- Tableau IRIS avec indicateurs (population, revenu, pauvreté, chômage, logement social)
- Taux d'abstention par IRIS (moyenne pondérée via mapping BV→IRIS)
- Clic sur un IRIS → radar chart + détail des indicateurs

### 5.4 Vue Comparaison (`/comparer`)

- Double carte MapLibre côte à côte, scrutins indépendants
- Métrique partagée
- Tableau comparatif BV par BV avec delta

### 5.5 Méthodologie (`/methodologie`)

Sources, limites, licence (Etalab 2.0).

---

## 6. Design

### Palette familles politiques

| Famille | Couleur | Hex |
|---------|---------|-----|
| Extrême gauche | rouge foncé | `#7F1D1D` |
| Gauche | rouge | `#DC2626` |
| Centre | orange | `#D97706` |
| Droite | bleu | `#2563EB` |
| Extrême droite | bleu foncé | `#1E3A5F` |
| Divers | gris | `#6B7280` |

### Layout

```
┌──────────────────────────────────────────────┐
│  Header : titre + navigation (5 onglets)     │
├──────────────────────────────────────────────┤
│  Sidebar (filtres)  │  Zone principale       │
│  - Scrutin          │  - Carte ou graphiques │
│  - Métrique         │                        │
├──────────────────────────────────────────────┤
```

Desktop first. Les composants lourds (MapLibre, Recharts) sont lazy-loadés.

---

## 7. Performance

Le bundle principal fait **271 KB** (83 Ko gzippé). MapLibre (~805 KB) et Recharts (~360 KB) sont dans des chunks séparés, chargés à la demande.

| Ressource | Taille |
|-----------|--------|
| Bundle principal (gzip) | 83 Ko |
| Chunk MapLibre (gzip) | 218 Ko |
| Chunk Recharts (gzip) | 101 Ko |
| CSS (gzip) | 14 Ko |
| GeoJSON total | ~800 Ko |

Stratégies : lazy loading des composants (pas des pages), `useMemo` pour les calculs, données pré-agrégées côté Python.

---

## 8. Déploiement GitHub Pages

### CI/CD

Le fichier `.github/workflows/deploy.yml` build et déploie automatiquement à chaque push sur `main`.

### Manuel

```bash
npm run build
# Le dossier dist/ contient le site statique
```

---

## 9. Roadmap

- ✅ **Phase 1** — Pipeline données Python (49 scrutins, données INSEE réelles)
- ✅ **Phase 2** — Squelette Vite + React + routing
- ✅ **Phase 3** — Vue Carte (choroplèthe interactive)
- ✅ **Phase 4** — Vue Évolution (abstention, familles, heatmap)
- ✅ **Phase 5** — Vue Profil socio (tableau IRIS, radar chart)
- ✅ **Phase 6** — Vue Comparaison (double carte + tableau delta)
- ✅ **Phase 7** — Performance (lazy loading, code splitting)
- 🔲 Responsive mobile
- 🔲 Scatter plot corrélation socio × vote
- 🔲 Carte de différence (delta entre scrutins)

### Extensions possibles (v2)

- Données temps réel les soirs d'élection
- Comparaison inter-communes (Croix, Villeneuve-d'Ascq, Marcq-en-Barœul…)
- Clustering BV par profil sociologique
- Export CSV des données filtrées

---

## 10. Qualité des données

Voir `docs/QUALITE_DONNEES.md` pour le détail du mapping nuance → famille, les points de vigilance, et la procédure d'audit.

Le fichier de mapping éditable est `scripts/nuance-famille-mapping.json`.
