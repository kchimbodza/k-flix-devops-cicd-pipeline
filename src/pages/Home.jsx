import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTrending } from '../services/tmdb'
import { useFavourites } from '../context/FavouritesContext'
import { useAuth } from '../context/AuthContext'
import MovieCard from '../components/MovieCard'

// noinspection JSUnresolvedVariable
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original'

const Home = () => {
    const [movies, setMovies] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const { isFavourite, addFavourite, removeFavourite } = useFavourites()
    const { user } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const data = await getTrending()
                setMovies(data)
            } catch {
                setError('Failed to fetch movies')
            } finally {
                setLoading(false)
            }
        }
        void fetchMovies()
    }, [])

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
            <div className="text-white text-xl animate-pulse">Loading...</div>
        </div>
    )
    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
            <div className="text-orange-500 text-xl">{error}</div>
        </div>
    )

    const hero = movies[0]
    const featured = movies.slice(1, 10)
    const favourited = hero ? isFavourite(hero.id) : false

    const handleHeroFavourite = () => {
        if (!user) { navigate('/register'); return }
        favourited ? removeFavourite(hero.id) : addFavourite(hero)
    }

    return (
        <div className="min-h-screen bg-gray-950">

            {/* Hero Section */}
            {hero && (
                <div className="relative min-h-screen flex items-center pb-16 md:pb-32">
                    {/* Backdrop */}
                    <div className="absolute inset-0 z-0">
                        <img
                            src={`${BACKDROP_URL}${hero.backdrop_path}`}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/70 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />
                    </div>

                    {/* Hero content */}
                    <div className="relative z-10 px-6 md:px-16 max-w-2xl pt-24 landscape:pt-32 md:pt-0">
                        <div className="flex items-center gap-3 mb-3 text-lg text-gray-300">
                            <span className="text-orange-400">⭐ {hero.vote_average?.toFixed(1)}</span>
                            <span className="text-gray-600">•</span>
                            <span>{hero.release_date?.split('-')[0]}</span>
                        </div>
                        <h1 className="text-2xl md:text-4xl lg:text-6xl font-black text-white mb-1 leading-tight">
                            {hero.title}
                        </h1>
                        <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-8 max-w-lg">
                            {hero.overview?.slice(0, 180)}...
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                            <button
                                type="button"
                                onClick={handleHeroFavourite}
                                className="bg-orange-500 text-white px-6 md:px-8 py-3 rounded-full font-bold hover:bg-orange-600 transition-all flex items-center gap-2"
                            >
                                {favourited ? '❤️ Remove Favourite' : '🤍 Add to Favourites'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(`/movies/${hero.id}`)}
                                className="bg-white/10 backdrop-blur border border-white/20 text-white px-6 md:px-8 py-3 rounded-full font-semibold hover:bg-white/20 transition-all"
                            >
                                ℹ️ Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Trending Movies */}
            <div className="px-4 md:px-16 -mt-8 md:-mt-16 relative z-10 pb-16">
                <h2 className="text-white text-2xl font-bold mb-6">Trending Movies</h2>
                <div className="flex gap-4 md:gap-10 overflow-x-auto pb-4 custom-scrollbar py-4 pl-2">
                    {featured.map(movie => (
                        <div key={movie.id} className="flex-shrink-0 w-36 md:w-56">
                            <MovieCard movie={movie} showHeartOnHover={true} />
                        </div>
                    ))}
                </div>
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

export default Home