import { getOcorrencias } from './actions'
import OcorrenciasList from './OcorrenciasList'

export default async function OcorrenciasPage() {
    const ocorrencias = await getOcorrencias()

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Ocorrências e Melhorias</h1>
                <p className="text-neutral-400">Registre problemas operacionais ou sugira melhorias no processo.</p>
            </header>

            <OcorrenciasList initialData={ocorrencias} />
        </div>
    )
}
