import { getKpis, getTemplates, getUsuarios, getAllOcorrencias } from './actions'
import ConfigTabsClient from './ConfigTabsClient'

export default async function ConfiguracoesPage() {
    const [kpis, templates, usuarios, ocorrencias] = await Promise.all([
        getKpis(),
        getTemplates(),
        getUsuarios(),
        getAllOcorrencias()
    ])

    return (
        <ConfigTabsClient
            kpis={kpis}
            templates={templates}
            usuarios={usuarios}
            ocorrencias={ocorrencias}
        />
    )
}
