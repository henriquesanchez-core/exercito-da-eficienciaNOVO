import { getDashboardCoordenadorData } from './actions'
import DashboardCoordenadorClient from './DashboardCoordenadorClient'

export default async function CoordenadorDashboardPage() {
    const data = await getDashboardCoordenadorData()
    return <DashboardCoordenadorClient data={data} />
}
