import * as categoriesRepository from './expense-categories.repository.js';

export function listCategories() {
  return categoriesRepository.listActiveCategories();
}
