import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useFavourites } from '../context/FavouritesContext'
import { Link } from 'react-router-dom'
import { getUserWatchlists } from '../services/api'
import MovieCard from '../components/MovieCard'

const Profile = () => {
    const { user } = useAuth()
    const { favourites } = useFavourites()
    const [watchlists, setWatchlists] = useState([])

    useEffect(() => {
        getUserWatchlists(user.id).then(setWatchlists)
    }, [user.id])

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col py-12 pt-48">
            <div className="max-w-5xl mx-auto px-6 w-full">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">My Profile</h1>

                {/* User Info */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 mb-10 flex items-center gap-6">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">{user?.name}</h2>
                        <p className="text-gray-400 text-sm md:text-base">{user?.email}</p>
                    </div>
                </div>

                {/* Watchlists */}
                <div className="mb-10">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl md:text-2xl font-bold text-white">My Watchlists</h2>
                        <Link to="/watchlists" className="text-orange-400 hover:text-orange-300 text-sm transition-colors">
                            Manage Watchlists →
                        </Link>
                    </div>
                    {watchlists.length === 0 ? (
                        <p className="text-gray-500">No watchlists yet —{' '}
                            <Link to="/watchlists" className="text-orange-400 hover:text-orange-300 transition-colors">
                                create one!
                            </Link>
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {watchlists.map(watchlist => (
                                <Link
                                    key={watchlist.id}
                                    to={`/watchlists/${watchlist.id}`}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-orange-500/30 hover:bg-orange-500/5 transition-colors"
                                >
                                    <h3 className="text-white font-semibold mb-1">{watchlist.name}</h3>
                                    <p className="text-gray-400 text-sm">
                                        {watchlist.movies?.length || 0} {watchlist.movies?.length === 1 ? 'movie' : 'movies'}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Favourites */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl md:text-2xl font-bold text-white">My Favourites</h2>
                        <Link to="/favorites" className="text-orange-400 hover:text-orange-300 text-sm transition-colors">
                            See All →
                        </Link>
                    </div>
                    {favourites.length === 0 ? (
                        <p className="text-gray-500">No favourites yet — start adding some!</p>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {favourites.slice(0, 5).map(movie => (
                                <MovieCard key={movie.id} movie={movie} showHeartOnHover={true} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

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

export default Profile