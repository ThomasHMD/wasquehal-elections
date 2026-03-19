import requests
import json

def search_dataset(query):
    url = f"https://www.data.gouv.fr/api/1/datasets/?q={query}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        if data.get("data"):
            dataset = data["data"][0]
            print(f"Found dataset: {dataset['title']}")
            for resource in dataset.get("resources", []):
                print(f"  - {resource['title']}: {resource['url']}")
        else:
            print(f"No dataset found for query: {query}")
    else:
        print(f"Error for query {query}: {response.status_code}")

queries = [
    "résultats élections présidentielles 2022 bureau de vote",
    "résultats élections législatives 2024 bureau de vote",
    "résultats élections municipales 2020 bureau de vote",
    "contours des bureaux de vote",
    "contours iris",
    "table appartenance géographique iris",
    "base ic evol struct pop iris",
    "base ic diplomes formation iris",
    "base ic activite residents iris",
    "filosofi revenus iris",
    "base ic logement iris"
]

for q in queries:
    search_dataset(q)
    print("-" * 40)
