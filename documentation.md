# Wasquehal Élections — Documentation

Application web interactive de visualisation des données électorales de Wasquehal, par bureau de vote.

- **URL prod** : à configurer (GitHub Pages)
- **Stack** : React 19 + TypeScript + Vite 6 + MapLibre GL JS 4 + Tailwind CSS 4

---

## Démarrage rapide

```bash
npm install       # une seule fois
npm run dev       # http://localhost:5173
npm run build     # build de production dans dist/
```

---

## Structure du projet

```
WasquehalElections/
├── data/
│   ├── raw/elections/          ← CSV bruts (data.gouv.fr)
│   └── processed/              ← JSON normalisés (générés par scripts/)
├── public/
│   ├── data/                   ← JSON copiés depuis data/processed/ (servis par Vite)
│   └── geo/                    ← GeoJSON bureaux de vote + IRIS
├── scripts/                    ← Pipeline Python (Phase 1)
├── src/
│   ├── data/config.ts          ← Liste des 49 scrutins + constantes carte
│   ├── utils/
│   │   ├── types.ts            ← Interfaces TypeScript (BVResult, Candidat, etc.)
│   │   ├── colors.ts           ← Palette familles politiques + scale abstention
│   │   └── aggregations.ts     ← Calculs métriques par BV
│   ├── hooks/
│   │   ├── useElectionData.ts  ← Fetch + cache elections.json, filtre par scrutin
│   │   └── useGeoData.ts       ← Fetch GeoJSON (bv.geojson, iris.geojson)
│   ├── components/
│   │   ├── layout/             ← Header (nav), Sidebar (slot filtres), Layout
│   │   ├── map/                ← ElectionMap (choroplèthe MapLibre), MapPopup
│   │   └── filters/            ← ScrutinSelector, MetriqueSelector + légende
│   └── pages/
│       ├── MapView.tsx         ← ✅ Vue Carte (Phase 3)
│       ├── EvolutionView.tsx   ← 🔲 Vue Évolution (Phase 4)
│       ├── SocioView.tsx       ← 🔲 Vue Profil socio (Phase 5)
│       ├── CompareView.tsx     ← 🔲 Vue Comparaison (Phase 6)
│       └── AboutView.tsx       ← ✅ Page Méthodologie
├── .github/workflows/deploy.yml ← CI/CD GitHub Pages
└── documentation.md            ← ce fichier
```

---

## Données

### Sources

| Fichier | Taille | Contenu |
|---|---|---|
| `public/data/elections.json` | 732 KB | Tous scrutins 1999–2026, par BV (754 entrées) |
| `public/data/participation.json` | 96 KB | Taux d'abstention par scrutin et BV |
| `public/data/socio-iris.json` | 3.6 KB | Profils socio 8 IRIS (**données mock** — à remplacer par vraies données INSEE) |
| `public/data/bv-iris-mapping.json` | 30 KB | Correspondance BV ↔ IRIS (⚠ bug format iris_code, voir Issues) |
| `public/geo/bv.geojson` | 450 KB | Contours 9 bureaux de vote (WGS84) |
| `public/geo/iris.geojson` | 345 KB | Contours 8 zones IRIS (WGS84) |

### Structure elections.json

```typescript
{
  id_election: string      // ex: "2022_pres_t2"
  scrutin: string          // ex: "presidentielle"
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
    nuance: string          // code ministère ex: "RN", "LDVG"
    famille: string         // "gauche" | "centre" | "droite" | "extreme_droite" | ...
    voix: number
    pourcentage: number     // % des exprimés
  }[]
}
```

### Scrutins disponibles

49 scrutins de 1999 à 2026 :
Municipales (2014, 2020, 2026), Présidentielles (2002, 2007, 2012, 2017, 2022),
Législatives (2002, 2007, 2012, 2017, 2022, 2024), Européennes (1999, 2004, 2009, 2014, 2019, 2024),
Régionales (2004, 2010, 2015, 2021), Départementales (2015, 2021), Cantonales (2001, 2008).

---

## Fonctionnalités implémentées

### ✅ Phase 4 — Vue Évolution (`/evolution`)

Onglets :
- **Abstention** : LineChart Recharts, courbe par scrutin. Filtrable par type. Option "afficher les BV individuels".
- **Familles politiques** : AreaChart 100% stacked — répartition des familles dans le temps.
- **Heatmap BV** : grille BV × scrutin, colorée par taux d'abstention.

Composants : `AbstentionChart`, `FamilleEvolutionChart`, `BVHeatmap` dans `src/components/charts/`.
Helpers de transformation des données : `src/utils/evolutionHelpers.ts`.

### ✅ Phase 5 — Vue Profil socio (`/profil`)

- Tableau de tous les IRIS avec indicateurs clés + taux d'abstention pour le scrutin sélectionné
- Clic sur un IRIS → radar chart normalisé + détail des indicateurs
- Jointure BV→IRIS via `bv-iris-mapping.json` pour calculer l'abstention par IRIS

