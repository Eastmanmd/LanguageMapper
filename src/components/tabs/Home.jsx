import { useState } from 'react'
import ChatShowcase from './ChatShowcase'

const FEATURES = [
  {
    title: 'Interactive map',
    description:
      'Click any region on a live, zoomable map to see which languages are spoken there.',
    badge: null,
  },
  {
    title: 'Language profiles',
    description:
      'Explore linguistic classification, associated ethnic groups, and the closest relatives of each language.',
    badge: null,
  },
  {
    title: 'Compare languages',
    description:
      'Put two or more languages side by side, compare 12 basic words, and see a similarity tree.',
    badge: null,
  },
  {
    title: 'Blog',
    description: 'Articles and research notes on language documentation and mapping.',
    badge: 'Coming soon',
  },
]

const STATS = [
  { value: '37', label: 'States mapped in Nigeria' },
  { value: '350+', label: 'Languages catalogued' },
  { value: '1', label: 'Country live today' },
]

function SunIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <circle cx="10" cy="10" r="3.2" />
      <path
        strokeLinecap="round"
        d="M10 1.8v2M10 16.2v2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M1.8 10h2M16.2 10h2M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4"
      />
    </svg>
  )
}

function MoonIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M17 11.5A7 7 0 0 1 8.5 3a7 7 0 1 0 8.5 8.5Z" />
    </svg>
  )
}

export default function Home({ onNavigate }) {
  const [dark, setDark] = useState(false)

  return (
    <div
      className={`${dark ? 'dark' : ''} flex-1 overflow-y-auto bg-white transition-colors dark:bg-[#0a0a0a]`}
    >
      <div className="flex justify-end px-6 pt-6 md:px-10">
        <button
          onClick={() => setDark((d) => !d)}
          className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 dark:border-white/15 dark:text-gray-300 dark:hover:border-white/30"
        >
          {dark ? <SunIcon className="h-3.5 w-3.5" /> : <MoonIcon className="h-3.5 w-3.5" />}
          {dark ? 'Light' : 'Dark'}
        </button>
      </div>

      <section className="px-6 pt-8 pb-16 md:px-10 md:pt-12 md:pb-24">
        <div className="flex flex-col gap-12 md:flex-row md:items-center">
          <div className="md:flex-1">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              LanguageMap
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-medium leading-[1.1] tracking-tight text-gray-900 md:text-6xl dark:text-white">
              Mapping the world&apos;s languages, region by region.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600 dark:text-gray-400">
              An interactive tool for exploring linguistic diversity. Click a region to
              see its languages, then dig into classification, ethnic groups, and
              linguistic relatives. The project is launching with Nigeria as its first
              fully mapped region, with the data model built to extend worldwide.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('map')}
                className="rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                Explore the map
              </button>
            </div>
          </div>

          <div className="md:flex-1">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <ChatShowcase />
            </div>
            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
              &ldquo;Hello&rdquo; in four of the 350+ languages catalogued so far.
            </p>
          </div>
        </div>
      </section>

      <div className="border-t border-gray-200 px-6 md:px-10 dark:border-white/10">
        <div className="grid grid-cols-1 gap-8 py-10 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-medium tracking-tight text-gray-900 dark:text-white">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="border-t border-gray-200 px-6 py-16 md:px-10 md:py-20 dark:border-white/10">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          What you can do
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-gray-200 p-6 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10">
                <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
              </div>
              <div className="mt-4 flex items-center gap-2">
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                {feature.badge && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-white/10 dark:text-gray-400">
                    {feature.badge}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-gray-200 px-6 py-16 md:px-10 md:py-20 dark:border-white/10">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-medium tracking-tight text-gray-900 md:text-3xl dark:text-white">
            Starting with Nigeria
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400">
            Nigeria alone is home to hundreds of languages across several major
            language families &mdash; Niger-Congo, Afro-Asiatic, and Nilo-Saharan among
            them. It's a natural place to start: linguistically dense, well-documented,
            and geographically compact enough to map state by state. From here, the
            same data model extends to other countries and regions over time.
          </p>
          <button
            onClick={() => onNavigate('map')}
            className="mt-6 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            See the Nigeria map &rarr;
          </button>
        </div>
      </section>
    </div>
  )
}
