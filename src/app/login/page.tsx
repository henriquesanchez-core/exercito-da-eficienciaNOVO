import { login } from './actions'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string }>
}) {
    const { message } = await searchParams

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-8 shadow-xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Exército da Eficiência</h1>
                    <p className="text-sm text-neutral-400">Entre na sua conta para continuar</p>
                </div>

                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-neutral-300" htmlFor="email">
                            E-mail
                        </label>
                        <input
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
                            id="email"
                            name="email"
                            type="email"
                            placeholder="seu@email.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-neutral-300" htmlFor="password">
                            Senha
                        </label>
                        <input
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        formAction={login}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold rounded-lg px-4 py-2.5 transition-colors duration-200 mt-2"
                    >
                        Entrar
                    </button>

                    {message && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg text-center">
                            {message}
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}
