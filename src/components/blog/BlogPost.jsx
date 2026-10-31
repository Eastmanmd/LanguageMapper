const STATUS_TONES = {
  strong: 'text-naija-700 dark:text-naija-400',
  mixed: 'text-adire-600 dark:text-adire-300',
  weak: 'text-ankara-700 dark:text-ankara-400',
}

export default function BlogPost({ post }) {
  return (
    <article>
      <header>
        <p className="text-sm text-gray-500 dark:text-gray-400">{post.date}</p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-balance text-gray-900 md:text-4xl dark:text-white">
          {post.title}
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-gray-500 dark:text-gray-400">{post.dek}</p>
      </header>

      <div className="mt-6 border-t border-gray-200 pt-2 dark:border-white/10">{post.intro}</div>

      {post.sections.map((section) => (
        <section key={section.heading} className="mt-10">
          <h2 className="text-xl font-medium tracking-tight text-gray-900 md:text-2xl dark:text-white">
            {section.heading}
          </h2>
          <p className={`mt-1 text-sm font-medium ${STATUS_TONES[section.status.tone]}`}>
            {section.status.label}
          </p>
          {section.body}
        </section>
      ))}

      <section className="mt-12 border-t border-gray-200 pt-8 dark:border-white/10">
        <h2 className="text-xl font-medium tracking-tight text-gray-900 dark:text-white">Sources</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm leading-relaxed text-gray-600 marker:text-gray-400 dark:text-gray-400 dark:marker:text-gray-500">
          {post.sources.map((source) => (
            <li
              key={source.id}
              id={`source-${source.id}`}
              className="scroll-mt-4 rounded pl-1 target:bg-naija-50 dark:target:bg-naija-500/15"
            >
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="break-words underline decoration-gray-300 underline-offset-2 hover:text-naija-700 hover:decoration-naija-700 dark:decoration-white/20 dark:hover:text-naija-400 dark:hover:decoration-naija-400"
              >
                {source.text}
              </a>
            </li>
          ))}
        </ol>
      </section>
    </article>
  )
}
