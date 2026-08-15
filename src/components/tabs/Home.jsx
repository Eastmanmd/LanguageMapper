import { useNavigate } from 'react-router-dom'
import ChatShowcase from './ChatShowcase'
import { NigeriaFlagIcon } from '../icons'

const FEATURES = [
  {
    title: 'Interactive map',
    description:
      'Click any region on a live, zoomable map to see which languages are spoken there.',
    badge: null,
    emoji: '🗺️',
    iconBg: 'bg-naija-50 dark:bg-naija-500/10',
    path: '/map',
  },
  {
    title: 'Language profiles',
    description:
      'Explore linguistic classification, associated ethnic groups, and the closest relatives of each language.',
    badge: null,
    emoji: '🌍',
    iconBg: 'bg-adire-50 dark:bg-adire-500/10',
    path: '/map',
  },
  {
    title: 'Compare languages',
    description:
      'Put two or more languages side by side, compare 23 basic words, and see a similarity tree.',
    badge: null,
    emoji: '🌳',
    iconBg: 'bg-ankara-50 dark:bg-ankara-500/10',
    path: '/compare',
  },
  {
    title: 'Contribute',
    description:
      'Flag incorrect words, fill in missing word lists, or propose a new language. Every submission is reviewed before it goes live.',
    badge: null,
    emoji: '✍️',
    iconBg: 'bg-naija-50 dark:bg-naija-500/10',
    path: '/contribute',
  },
  {
    title: 'Blog',
    description: 'Articles and research notes on language documentation and mapping.',
    badge: 'Coming soon',
    emoji: '📝',
    iconBg: 'bg-ankara-50 dark:bg-ankara-500/10',
    path: '/blog',
  },
]

const STATS = [
  { value: '37', label: 'States mapped (incl. FCT)', color: 'text-naija-600 dark:text-naija-400' },
  { value: '239', label: 'Languages catalogued', color: 'text-adire-600 dark:text-adire-400' },
  { value: '3', label: 'Major language families', color: 'text-ankara-600 dark:text-ankara-400' },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="flex-1 overflow-y-auto bg-white transition-colors dark:bg-[#0a0a0a]">
      <section className="relative overflow-hidden px-6 pt-8 pb-16 md:px-10 md:pt-12 md:pb-24">
        <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-gradient-to-br from-naija-400/25 via-adire-400/20 to-ankara-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-gradient-to-tr from-adire-400/15 to-naija-400/20 blur-3xl" />
        {/* Adire cloth behind the hero, faded out toward the text so it reads as
            texture rather than pattern. */}
        <div
          className="fabric-adire pointer-events-none absolute inset-0"
          style={{
            maskImage: 'radial-gradient(70% 65% at 92% 8%, #000 0%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(70% 65% at 92% 8%, #000 0%, transparent 70%)',
          }}
        />

        <div className="relative flex flex-col gap-12 md:flex-row md:items-center">
          <div className="animate-rise-in md:flex-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-3 py-1 text-xs font-medium text-gray-600 dark:border-white/15 dark:bg-white/5 dark:text-gray-300">
              <NigeriaFlagIcon className="h-3 w-4.5 shrink-0" />
              Mapping the languages of Nigeria
            </span>
            <h1 className="mt-5 max-w-xl text-4xl font-medium leading-[1.1] tracking-tight text-gray-900 md:text-6xl dark:text-white">
              Tracing words back to their{' '}
              <span className="bg-gradient-to-r from-naija-600 to-adire-600 bg-clip-text text-transparent dark:from-naija-400 dark:to-adire-400">
                shared origins
              </span>
              .
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600 dark:text-gray-400">
              LanguageMapper is a tool for mapping and reconstructing the shared
              origins of words across the languages of Nigeria. Compare
              vocabulary side by side, explore how languages relate, and see
              where each one is spoken &mdash; state by state, across all 37
              states.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/map')}
                className="rounded-full bg-gradient-to-r from-naija-600 to-adire-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-naija-600/20 transition-transform hover:scale-[1.03] dark:from-naija-500 dark:to-adire-500"
              >
                Explore the map
              </button>
              <button
                onClick={() => navigate('/contribute')}
                className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-white/15 dark:text-gray-200 dark:hover:border-white/30 dark:hover:bg-white/5"
              >
                Contribute a word ✍️
              </button>
            </div>
          </div>

          <div className="animate-rise-in md:flex-1" style={{ animationDelay: '0.15s' }}>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-naija-600/5 transition-transform hover:-rotate-1 dark:border-white/10 dark:bg-white/5">
              <ChatShowcase />
            </div>
            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
              &ldquo;Hello&rdquo; in four of the 239 Nigerian languages catalogued so far.
            </p>
          </div>
        </div>
      </section>

      <div className="border-t border-gray-200 px-6 md:px-10 dark:border-white/10">
        <div className="grid grid-cols-1 gap-8 py-10 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className={`text-3xl font-semibold tracking-tight ${stat.color}`}>
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
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <button
              key={feature.title}
              onClick={() => navigate(feature.path)}
              className="rounded-2xl border border-gray-200 p-6 text-left transition-all hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-200/60 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/25 dark:hover:shadow-none"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${feature.iconBg}`}
              >
                {feature.emoji}
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
            </button>
          ))}
        </div>
      </section>

      <section className="border-t border-gray-200 px-6 py-16 md:px-10 md:py-20 dark:border-white/10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-naija-50 via-white to-adire-50 p-8 md:p-12 dark:from-naija-500/10 dark:via-transparent dark:to-adire-500/10">
          <div
            className="fabric-ankara pointer-events-none absolute inset-0"
            style={{
              maskImage: 'linear-gradient(255deg, #000 0%, transparent 45%)',
              WebkitMaskImage: 'linear-gradient(255deg, #000 0%, transparent 45%)',
            }}
          />
          <div className="relative max-w-2xl">
            <h2 className="flex items-center gap-3 text-2xl font-medium tracking-tight text-gray-900 md:text-3xl dark:text-white">
              Why Nigeria
              <NigeriaFlagIcon className="h-5 w-7.5 shrink-0 rounded-sm shadow-sm" />
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400">
              Nigeria holds some of the deepest linguistic diversity on Earth:
              hundreds of languages across three major families &mdash;
              Niger-Congo, Afro-Asiatic, and Nilo-Saharan &mdash; spoken side by
              side within one country. Much of the shared history behind these
              words is still waiting to be traced, and mapping it state by state
              is how this project does it &mdash; one country, done properly.
            </p>
            <button
              onClick={() => navigate('/map')}
              className="mt-6 text-sm font-medium text-naija-600 hover:underline dark:text-naija-400"
            >
              See the Nigeria map &rarr;
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
