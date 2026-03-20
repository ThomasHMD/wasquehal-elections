# Audit de Performance - Wasquehal Élections

**Date de l'audit :** 20 mars 2026
**URL testée :** `http://localhost:5173/wasquehal-elections/evolution`
**Score de performance global (Lighthouse) :** 54% (en mode développement)

## 📊 Résumé des métriques

| Métrique | Valeur | État |
| :--- | :--- | :--- |
| **First Contentful Paint (FCP)** | 17.0 s | 🔴 Critique |
| **Largest Contentful Paint (LCP)** | 26.8 s | 🔴 Critique |
| **Time to Interactive (TTI)** | 26.8 s | 🔴 Critique |
| **Total Blocking Time (TBT)** | 10 ms | 🟢 Excellent |
| **Cumulative Layout Shift (CLS)** | 0.079 | 🟢 Bon |

---

## 🔍 Analyse des goulots d'étranglement

### 1. Mode Développement (Vite)
Le score de performance est fortement impacté par le fait que l'application tourne en mode **développement** (`npm run dev`). 
- Vite sert des centaines de modules JavaScript non minifiés individuellement.
- Lighthouse signale **2,4 Mo de JavaScript inutilisé** et **1,5 Mo de JS non minifié**, ce qui est normal en dev mais catastrophique pour les scores de chargement.
- *Note : En production (`npm run build`), le poids total du bundle est de ~1.5 Mo (415 Ko compressé).*

### 2. Absence de Code-Splitting par route
Actuellement, toutes les pages (`MapView`, `EvolutionView`, `SocioView`, etc.) sont importées de manière statique dans `App.tsx`.
- Les bibliothèques lourdes comme **MapLibre GL** (800 Ko) et **Recharts** (444 Ko) sont chargées dès le démarrage de l'application, même si l'utilisateur consulte une page qui n'en a pas besoin.
- Cela retarde massivement le LCP.

### 3. Inefficacité de rendu dans `BVHeatmap`
Dans le composant `BVHeatmap.tsx`, une nouvelle `Map` est créée à chaque cycle de rendu à partir de la liste des cellules. 
```tsx
const cellMap = new Map<string, HeatmapCell>()
for (const c of cells) {
  cellMap.set(`${c.bv}_${c.id_election}`, c)
}
```
Bien que le dataset actuel soit petit (800 cellules), cette opération de recréation d'index devrait être mémorisée via `useMemo`.

### 4. Poids des bibliothèques externes
- **MapLibre GL** : Indispensable pour la carte, mais très lourde.
- **Recharts** : Pratique mais ajoute une charge significative au bundle.

---

## 💡 Recommandations et Plan d'Action

### ⚡ Court Terme (Quick Wins)

1.  **Lazy Loading des routes :** Utiliser `React.lazy()` et `Suspense` dans `App.tsx` pour ne charger `MapView` (et MapLibre) que lorsque l'utilisateur va sur la carte, et `EvolutionView` (et Recharts) seulement sur la page d'évolution.
2.  **Mémorisation dans `BVHeatmap` :** Envelopper la création de `cellMap` dans un `useMemo` pour éviter de recalculer l'index à chaque render (surtout lors des survols/tooltips).
3.  **Optimization de l'indexation :** Pré-calculer l'index des données d'évolution lors du chargement initial ou dans le hook `useParticipationData` pour éviter de le refaire dans chaque composant.

### 🛠️ Long Terme (Architecture)

1.  **Pruning des JSON :** Les fichiers comme `elections.json` (742 Ko) pourraient être divisés par année ou par type de scrutin si la base de données grandit.
2.  **Alternatives légères :** Si les graphiques restent simples, envisager une bibliothèque plus légère que Recharts (ex: `Victory` ou des composants SVG personnalisés).
3.  **Mise en cache (Service Worker) :** Pour une application statique sur GitHub Pages, un Service Worker permettrait de mettre en cache les gros fichiers JSON et les bibliothèques lourdes.

---

## Conclusion
La lenteur ressentie est principalement due au **chargement initial massif** (MapLibre + Recharts + JSON) aggravé par le mode développement de Vite. Le passage au **Lazy Loading** des routes transformera radicalement l'expérience utilisateur en réduisant le bundle initial de plus de 80%.
