import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUserWatchlists, updateWatchlist } from '../services/api'
import { useAuth } from '../context/AuthContext'
import MovieCard from '../components/MovieCard'

const WatchlistDetail = () => {
    const { id } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [watchlist, setWatchlist] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const fetchWatchlist = async () => {
            try {
                const data = await getUserWatchlists(user.id)
                const found = data.find(w => w.id === id)
                if (!found) setError('Watchlist not found')
                setWatchlist(found)
            } catch {
                setError('Failed to load watchlist')
            } finally {
                setLoading(false)
            }
        }
        void fetchWatchlist()
    }, [id, user.id])

    const handleRemoveMovie = async (movieId) => {
        const updated = watchlist.movies.filter(m => m.id !== movieId)
        try {
            await updateWatchlist(id, { movies: updated })
            setWatchlist(prev => ({ ...prev, movies: updated }))
        } catch {
            setError('Failed to remove movie')
        }
    }

    const handleShare = async () => {
        if (navigator.share) {
            await navigator.share({
                title: watchlist.name,
                text: `Check out my "${watchlist.name}" watchlist on K-Flix!`,
                url: window.location.href
            })
        } else {
            await navigator.clipboard.writeText(window.location.href)
            setCopied(true)
            setTimeout(() => setCopied(false), 3000)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <p className="text-white text-xl">Loading...</p>
        </div>
    )
    if (error) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <p className="text-orange-400 text-xl">{error}</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col py-12 pt-48">
            {/* Header */}
            <div className="max-w-5xl mx-auto px-6 mb-10 w-full">
                <div className="flex items-center justify-between mb-8">
                    <button
                        type="button"
                        onClick={() => navigate('/watchlists')}
                        className="text-gray-400 hover:text-orange-400 transition-colors text-sm"
                    >
                        ← Back to Watchlists
                    </button>
                    <button
                        type="button"
                        onClick={handleShare}
                        className="bg-white/10 border border-white/10 text-white px-5 py-2 rounded-xl hover:bg-orange-500/20 hover:border-orange-500/30 text-sm font-semibold transition-colors"
                    >
                        🔗 Share Watchlist
                    </button>
                </div>

                <p className="text-orange-500 text-sm font-semibold uppercase tracking-widest mb-2">Watchlist</p>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{watchlist.name}</h1>
                <p className="text-gray-400">
                    {watchlist.movies?.length || 0} {watchlist.movies?.length === 1 ? 'movie' : 'movies'}
                </p>
            </div>

            {/* Movies grid */}
            <div className="px-6 md:px-16 flex-1">
                {watchlist.movies?.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg mb-6">No movies in this watchlist yet.</p>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="bg-orange-500 text-white px-8 py-3 rounded-xl hover:bg-orange-600 font-semibold transition-colors"
                        >
                            Browse Movies
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                        {watchlist.movies?.map(movie => (
                            <div key={movie.id}>
                                <MovieCard movie={movie} showHeartOnHover={true} />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        void handleRemoveMovie(movie.id)
                                    }}
                                    className="mt-4 w-full bg-white/10 text-white text-sm md:text-lg py-1.5 rounded-lg hover:bg-orange-500/20 hover:text-orange-400 transition-colors"
                                >
                                    Remove
                                </button>
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

            {/* Toast notification */}
            {copied && (
                <div className="fixed top-24 right-8 z-50 bg-gray-900 border border-orange-500/30 rounded-xl px-5 py-3 shadow-2xl flex items-center gap-3">
                    <span className="text-orange-500">🔗</span>
                    <p className="text-white text-sm font-medium">Link copied to clipboard!</p>
                </div>
            )}
        </div>
    )
}

export default WatchlistDetail