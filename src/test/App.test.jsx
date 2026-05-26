import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

// Mock TMDB API calls so tests don't need a real API key
vi.mock('axios')

// Mock all page components to keep tests fast and isolated
vi.mock('../pages/Home', () => ({ default: () => <div>Home Page</div> }))
vi.mock('../pages/Search', () => ({ default: () => <div>Search Page</div> }))
vi.mock('../pages/MovieDetails', () => ({ default: () => <div>Movie Details</div> }))
vi.mock('../pages/Login', () => ({ default: () => <div>Login Page</div> }))
vi.mock('../pages/Register', () => ({ default: () => <div>Register Page</div> }))
vi.mock('../pages/Profile', () => ({ default: () => <div>Profile Page</div> }))
vi.mock('../pages/Favourites', () => ({ default: () => <div>Favourites Page</div> }))
vi.mock('../pages/AdvancedSearch', () => ({ default: () => <div>Advanced Search Page</div> }))
vi.mock('../pages/Watchlists', () => ({ default: () => <div>Watchlists Page</div> }))
vi.mock('../pages/WatchlistDetail', () => ({ default: () => <div>Watchlist Detail Page</div> }))
vi.mock('../components/Navbar', () => ({ default: () => <nav>Navbar</nav> }))
vi.mock('../components/ProtectedRoute', () => ({ default: ({ children }) => children }))

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(document.body).toBeTruthy()
  })

  it('renders the Navbar', () => {
    render(<App />)
    expect(screen.getByText('Navbar')).toBeInTheDocument()
  })

  it('renders the Home page on default route', () => {
    render(<App />)
    expect(screen.getByText('Home Page')).toBeInTheDocument()
  })
})
