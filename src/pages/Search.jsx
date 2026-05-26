import { useState } from 'react'
import { Link } from 'react-router-dom'
import { searchMovies } from '../services/tmdb'
import { useAuth } from '../context/AuthContext'
import MovieCard from '../components/MovieCard'

const Search = () => {
    const [query, setQuery] = useState('')
    const [movies, setMovies] = useState([])
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState(null)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const { user } = useAuth()

    const handleSearch = async () => {
        if (!query.trim()) return
        setLoading(true)
        setError(null)
        setPage(1)
        try {
            const { results, total_pages } = await searchMovies(query, 1)
            if (results.length === 0) setError('No movies found')
            setMovies(results)
            setHasMore(total_pages > 1)
        } catch {
            setError('Search failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleLoadMore = async () => {
        const nextPage = page + 1
        setLoadingMore(true)
        try {
            const { results, total_pages } = await searchMovies(query, nextPage)
            setMovies(prev => [...prev, ...results])
            setPage(nextPage)
            setHasMore(nextPage < total_pages)
        } catch {
            setError('Failed to load more.')
        } finally {
            setLoadingMore(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') void handleSearch()
    }

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col px-6 md:px-16 pt-48 pb-12">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-4xl font-black text-white mb-2">Search Movies</h1>
                {user && (
                    <p className="text-gray-400 text-sm pt-8">
                        Looking for more filters?{' '}
                        <Link to="/advanced-search" className="text-orange-500 hover:text-orange-400 font-semibold">
                            Try Advanced Search
                        </Link>
                    </p>
                )}
            </div>

            {/* Search bar */}
            <div className="flex gap-3 max-w-2xl mx-auto mb-10 w-full">
                <div className="flex-1 relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search for a movie..."
                        className="w-full pl-12 pr-4 py-4 rounded-full bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors text-base"
                    />
                </div>
                <button
                    type="button"
                    onClick={handleSearch}
                    className="bg-orange-500 text-white px-8 py-4 rounded-full font-bold hover:bg-orange-600 transition-all"
                >
                    Search
                </button>
            </div>

            {/* States */}
            {loading && (
                <p className="text-white text-center animate-pulse text-lg">Searching...</p>
            )}
            {error && (
                <p className="text-gray-400 text-center text-lg">{error}</p>
            )}

            {/* Results */}
            {movies.length > 0 && (
                <>
                    <p className="text-gray-400 text-sm mb-6">{movies.length} results loaded</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                        {movies.map(movie => (
                            <MovieCard key={movie.id} movie={movie} />
                        ))}
                    </div>

                    {/* Load More */}
                    {hasMore && (
                        <div className="text-center mt-10">
                            <button
                                type="button"
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="bg-orange-500 text-white px-10 py-3 rounded-full font-bold hover:bg-orange-600 transition-all disabled:opacity-50"
                            >
                                {loadingMore ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Footer */}
            <footer className="border-t border-white/10 px-6 md:px-16 py-10 mt-auto">
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

export default Search