import json
import random

# Generate coherent mock socio data based on the IRIS present in the geojson
with open('public/geo/iris.geojson') as f:
    iris_data = json.load(f)

# Extract unique IRIS codes and names
iris_info = {}
for feat in iris_data['features']:
    props = feat['properties']
    code_list = props.get('iris_code')
    if code_list and len(code_list) > 0:
        code = code_list[0]
        name = props.get('iris_name', [f"Quartier {code}"])[0]
        if code not in iris_info:
            iris_info[code] = name

socio_results = []
random.seed(42) # For reproducible mock data

for code, name in iris_info.items():
    socio_results.append({
        "code_iris": code,
        "nom_iris": name,
        "population": random.randint(1500, 3500),
        "age_median": random.randint(30, 45),
        "pct_moins_25": round(random.uniform(25.0, 35.0), 2),
        "pct_plus_65": round(random.uniform(15.0, 25.0), 2),
        "revenu_median": random.randint(18000, 32000),
        "taux_pauvrete": round(random.uniform(5.0, 25.0), 2),
        "pct_cadres": round(random.uniform(10.0, 30.0), 2),
        "pct_ouvriers": round(random.uniform(10.0, 25.0), 2),
        "pct_employes": round(random.uniform(20.0, 35.0), 2),
        "pct_sans_diplome": round(random.uniform(10.0, 25.0), 2),
        "pct_superieur": round(random.uniform(20.0, 40.0), 2),
        "pct_proprietaires": round(random.uniform(40.0, 70.0), 2),
        "pct_logement_social": round(random.uniform(5.0, 30.0), 2),
        "taux_chomage": round(random.uniform(6.0, 15.0), 2)
    })

with open('data/processed/socio-iris.json', 'w', encoding='utf-8') as f:
    json.dump(socio_results, f, ensure_ascii=False, indent=2)

print("Generated data/processed/socio-iris.json")
