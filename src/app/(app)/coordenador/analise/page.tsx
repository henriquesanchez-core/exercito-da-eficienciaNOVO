import { getAnaliseOptions, getAnaliseData } from './actions'
import AnaliseClient from './AnaliseClient'

export default async function AnalisePage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await searchParams
    const guardiaoId = resolvedParams.guardiaoId as string | undefined

    const options = await getAnaliseOptions()
    const data = guardiaoId ? await getAnaliseData(guardiaoId) : undefined

    return <AnaliseClient options={options} guardiaoId={guardiaoId} data={data} />
}
