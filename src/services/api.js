import axios from 'axios'

//const BASE_URL = 'http://localhost:3001'
const BASE_URL = '/api'

// Users
export const registerUser = async (userData) => {
    const response = await axios.post(`${BASE_URL}/users`, userData)
    return response.data
}

export const loginUser = async (email, password) => {
    const response = await axios.get(`${BASE_URL}/users`)
    return response.data.find(
        (u) => u.email === email && u.password === password
    )
}

// Favourites
export const getUserFavourites = async (userId) => {
    const response = await axios.get(`${BASE_URL}/favourites?userId=${userId}`)
    return response.data
}

export const addUserFavourite = async (userId, movie) => {
    const response = await axios.post(`${BASE_URL}/favourites`, {
        userId,
        movieId: movie.id,
        ...movie
    })
    return response.data
}

export const removeUserFavourite = async (id) => {
    await axios.delete(`${BASE_URL}/favourites/${id}`)
}

// Watchlists
export const getUserWatchlists = async (userId) => {
    const response = await axios.get(`${BASE_URL}/watchlists?userId=${userId}`)
    return response.data
}

export const createWatchlist = async (userId, name) => {
    const response = await axios.post(`${BASE_URL}/watchlists`, { userId, name, movies: [] })
    return response.data
}

export const updateWatchlist = async (id, data) => {
    const response = await axios.patch(`${BASE_URL}/watchlists/${id}`, data)
    return response.data
}

export const deleteWatchlist = async (id) => {
    await axios.delete(`${BASE_URL}/watchlists/${id}`)
}