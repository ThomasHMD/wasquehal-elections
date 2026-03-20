export default function AboutView() {
  return (
    <div className="flex flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl space-y-6 text-sm text-slate-700">
        <h1 className="text-2xl font-bold text-slate-900">Méthodologie</h1>

        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Sources des données électorales</h2>
          <p>
            Les résultats électoraux proviennent du portail{' '}
            <a href="https://www.data.gouv.fr" className="text-blue-600 underline" target="_blank" rel="noreferrer">
              data.gouv.fr
            </a>{' '}
            (Ministère de l'Intérieur). Ils couvrent les scrutins de 1999 à 2026 pour la commune de Wasquehal (code INSEE 59646),
            à la granularité des bureaux de vote.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Données géographiques</h2>
          <p>
            Les contours des bureaux de vote proviennent de data.gouv.fr. Les contours IRIS sont fournis par l'IGN/INSEE.
            Les deux jeux de données sont en projection WGS84 (EPSG:4326).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Jointure bureaux de vote ↔ IRIS</h2>
          <p>
            La correspondance entre bureaux de vote et zones IRIS a été établie par intersection géométrique :
            pour chaque bureau de vote, les IRIS dont le chevauchement de surface dépasse 1 % sont associés,
            pondérés par leur part de surface.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Limites</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Les données socio-démographiques IRIS sont issues du recensement INSEE et peuvent ne pas correspondre exactement aux bureaux de vote.</li>
            <li>Les nuances politiques sont celles attribuées par le Ministère de l'Intérieur — elles peuvent différer de l'appartenance déclarée.</li>
            <li>Certains scrutins anciens peuvent présenter des données incomplètes.</li>
            <li><strong>Bureau de vote 0016</strong> : créé en 2017, il n'apparaît pas dans les scrutins antérieurs. Wasquehal comptait 15 BV avant 2017, 16 depuis.</li>
            <li><strong>Votes blancs</strong> : comptabilisés séparément depuis 2014 seulement. Avant cette date, ils sont inclus dans les nuls.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Licence</h2>
          <p>
            Données publiées sous{' '}
            <a href="https://www.etalab.gouv.fr/licence-ouverte-open-licence" className="text-blue-600 underline" target="_blank" rel="noreferrer">
              Licence Ouverte Etalab 2.0
            </a>.
          </p>
        </section>
      </div>
    </div>
  )
}
