import * as categoriesService from './expense-categories.service.js';

export async function list(_req, res) {
  const categories = await categoriesService.listCategories();
  res.json({ data: categories });
}
