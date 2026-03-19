import type { Scrutin } from '../utils/types'

// Liste complète des scrutins disponibles (générée depuis elections.json)
export const SCRUTINS: Scrutin[] = [
  { id: '2026_muni_t1', label: 'Municipales 2026 — T1', annee: 2026, type: 'municipales', tour: 1 },
  { id: '2024_legi_t2', label: 'Législatives 2024 — T2', annee: 2024, type: 'legislatives', tour: 2 },
  { id: '2024_legi_t1', label: 'Législatives 2024 — T1', annee: 2024, type: 'legislatives', tour: 1 },
  { id: '2024_euro_t1', label: 'Européennes 2024', annee: 2024, type: 'europeenne', tour: 1 },
  { id: '2022_pres_t2', label: 'Présidentielle 2022 — T2', annee: 2022, type: 'presidentielle', tour: 2 },
  { id: '2022_pres_t1', label: 'Présidentielle 2022 — T1', annee: 2022, type: 'presidentielle', tour: 1 },
  { id: '2022_legi_t2', label: 'Législatives 2022 — T2', annee: 2022, type: 'legislatives', tour: 2 },
  { id: '2022_legi_t1', label: 'Législatives 2022 — T1', annee: 2022, type: 'legislatives', tour: 1 },
  { id: '2021_regi_t2', label: 'Régionales 2021 — T2', annee: 2021, type: 'regionales', tour: 2 },
  { id: '2021_regi_t1', label: 'Régionales 2021 — T1', annee: 2021, type: 'regionales', tour: 1 },
  { id: '2021_dpmt_t2', label: 'Départementales 2021 — T2', annee: 2021, type: 'departementales', tour: 2 },
  { id: '2021_dpmt_t1', label: 'Départementales 2021 — T1', annee: 2021, type: 'departementales', tour: 1 },
  { id: '2020_muni_t2', label: 'Municipales 2020 — T2', annee: 2020, type: 'municipales', tour: 2 },
  { id: '2020_muni_t1', label: 'Municipales 2020 — T1', annee: 2020, type: 'municipales', tour: 1 },
  { id: '2019_euro_t1', label: 'Européennes 2019', annee: 2019, type: 'europeenne', tour: 1 },
  { id: '2017_pres_t2', label: 'Présidentielle 2017 — T2', annee: 2017, type: 'presidentielle', tour: 2 },
  { id: '2017_pres_t1', label: 'Présidentielle 2017 — T1', annee: 2017, type: 'presidentielle', tour: 1 },
  { id: '2017_legi_t2', label: 'Législatives 2017 — T2', annee: 2017, type: 'legislatives', tour: 2 },
  { id: '2017_legi_t1', label: 'Législatives 2017 — T1', annee: 2017, type: 'legislatives', tour: 1 },
  { id: '2015_regi_t2', label: 'Régionales 2015 — T2', annee: 2015, type: 'regionales', tour: 2 },
  { id: '2015_regi_t1', label: 'Régionales 2015 — T1', annee: 2015, type: 'regionales', tour: 1 },
  { id: '2015_dpmt_t2', label: 'Départementales 2015 — T2', annee: 2015, type: 'departementales', tour: 2 },
  { id: '2015_dpmt_t1', label: 'Départementales 2015 — T1', annee: 2015, type: 'departementales', tour: 1 },
  { id: '2014_muni_t2', label: 'Municipales 2014 — T2', annee: 2014, type: 'municipales', tour: 2 },
  { id: '2014_muni_t1', label: 'Municipales 2014 — T1', annee: 2014, type: 'municipales', tour: 1 },
  { id: '2014_euro_t1', label: 'Européennes 2014', annee: 2014, type: 'europeenne', tour: 1 },
  { id: '2012_pres_t2', label: 'Présidentielle 2012 — T2', annee: 2012, type: 'presidentielle', tour: 2 },
  { id: '2012_pres_t1', label: 'Présidentielle 2012 — T1', annee: 2012, type: 'presidentielle', tour: 1 },
  { id: '2012_legi_t2', label: 'Législatives 2012 — T2', annee: 2012, type: 'legislatives', tour: 2 },
  { id: '2012_legi_t1', label: 'Législatives 2012 — T1', annee: 2012, type: 'legislatives', tour: 1 },
  { id: '2010_regi_t2', label: 'Régionales 2010 — T2', annee: 2010, type: 'regionales', tour: 2 },
  { id: '2010_regi_t1', label: 'Régionales 2010 — T1', annee: 2010, type: 'regionales', tour: 1 },
  { id: '2009_euro_t1', label: 'Européennes 2009', annee: 2009, type: 'europeenne', tour: 1 },
  { id: '2008_cant_t2', label: 'Cantonales 2008 — T2', annee: 2008, type: 'cantonal', tour: 2 },
  { id: '2008_cant_t1', label: 'Cantonales 2008 — T1', annee: 2008, type: 'cantonal', tour: 1 },
  { id: '2007_pres_t2', label: 'Présidentielle 2007 — T2', annee: 2007, type: 'presidentielle', tour: 2 },
  { id: '2007_pres_t1', label: 'Présidentielle 2007 — T1', annee: 2007, type: 'presidentielle', tour: 1 },
  { id: '2007_legi_t2', label: 'Législatives 2007 — T2', annee: 2007, type: 'legislatives', tour: 2 },
  { id: '2007_legi_t1', label: 'Législatives 2007 — T1', annee: 2007, type: 'legislatives', tour: 1 },
  { id: '2004_regi_t2', label: 'Régionales 2004 — T2', annee: 2004, type: 'regionales', tour: 2 },
  { id: '2004_regi_t1', label: 'Régionales 2004 — T1', annee: 2004, type: 'regionales', tour: 1 },
  { id: '2004_euro_t1', label: 'Européennes 2004', annee: 2004, type: 'europeenne', tour: 1 },
  { id: '2002_pres_t2', label: 'Présidentielle 2002 — T2', annee: 2002, type: 'presidentielle', tour: 2 },
  { id: '2002_pres_t1', label: 'Présidentielle 2002 — T1', annee: 2002, type: 'presidentielle', tour: 1 },
  { id: '2002_legi_t2', label: 'Législatives 2002 — T2', annee: 2002, type: 'legislatives', tour: 2 },
  { id: '2002_legi_t1', label: 'Législatives 2002 — T1', annee: 2002, type: 'legislatives', tour: 1 },
  { id: '2001_cant_t2', label: 'Cantonales 2001 — T2', annee: 2001, type: 'cantonal', tour: 2 },
  { id: '2001_cant_t1', label: 'Cantonales 2001 — T1', annee: 2001, type: 'cantonal', tour: 1 },
  { id: '1999_euro_t1', label: 'Européennes 1999', annee: 1999, type: 'europeenne', tour: 1 },
]

/** Scrutin affiché par défaut au chargement */
export const DEFAULT_SCRUTIN_ID = '2022_pres_t2'

/** Coordonnées centre de Wasquehal */
export const MAP_CENTER: [number, number] = [3.130, 50.668]
export const MAP_ZOOM = 13

/** Couleur de fond de carte (style OSM) */
export const TILE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

