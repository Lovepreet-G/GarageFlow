import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

document.documentElement.classList.remove("dark") // ensure no flash of dark mode on initial load
document.documentElement.style.colorScheme = "light" // enforce light mode for browsers that support color-scheme

localStorage.removeItem("theme") // clear any saved theme preference to always use light mode
localStorage.removeItem("dark") // clear any saved dark mode flag

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)