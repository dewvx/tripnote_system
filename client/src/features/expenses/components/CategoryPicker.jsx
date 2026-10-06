import { categoryIcon } from '../categoryIcons.js';

// หมวดเป็นปุ่มไอคอนเรียงให้แตะ ไม่ใช่ dropdown (FEATURES.md F3.1)
export default function CategoryPicker({ categories, value, onChange, error }) {
  return (
    <fieldset>
      <legend className="font-medium">หมวด</legend>
      <div role="radiogroup" className="mt-1.5 grid grid-cols-4 gap-2">
        {categories.map((category) => {
          const selected = category.id === value;
          return (
            <button
              key={category.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(category.id)}
              className={`flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-xl border px-1 text-xs leading-tight ${
                selected
                  ? 'border-teal bg-teal/10 font-semibold text-teal-deep'
                  : 'border-line bg-paper active:bg-mist'
              }`}
            >
              <span aria-hidden="true" className="text-2xl">
                {categoryIcon(category.icon)}
              </span>
              {category.nameTh}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </fieldset>
  );
}
