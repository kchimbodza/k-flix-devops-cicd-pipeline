import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [scrolled, setScrolled] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleLogout = () => {
        logout()
        navigate('/')
        setMenuOpen(false)
    }

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-40 px-6 md:px-16 py-5 md:py-7 flex items-center justify-between transition-all duration-300 ${
                scrolled || menuOpen ? 'bg-gray-950/90 backdrop-blur-md' : 'bg-gray-950/30 backdrop-blur-sm'
            }`}>
                {/* Logo */}
                <Link to="/" className="text-3xl md:text-4xl font-black tracking-tight">
                    <span className="text-orange-500">K</span>
                    <span className="text-white">-Flix</span>
                </Link>

                {/* Centered nav links — desktop only */}
                <div className="hidden md:flex items-center gap-12">
                    <Link to="/" className="text-gray-300 hover:text-white text-lg font-medium transition-colors">Home</Link>
                    <Link to="/search" className="text-gray-300 hover:text-white text-lg font-medium transition-colors">Search</Link>
                    {user && (
                        <>
                            <Link to="/advanced-search" className="text-gray-300 hover:text-white text-lg font-medium transition-colors">Advanced Search</Link>
                            <Link to="/favorites" className="text-gray-300 hover:text-white text-lg font-medium transition-colors">Favourites</Link>
                            <Link to="/watchlists" className="text-gray-300 hover:text-white text-lg font-medium transition-colors">Watchlists</Link>
                        </>
                    )}
                </div>

                {/* Right side — desktop */}
                <div className="hidden md:flex items-center gap-6">
                    <Link to="/search" className="text-gray-300 hover:text-white transition-colors" title="Search">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                        </svg>
                    </Link>
                    {user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-orange-500 text-lg font-bold">Hi, <span className="text-white font-semibold">{user.name}</span></span>
                            <Link to="/profile" title="Profile" className="w-11 h-11 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg hover:bg-orange-600 transition-colors">
                                {user.name?.charAt(0).toUpperCase()}
                            </Link>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="text-gray-300 hover:text-white text-lg font-medium transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-gray-300 hover:text-white text-lg font-medium transition-colors">Login</Link>
                            <Link to="/register" className="bg-orange-500 text-white px-5 py-2 rounded-full text-lg font-semibold hover:bg-orange-600 transition-colors">
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>

                {/* Hamburger button — mobile only */}
                <button
                    type="button"
                    className="md:hidden text-white"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    {menuOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>

                {/* Orange bottom border */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5"
                     style={{ background: 'linear-gradient(to right, transparent, #f97316, transparent)' }}
                />
            </nav>

            {/* Mobile menu dropdown */}
            {menuOpen && (
                <div className="fixed top-[72px] left-0 right-0 z-30 bg-gray-950/95 backdrop-blur-md border-t border-white/10 flex flex-col px-6 py-6 gap-5 md:hidden">
                    <Link to="/" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white text-lg font-medium transition-colors">Home</Link>
                    <Link to="/search" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white text-lg font-medium transition-colors">Search</Link>
                    {user && (
                        <>
                            <Link to="/advanced-search" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white text-lg font-medium transition-colors">Advanced Search</Link>
                            <Link to="/favorites" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white text-lg font-medium transition-colors">Favourites</Link>
                            <Link to="/watchlists" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white text-lg font-medium transition-colors">Watchlists</Link>
                            <Link to="/profile" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white text-lg font-medium transition-colors">Profile</Link>
                            <button type="button" onClick={handleLogout} className="text-left text-gray-300 hover:text-white text-lg font-medium transition-colors">Logout</button>
                        </>
                    )}
                    {!user && (
                        <div className="flex gap-4 mt-2">
                            <Link to="/login" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white text-lg font-medium transition-colors">Login</Link>
                            <Link to="/register" onClick={() => setMenuOpen(false)} className="bg-orange-500 text-white px-5 py-2 rounded-full text-lg font-semibold hover:bg-orange-600 transition-colors">Sign Up</Link>
                        </div>
                    )}
                </div>
            )}
        </>
    )
}

export default Navbar