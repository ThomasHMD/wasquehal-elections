import { useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import type { Map as MaplibreMap, MapMouseEvent, GeoJSONSource } from 'maplibre-gl'
import type { BVMetric } from '../../utils/aggregations'
import { MAP_CENTER, MAP_ZOOM, TILE_URL } from '../../data/config'

const SOURCE_ID = 'bureaux-vote'
const FILL_LAYER = 'bv-fill'
const LINE_LAYER = 'bv-line'
const HOVER_LAYER = 'bv-hover'

interface ElectionMapProps {
  geoData: GeoJSON.FeatureCollection
  metrics: ReadonlyMap<string, BVMetric>
  onBVClick?: (codeBV: string) => void
}

/**
 * Enrichit le GeoJSON avec les données métriques pour colorisation MapLibre.
 * Ajoute une propriété `_color` et `_label` à chaque feature.
 */
function enrichGeo(
  geo: GeoJSON.FeatureCollection,
  metrics: ReadonlyMap<string, BVMetric>,
): GeoJSON.FeatureCollection {
  return {
    ...geo,
    features: geo.features.map(feature => {
      const props = feature.properties as { numeroBureauVote?: string }
      const codeBV = props.numeroBureauVote ?? ''
      const metric = metrics.get(codeBV)
      return {
        ...feature,
        properties: {
          ...feature.properties,
          _color: metric?.color ?? '#E2E8F0',
          _label: metric?.label ?? codeBV,
          _codeBV: codeBV,
        },
      }
    }),
  }
}

export default function ElectionMap({ geoData, metrics, onBVClick }: ElectionMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MaplibreMap | null>(null)
  const hoveredIdRef = useRef<string | number | null>(null)

  // Initialisation de la carte
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: TILE_URL,
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      attributionControl: false,
    })

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Mise à jour des données / couches
  const updateLayers = useCallback(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const enriched = enrichGeo(geoData, metrics)

    if (map.getSource(SOURCE_ID)) {
      (map.getSource(SOURCE_ID) as GeoJSONSource).setData(enriched)
    } else {
      map.addSource(SOURCE_ID, { type: 'geojson', data: enriched, generateId: true })

      // Remplissage choroplèthe
      map.addLayer({
        id: FILL_LAYER,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': ['get', '_color'],
          'fill-opacity': 0.75,
        },
      })

      // Contours
      map.addLayer({
        id: LINE_LAYER,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': '#1E293B',
          'line-width': 1,
          'line-opacity': 0.6,
        },
      })

      // Hover highlight
      map.addLayer({
        id: HOVER_LAYER,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': '#FFFFFF',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.3,
            0,
          ],
        },
      })
    }
  }, [geoData, metrics])

  // Mettre à jour quand les données changent
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (map.isStyleLoaded()) {
      updateLayers()
    } else {
      map.once('load', updateLayers)
    }
  }, [updateLayers])

  // Événements hover et clic
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const handleMouseMove = (e: MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      if (!e.features?.length) return
      map.getCanvas().style.cursor = 'pointer'

      const id = e.features[0].id
      if (hoveredIdRef.current !== null) {
        map.setFeatureState({ source: SOURCE_ID, id: hoveredIdRef.current }, { hover: false })
      }
      hoveredIdRef.current = id ?? null
      if (id !== undefined) {
        map.setFeatureState({ source: SOURCE_ID, id }, { hover: true })
      }
    }

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = ''
      if (hoveredIdRef.current !== null) {
        map.setFeatureState({ source: SOURCE_ID, id: hoveredIdRef.current }, { hover: false })
        hoveredIdRef.current = null
      }
    }

    const handleClick = (e: MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      if (!e.features?.length || !onBVClick) return
      const props = e.features[0].properties as { _codeBV?: string }
      if (props._codeBV) onBVClick(props._codeBV)
    }

    // Attendre que les layers soient créés
    const m = map  // TypeScript closure narrowing
    function attachEvents() {
      if (!m.getLayer(FILL_LAYER)) {
        m.once('idle', attachEvents)
        return
      }
      m.on('mousemove', FILL_LAYER, handleMouseMove)
      m.on('mouseleave', FILL_LAYER, handleMouseLeave)
      m.on('click', FILL_LAYER, handleClick)
    }

    if (map.isStyleLoaded()) {
      attachEvents()
    } else {
      map.once('load', attachEvents)
    }

    return () => {
      if (map.getLayer(FILL_LAYER)) {
        map.off('mousemove', FILL_LAYER, handleMouseMove)
        map.off('mouseleave', FILL_LAYER, handleMouseLeave)
        map.off('click', FILL_LAYER, handleClick)
      }
    }
  }, [onBVClick])

  return (
    <div ref={containerRef} className="w-full h-full" />
  )
}
