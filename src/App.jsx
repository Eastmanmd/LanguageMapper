import { NavLink, Route, Routes } from 'react-router-dom'
import Home from './components/tabs/Home'
import MapExplorer from './components/tabs/MapExplorer'
import CompareLanguages from './components/tabs/CompareLanguages'
import Blog from './components/tabs/Blog'
import Contribute from './components/tabs/Contribute'
import Admin from './components/tabs/Admin'
import { SunIcon, MoonIcon } from './components/icons'
import { useTheme } from './context/ThemeContext'

const TABS = [
  { path: '/', label: 'Home', end: true },
  { path: '/map', label: 'Map' },
  { path: '/compare', label: 'Compare languages' },
  { path: '/contribute', label: 'Contribute' },
  { path: '/blog', label: 'Blog' },
]

function App() {
  const { dark, toggleDark } = useTheme()

  return (
    <div className="flex h-full flex-col bg-white transition-colors dark:bg-[#0a0a0a]">
      <header className="border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center justify-between px-6 pt-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span className="text-[15px] font-medium tracking-tight text-gray-900 dark:text-white">
              LanguageMap
            </span>
          </div>
          <button
            onClick={toggleDark}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 dark:border-white/15 dark:text-gray-300 dark:hover:border-white/30"
          >
            {dark ? <SunIcon className="h-3.5 w-3.5" /> : <MoonIcon className="h-3.5 w-3.5" />}
            {dark ? 'Light' : 'Dark'}
          </button>
        </div>

        <nav className="flex gap-6 px-6 pt-4">
          {TABS.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.end}
              className={({ isActive }) =>
                `border-b-2 pb-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapExplorer />} />
          <Route path="/map/:stateId" element={<MapExplorer />} />
          <Route path="/compare" element={<CompareLanguages />} />
          <Route path="/contribute" element={<Contribute />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
