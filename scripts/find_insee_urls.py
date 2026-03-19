import requests

queries = [
    "insee base-ic-evol-struct-pop-iris", 
    "insee base-ic-diplomes-formation-iris", 
    "insee base-ic-activite-residents-iris", 
    "insee filosofi-revenus-iris", 
    "insee base-ic-logement-iris", 
    "table appartenance geographique", 
    "contours iris"
]

for q in queries:
    r = requests.get(f"https://www.data.gouv.fr/api/1/datasets/?q={q}").json()
    if r.get("data"):
        print(f"--- {q} ---")
        for d in r["data"][:2]:
            print(f"Dataset: {d.get('title')}")
            for res in d.get("resources", [])[:3]:
                print(f"  {res.get('title')}: {res.get('url')}")
    else:
        print(f"--- {q} --- NOT FOUND")