### ✅ Phase 6 — Vue Comparaison (`/comparer`)

- Double carte MapLibre côte à côte, chacune avec son scrutin indépendant
- Même métrique appliquée aux deux cartes (sélecteur partagé)
- Tableau comparatif BV par BV avec delta en points de % (si métrique = abstention)

### ✅ Phase 1 — Pipeline de données
Scripts Python dans `scripts/` :
- `03_normalize_elections.py` — normalise les CSV → `elections.json` + `participation.json`
- `04_build_socio.py` — construit les profils IRIS (données mock pour l'instant)
- `05_join_bv_iris.py` — jointure géométrique BV ↔ IRIS → `bv-iris-mapping.json`

Pour régénérer les données :
```bash
cd scripts/
python3 03_normalize_elections.py
python3 04_build_socio.py
python3 05_join_bv_iris.py
# Puis re-copier vers public/data/
cp ../data/processed/*.json ../public/data/
```

### ✅ Phase 2 — Squelette Vite + React
- Routing React Router 7 : `/carte`, `/evolution`, `/profil`, `/comparer`, `/methodologie`
- Layout 3 colonnes : header + sidebar filtres + zone principale
- Tailwind CSS 4 via `@tailwindcss/vite`

### ✅ Phase 3 — Vue Carte (`/carte`)

> **Bugs connus** : les contours de certains BV se superposent (données source à vérifier) — n'affecte pas les chiffres, seulement le rendu visuel.

**Fonctionnement :**
1. Chargement `bv.geojson` + `elections.json` (cache module-level, fetch unique)
2. Sélecteur scrutin (groupé par type, 49 scrutins)
3. Sélecteur métrique : abstention / famille dominante / candidat spécifique
4. Carte MapLibre choroplèthe : chaque BV coloré selon la métrique
5. Hover → highlight du BV
6. Clic → popup avec résultats détaillés (barres de progression par candidat)

**Composants clés :**
- `ElectionMap` — carte MapLibre, source GeoJSON enrichie dynamiquement
- `MapPopup` — popup détail BV avec stats participation + résultats
- `ScrutinSelector` — `<select>` groupé par type de scrutin
- `MetriqueSelector` — choix métrique + légende familles politiques

**Palette familles politiques :**
| Famille | Couleur |
|---|---|
| Extrême gauche | `#7F1D1D` |
| Gauche | `#DC2626` |
| Centre | `#D97706` |
| Droite | `#2563EB` |
| Extrême droite | `#1E3A5F` |
| Divers | `#6B7280` |

---

## Issues connues

| # | Issue | Impact | Priorité |
|---|---|---|---|
| 1 | `bv-iris-mapping.json` : `iris_code` stocké comme `"['596460202']"` (string Python) | Bloque Vue Profil socio | Avant Phase 5 |
| 2 | `socio-iris.json` : données mock aléatoires (seed=42), pas vraies données INSEE | Vue Profil socio incorrecte | Avant Phase 5 |
| 3 | `elections.json` = 732 KB → **splitté en 49 fichiers (max 57 KB)** | ✅ Réglé | — |
| 4 | `bv.geojson` = 450 KB (budget spec 300 KB total) | Perf réseau | Optimization future |
| 5 | JS bundle = 421 KB gzipped (budget spec 150 KB) | Perf réseau | Optimization future (code splitting MapLibre/Recharts) |
| 6 | Micro-polygones artefacts dans bv.geojson → **7 supprimés** | ✅ Réglé | — |
| 7 | Certains BV ont de vraies zones non-contiguës (enclaves légitimes data.gouv.fr) | Cosmétique | À documenter |

---

## Déploiement GitHub Pages

### Prérequis
1. Créer un repo GitHub (ex: `wasquehal-elections`)
2. Activer GitHub Pages → "GitHub Actions" comme source
3. Si le repo n'est pas à la racine du domaine, mettre à jour `vite.config.ts` :
   ```typescript
   base: '/wasquehal-elections/',
   ```

### CI/CD
Le fichier `.github/workflows/deploy.yml` déclenche automatiquement un déploiement à chaque push sur `main`.

### Déploiement manuel
```bash
npm run build
# Déployer le dossier dist/ sur votre hébergement
```

---

## Roadmap

- ✅ **Phase 1** — Pipeline données Python
- ✅ **Phase 2** — Squelette Vite + React + routing
- ✅ **Phase 3** — Vue Carte (choroplèthe interactive)
- ✅ **Phase 4** — Vue Évolution (`/evolution`) : courbe abstention, stacked area familles, heatmap BV
- ✅ **Phase 5** — Vue Profil socio (`/profil`) : tableau IRIS, radar chart, corrélation abstention
- ✅ **Phase 6** — Vue Comparaison (`/comparer`) : double carte + tableau delta
- 🔲 **Phase 7** — Polish + mobile + déploiement GitHub Pages
