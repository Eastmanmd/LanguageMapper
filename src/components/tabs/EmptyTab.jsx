export default function EmptyTab({ title, description }) {
  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-16 dark:bg-[#0a0a0a]">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-naija-50 to-naija-100 dark:from-naija-500/10 dark:to-naija-500/20">
          <div className="h-2.5 w-2.5 rounded-full bg-naija-600 dark:bg-naija-400" />
        </div>
        <h2 className="text-base font-medium text-gray-900 dark:text-white">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </div>
  )
}
