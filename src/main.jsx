import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { FavouritesProvider } from './context/FavouritesContext'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AuthProvider>
            <FavouritesProvider>
                <App />
            </FavouritesProvider>
        </AuthProvider>
    </StrictMode>,
)