import { Link } from 'react-router-dom'
import { useFavourites } from '../context/FavouritesContext'
import { useAuth } from '../context/AuthContext'
import MovieCard from '../components/MovieCard'

const Favourites = () => {
    const { favourites } = useFavourites()
    const { user } = useAuth()

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col px-6 md:px-16 pt-48 pb-12">
            {/* Header */}
            <div className="mb-10 flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <p className="text-orange-500 text-sm font-semibold uppercase tracking-widest mb-1">Library</p>
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-1">My Favourites</h1>
                    <p className="text-gray-400 text-sm">
                        {favourites.length > 0 ? `${favourites.length} movie${favourites.length === 1 ? '' : 's'} saved` : ''}
                    </p>
                </div>
            </div>

            {favourites.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-32 text-center flex-1">
                    <p className="text-7xl mb-6">❤️</p>
                    <h2 className="text-2xl font-bold text-white mb-3">No favourites yet</h2>
                    {user ? (
                        <>
                            <p className="text-gray-400 mb-8 max-w-md">
                                Browse movies and click the heart icon to save them here.
                            </p>
                            <Link
                                to="/"
                                className="bg-orange-500 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-600 transition-all"
                            >
                                Browse Movies
                            </Link>
                        </>
                    ) : (
                        <>
                            <p className="text-gray-400 mb-8 max-w-md">
                                Create an account to save favourites permanently across devices!
                            </p>
                            <Link
                                to="/register"
                                className="bg-orange-500 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-600 transition-all"
                            >
                                Create Account
                            </Link>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 flex-1">
                    {favourites.map(movie => (
                        <MovieCard key={movie.id} movie={movie} />
                    ))}
                </div>
            )}

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

export default Favourites