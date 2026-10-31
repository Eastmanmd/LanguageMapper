export function P({ children }) {
  return <p className="mt-4 leading-relaxed text-gray-700 dark:text-gray-300">{children}</p>
}

export function Ul({ children }) {
  return (
    <ul className="mt-4 list-disc space-y-3 pl-5 leading-relaxed text-gray-700 marker:text-gray-400 dark:text-gray-300 dark:marker:text-gray-500">
      {children}
    </ul>
  )
}

export function Ol({ children }) {
  return (
    <ol className="mt-4 list-decimal space-y-3 pl-5 leading-relaxed text-gray-700 marker:text-gray-400 dark:text-gray-300 dark:marker:text-gray-500">
      {children}
    </ol>
  )
}

export function Li({ children }) {
  return <li className="pl-1">{children}</li>
}
