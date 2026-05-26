import { useState, useEffect } from 'react'
import { discoverMovies, getGenres } from '../services/tmdb'
import MovieCard from '../components/MovieCard'

const AdvancedSearch = () => {
    const [genres, setGenres] = useState([])
    const [movies, setMovies] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [filters, setFilters] = useState({
        genre: '',
        yearFrom: '',
        yearTo: '',
        rating: '',
        language: ''
    })

    useEffect(() => {
        const fetchGenres = async () => {
            const data = await getGenres()
            setGenres(data)
        }
        void fetchGenres()
    }, [])

    const handleChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value })
    }

    const handleSearch = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await discoverMovies(filters)
            if (data.length === 0) setError('No movies found')
            setMovies(data)
        } catch {
            setError('Search failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const inputClass = "w-full p-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
    const selectClass = "w-full p-3 rounded-xl bg-gray-900 border border-white/10 text-white focus:outline-none focus:border-orange-500 transition-colors"
    const labelClass = "text-gray-400 text-sm mb-2 block"

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col px-6 md:px-16 pt-48 pb-12">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Advanced Search</h1>
                <p className="text-gray-400 text-sm">Filter movies by genre, year, rating and language</p>
            </div>

            {/* Filters */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 md:p-8 mb-10 max-w-5xl mx-auto w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                        <label className={labelClass}>Genre</label>
                        <select
                            name="genre"
                            value={filters.genre}
                            onChange={handleChange}
                            className={selectClass}
                        >
                            <option value="">All Genres</option>
                            {genres.map(genre => (
                                <option key={genre.id} value={genre.id}>{genre.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Year From</label>
                        <input
                            type="number"
                            name="yearFrom"
                            value={filters.yearFrom}
                            onChange={handleChange}
                            placeholder="e.g. 2000"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Year To</label>
                        <input
                            type="number"
                            name="yearTo"
                            value={filters.yearTo}
                            onChange={handleChange}
                            placeholder="e.g. 2026"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Min Rating</label>
                        <input
                            type="number"
                            name="rating"
                            value={filters.rating}
                            onChange={handleChange}
                            placeholder="e.g. 7"
                            min="0"
                            max="10"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Language</label>
                        <select
                            name="language"
                            value={filters.language}
                            onChange={handleChange}
                            className={selectClass}
                        >
                            <option value="">All Languages</option>
                            <option value="en">English</option>
                            <option value="fr">French</option>
                            <option value="es">Spanish</option>
                            <option value="de">German</option>
                            <option value="ja">Japanese</option>
                            <option value="ko">Korean</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={handleSearch}
                            className="w-full bg-orange-500 text-white py-3 rounded-full font-bold hover:bg-orange-600 transition-all"
                        >
                            Search
                        </button>
                    </div>
                </div>
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
                    <p className="text-gray-400 text-sm mb-6">{movies.length} results found</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                        {movies.map(movie => (
                            <MovieCard key={movie.id} movie={movie} />
                        ))}
                    </div>
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

export default AdvancedSearch