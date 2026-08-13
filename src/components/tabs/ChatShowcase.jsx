const MESSAGES = [
  { from: 'me', text: 'Hello 👋' },
  { from: 'them', text: 'Sannu', lang: 'Hausa' },
  { from: 'them', text: 'Ẹ n lẹ', lang: 'Yoruba' },
  { from: 'them', text: 'Ndewo', lang: 'Igbo' },
  { from: 'them', text: 'How far?', lang: 'Nigerian Pidgin' },
]

export default function ChatShowcase() {
  return (
    <div className="flex flex-col gap-3">
      {MESSAGES.map((message, index) => (
        <div
          key={index}
          className={`animate-rise-in flex ${message.from === 'me' ? 'justify-end' : 'justify-start'}`}
          style={{ animationDelay: `${0.3 + index * 0.25}s` }}
        >
          <div
            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
              message.from === 'me'
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white'
            }`}
          >
            <p>{message.text}</p>
            {message.lang && (
              <p className="mt-0.5 text-[11px] opacity-60">{message.lang}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
