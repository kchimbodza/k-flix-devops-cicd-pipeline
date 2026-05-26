import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Search from './pages/Search'
import MovieDetails from './pages/MovieDetails'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Favourites from './pages/Favourites'
import AdvancedSearch from './pages/AdvancedSearch'
import Watchlists from './pages/Watchlists'
import WatchlistDetail from './pages/WatchlistDetail'

const App = () => {
  return (
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/movies/:id" element={<MovieDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute><Favourites /></ProtectedRoute>} />
          <Route path="/advanced-search" element={<ProtectedRoute><AdvancedSearch /></ProtectedRoute>} />
          <Route path="/watchlists" element={<ProtectedRoute><Watchlists /></ProtectedRoute>} />
          <Route path="/watchlists/:id" element={<ProtectedRoute><WatchlistDetail /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
  )
}

export default App