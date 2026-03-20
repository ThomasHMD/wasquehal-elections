import geopandas as gpd
import json
import os

print("Loading BV and IRIS geojson files...")
# Read the GeoJSON files
gdf_bv = gpd.read_file('public/geo/bv.geojson')
gdf_iris = gpd.read_file('public/geo/iris.geojson')

# Fix CRS if needed (assuming they are both WGS84 - EPSG:4326)
if gdf_bv.crs is None:
    gdf_bv.set_crs(epsg=4326, inplace=True)
if gdf_iris.crs is None:
    gdf_iris.set_crs(epsg=4326, inplace=True)

# Project to a metric CRS to calculate valid areas for intersection
# EPSG:2154 (RGF93 / Lambert-93) is standard for France
gdf_bv_proj = gdf_bv.to_crs(epsg=2154)
gdf_iris_proj = gdf_iris.to_crs(epsg=2154)

# We want mapping: BV -> List of IRIS with overlap %
mapping = {}

print("Calculating spatial intersections...")
for idx, bv_row in gdf_bv_proj.iterrows():
    bv_code = bv_row.get('numeroBureauVote')
    if not bv_code:
        continue
        
    bv_geom = bv_row.geometry
    bv_area = bv_geom.area
    
    overlaps = []
    
    for iris_idx, iris_row in gdf_iris_proj.iterrows():
        iris_geom = iris_row.geometry
        
        # Check if bounding boxes intersect first (fast)
        if not bv_geom.intersects(iris_geom):
            continue
            
        # Calculate intersection
        intersection = bv_geom.intersection(iris_geom)
        if not intersection.is_empty:
            intersection_area = intersection.area
            overlap_pct = (intersection_area / bv_area) * 100
            
            # If overlap is significant (> 1%), add to mapping
            if overlap_pct > 1.0:
                iris_code_val = iris_row.get('iris_code')
                if isinstance(iris_code_val, list) and len(iris_code_val) > 0:
                    iris_code_val = iris_code_val[0]
                elif isinstance(iris_code_val, str) and iris_code_val.startswith('['):
                    # In case it was stringified
                    import ast
                    iris_code_val = ast.literal_eval(iris_code_val)[0]
                
                if iris_code_val:
                    overlaps.append({
                        "iris_code": str(iris_code_val),
                        "overlap_pct": round(overlap_pct, 2)
                    })
    
    # Normalize overlaps so they sum to 100%
    total = sum(o['overlap_pct'] for o in overlaps)
    if total > 0 and abs(total - 100.0) > 0.01:
        for o in overlaps:
            o['overlap_pct'] = round(o['overlap_pct'] / total * 100, 2)

    # Sort overlaps by percentage, highest first
    overlaps = sorted(overlaps, key=lambda x: x['overlap_pct'], reverse=True)
    mapping[str(bv_code)] = overlaps

print("Exporting bv-iris-mapping.json...")
with open('data/processed/bv-iris-mapping.json', 'w', encoding='utf-8') as f:
    json.dump(mapping, f, ensure_ascii=False, indent=2)

print("Done!")
