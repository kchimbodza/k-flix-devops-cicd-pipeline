import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFavourites } from '../context/FavouritesContext'
import { getUserWatchlists, createWatchlist, deleteWatchlist } from '../services/api'

// noinspection JSUnresolvedVariable
const IMAGE_URL = import.meta.env.VITE_TMDB_IMAGE_URL

const Watchlists = () => {
    const { user } = useAuth()
    const { isFavourite } = useFavourites()
    const [watchlists, setWatchlists] = useState([])
    const [newName, setNewName] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchWatchlists = async () => {
            try {
                const data = await getUserWatchlists(user.id)
                setWatchlists(data)
            } catch {
                setError('Failed to load watchlists')
            } finally {
                setLoading(false)
            }
        }
        void fetchWatchlists()
    }, [user.id])

    const handleCreate = async () => {
        if (!newName.trim()) return
        try {
            const created = await createWatchlist(user.id, newName)
            setWatchlists(prev => [...prev, created])
            setNewName('')
        } catch {
            setError('Failed to create watchlist')
        }
    }

    const handleDelete = async (id) => {
        try {
            await deleteWatchlist(id)
            setWatchlists(prev => prev.filter(w => w.id !== id))
        } catch {
            setError('Failed to delete watchlist')
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <p className="text-white text-xl">Loading...</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col py-12 pt-48">
            {/* Header and create form */}
            <div className="max-w-4xl mx-auto px-6 w-full">
                <h1 className="text-4xl font-bold text-white mb-2 text-center">My Watchlists</h1>
                <p className="text-gray-400 mb-10 text-center">Organise your movies into custom lists</p>

                {/* Create new watchlist */}
                <div className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-6 mb-10">
                    <h2 className="text-white font-semibold text-lg mb-4">Create New Watchlist</h2>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && void handleCreate()}
                            placeholder="e.g. Friday Night Movies..."
                            className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                        />
                        <button
                            type="button"
                            onClick={handleCreate}
                            className="bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 font-semibold transition-colors"
                        >
                            Create
                        </button>
                    </div>
                </div>

                {error && <p className="text-red-400 mb-6">{error}</p>}
            </div>

            {/* Watchlist grid */}
            <div className="px-6 md:px-16 flex-1">
                {watchlists.length === 0 ? (
                    <p className="text-gray-500 text-lg text-center">No watchlists yet — create one above!</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-10">
                        {watchlists.map(watchlist => (
                            <div key={watchlist.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-white font-bold text-xl">{watchlist.name}</h2>
                                        <p className="text-gray-400 text-sm mt-1">
                                            {watchlist.movies?.length || 0} {watchlist.movies?.length === 1 ? 'movie' : 'movies'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(watchlist.id)}
                                        className="text-gray-500 hover:text-orange-400 transition-colors text-sm"
                                    >
                                        🗑 Delete
                                    </button>
                                </div>

                                {/* Movie poster previews */}
                                {watchlist.movies?.length > 0 ? (
                                    <div className="flex gap-2 mb-4">
                                        {watchlist.movies.slice(0, 3).map(movie => (
                                            <div key={movie.id} className="relative">
                                                <img
                                                    src={`${IMAGE_URL}${movie.poster_path}`}
                                                    alt={movie.title}
                                                    className="w-20 h-28 object-cover rounded-lg border border-white/10"
                                                />
                                                {isFavourite(movie.id) && (
                                                    <span className="absolute top-1 right-1 text-xs">❤️</span>
                                                )}
                                            </div>
                                        ))}
                                        {watchlist.movies.length > 3 && (
                                            <div className="w-20 h-28 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-gray-400 text-sm font-semibold">
                                                +{watchlist.movies.length - 3}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-28 flex items-center justify-center text-gray-600 text-sm mb-4 border border-dashed border-white/10 rounded-lg">
                                        No movies yet
                                    </div>
                                )}

                                <Link
                                    to={`/watchlists/${watchlist.id}`}
                                    className="block w-full text-center bg-white/10 hover:bg-orange-500/20 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                                >
                                    View Watchlist →
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="border-t border-white/10 px-6 md:px-16 py-10 mt-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <p className="text-2xl font-black">
                            <span className="text-orange-500">K</span>
                            <span className="text-white">-Flix</span>
                        </p>
                        <p className="text-gray-500 text-sm mt-1">Your personal movie discovery app</p>
                    </div>
                    <div className="flex items-center gap-8 text-sm text-gray-500">
                        <a href="/" className="hover:text-white transition-colors">Home</a>
                        <a href="/search" className="hover:text-white transition-colors">Search</a>
                        <a href="/advanced-search" className="hover:text-white transition-colors">Advanced Search</a>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-500 text-sm">Powered by</p>
                        <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="text-white font-semibold text-sm hover:text-orange-400 transition-colors">
                            🎬 The Movie Database (TMDB)
                        </a>
                    </div>
                </div>
                <div className="border-t border-white/5 mt-8 pt-6 text-center text-white text-xs">
                    © {new Date().getFullYear()} K-Flix - Designed by <span className="text-orange-500">Kudzayi Chimbodza</span>. Built with React & TMDB API.
                </div>
            </footer>
        </div>
    )
}

export default Watchlists