import axios from 'axios'

// noinspection JSUnresolvedVariable
const API_KEY = import.meta.env.VITE_TMDB_API_KEY

// noinspection JSUnresolvedVariable
const BASE_URL = import.meta.env.VITE_TMDB_BASE_URL

export const getTrending = async () => {
    const response = await axios.get(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}`)
    return response.data.results
}

export const searchMovies = async (query, page = 1) => {
    const response = await axios.get(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}&page=${page}`)
    return response.data
}

export const getMovieDetails = async (id) => {
    const response = await axios.get(`${BASE_URL}/movie/${id}?api_key=${API_KEY}`)
    return response.data
}

export const getSimilarMovies = async (id) => {
    const response = await axios.get(`${BASE_URL}/movie/${id}/similar?api_key=${API_KEY}`)
    return response.data.results
}

export const discoverMovies = async (filters) => {
    const { genre, yearFrom, yearTo, rating, language } = filters
    const response = await axios.get(`${BASE_URL}/discover/movie`, {
        params: {
            api_key: API_KEY,
            with_genres: genre,
            'primary_release_date.gte': yearFrom ? `${yearFrom}-01-01` : undefined,
            'primary_release_date.lte': yearTo ? `${yearTo}-12-31` : undefined,
            'vote_average.gte': rating,
            with_original_language: language,
        }
    })
    return response.data.results
}

export const getGenres = async () => {
    const response = await axios.get(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`)
    return response.data.genres
}