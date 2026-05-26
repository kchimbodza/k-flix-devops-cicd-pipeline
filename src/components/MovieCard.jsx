import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFavourites } from '../context/FavouritesContext'
import { useAuth } from '../context/AuthContext'

// noinspection JSUnresolvedVariable
const IMAGE_URL = import.meta.env.VITE_TMDB_IMAGE_URL

const MovieCard = ({ movie, showHeartOnHover = false }) => {
    const year = movie.release_date?.split("-")[0]
    const { isFavourite, addFavourite, removeFavourite } = useFavourites()
    const { user } = useAuth()
    const favourited = isFavourite(movie.id)
    const [showPopup, setShowPopup] = useState(false)

    const handleFavourite = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!user) {
            setShowPopup(true)
            return
        }
        favourited ? await removeFavourite(movie.id) : await addFavourite(movie)
    }

    return (
        <>
            {showPopup && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl">
                        <h2 className="text-white text-2xl font-bold mb-2">Join K-Flix!</h2>
                        <p className="text-gray-400 mb-6">Create an account to save your favourite movies permanently.</p>
                        <div className="flex gap-3 justify-center">
                            <Link to="/register" className="bg-orange-500 text-white px-6 py-2 rounded-full hover:bg-orange-600 font-semibold">Sign Up</Link>
                            <Link to="/login" className="bg-white/10 text-white px-6 py-2 rounded-full hover:bg-white/20">Login</Link>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowPopup(false)}
                            className="mt-5 text-gray-500 text-sm hover:text-white"
                        >
                            Maybe later
                        </button>
                    </div>
                </div>
            )}
            <Link to={`/movies/${movie.id}`}>
                <div className="rounded-3xl overflow-hidden hover:scale-105 transition-transform duration-300 hover:ring-2 hover:ring-orange-500">
                    <div className="relative group">
                        <img
                            src={`${IMAGE_URL}${movie.poster_path}`}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                        />

                        {/* Heart button */}
                        {user ? (
                            <button
                                type="button"
                                onClick={handleFavourite}
                                className={`absolute top-2 right-2 text-2xl drop-shadow-lg transition-opacity duration-200
                                    ${showHeartOnHover && !favourited ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
                                title={favourited ? 'Remove from Favourites' : 'Add to Favourites'}
                            >
                                {favourited ? '❤️' : '🤍'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleFavourite}
                                className="absolute top-2 right-2 text-2xl drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                title="Sign up to add favourites"
                            >
                                🤍
                            </button>
                        )}

                        {/* Info overlay — shows on hover */}
                        <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {/* Orange top line */}
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
                            {/* Info overlay */}
                            <div className="bg-gradient-to-t from-black via-black/80 to-transparent p-4">
                                <h3 className="text-white font-semibold text-sm truncate">{movie.title}</h3>
                                <div className="flex justify-between mt-1">
                                    <p className="text-yellow-400 text-sm">⭐ {movie.vote_average?.toFixed(1)}</p>
                                    <p className="text-gray-400 text-sm">{year}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </>
    )
}

export default MovieCard