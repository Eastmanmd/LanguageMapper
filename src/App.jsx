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
      <div className="fabric-band h-1 shrink-0" />
      <header className="border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center justify-between px-6 pt-4">
          <div className="flex items-center gap-2.5">
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-6 w-6" />
            <span className="text-[15px] font-medium tracking-tight text-gray-900 dark:text-white">
              LanguageMapper
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
                    ? 'border-naija-600 text-naija-600 dark:border-naija-400 dark:text-naija-400'
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
