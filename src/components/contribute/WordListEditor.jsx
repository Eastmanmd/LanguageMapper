import wordData from '../../data/wordComparison.json'
import { inputClass } from './fields'

/**
 * Grid of inputs for the master word list. `values` maps word id → string;
 * `existing` (optional) maps word id → the currently published value, shown
 * as context under each filled input.
 */
export default function WordListEditor({ values, onChange, existing = {} }) {
  return (
    <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {wordData.words.map((word) => (
        <label key={word.id} className="block">
          <span className="text-xs font-medium capitalize text-gray-600 dark:text-gray-300">
            {word.en}
          </span>
          {existing[word.id] && (
            <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
              currently: {existing[word.id]}
            </span>
          )}
          <input
            className={`${inputClass} mt-1`}
            value={values[word.id] ?? ''}
            maxLength={200}
            onChange={(e) => onChange({ ...values, [word.id]: e.target.value })}
          />
        </label>
      ))}
    </div>
  )
}
