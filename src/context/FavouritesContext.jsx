import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { getUserFavourites, addUserFavourite, removeUserFavourite } from '../services/api'

const FavouritesContext = createContext(undefined)

export const FavouritesProvider = ({ children }) => {
    const { user } = useAuth()
    const [favourites, setFavourites] = useState([])

    useEffect(() => {
        const loadFavourites = async () => {
            if (!user) {
                const saved = localStorage.getItem('favourites_guest')
                setFavourites(saved ? JSON.parse(saved) : [])
                return
            }

            const dbFavourites = await getUserFavourites(user.id)

            const mapped = dbFavourites.map(f => ({
                ...f,
                id: f.movieId,
                dbId: f.id
            }))

            const localRaw = localStorage.getItem(`favourites_${user.id}`)
            const localFavourites = localRaw ? JSON.parse(localRaw) : []
            const dbMovieIds = dbFavourites.map(f => f.movieId)
            const toAdd = localFavourites.filter(m => !dbMovieIds.includes(m.id))

            for (const movie of toAdd) {
                const savedEntry = await addUserFavourite(user.id, movie)
                mapped.push({
                    ...movie,
                    id: movie.id,
                    movieId: movie.id,
                    dbId: savedEntry.id
                })
            }

            localStorage.removeItem(`favourites_${user.id}`)
            setFavourites(mapped)
        }

        void loadFavourites()
    }, [user])

    const addFavourite = async (movie) => {
        if (!user) {
            const updated = [...favourites, movie]
            setFavourites(updated)
            localStorage.setItem('favourites_guest', JSON.stringify(updated))
            return
        }
        if (favourites.some(f => f.movieId === movie.id)) return
        // Optimistic update
        setFavourites(prev => [...prev, { ...movie, id: movie.id, movieId: movie.id }])
        const savedEntry = await addUserFavourite(user.id, { ...movie, movieId: movie.id })
        setFavourites(prev => prev.map(f =>
            f.movieId === movie.id ? { ...f, dbId: savedEntry.id } : f
        ))
    }

    const removeFavourite = async (movieId) => {
        if (!user) {
            const updated = favourites.filter(m => m.id !== movieId)
            setFavourites(updated)
            localStorage.setItem('favourites_guest', JSON.stringify(updated))
            return
        }
        // Optimistic update
        setFavourites(prev => prev.filter(f => f.movieId !== movieId))
        const match = favourites.find(f => f.movieId === movieId)
        if (match?.dbId) await removeUserFavourite(match.dbId)
    }

    const isFavourite = (movieId) => {
        return favourites.some(f => f.movieId === movieId || f.id === movieId)
    }

    return (
        <FavouritesContext.Provider value={{ favourites, addFavourite, removeFavourite, isFavourite }}>
            {children}
        </FavouritesContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFavourites = () => useContext(FavouritesContext)