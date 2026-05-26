import { useState, useEffect } from 'react'
import { getTrending } from '../services/tmdb'

// noinspection JSUnresolvedVariable
const IMAGE_URL = import.meta.env.VITE_TMDB_IMAGE_URL

const PosterBackground = () => {
    const [posters, setPosters] = useState([])

    useEffect(() => {
        const fetchPosters = async () => {
            try {
                const movies = await getTrending()
                setPosters(movies.slice(0, 12))
            } catch {
                setPosters([])
            }
        }
        void fetchPosters()
    }, [])

    return (
        <div className="absolute inset-0 z-0">
            <div className="grid grid-cols-4 gap-1 w-full h-full">
                {posters.map((movie, i) => (
                    <div key={i} className="overflow-hidden">
                        <img
                            src={`${IMAGE_URL}${movie.poster_path}`}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
            </div>
            <div className="absolute inset-0 bg-gray-950/92" />
        </div>
    )
}

export default PosterBackground