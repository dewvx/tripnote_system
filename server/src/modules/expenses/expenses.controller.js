import * as expensesService from './expenses.service.js';

export async function create(req, res) {
  const { expense, created } = await expensesService.createExpense(
    req.trip,
    req.user.id,
    req.valid.body,
  );
  res.status(created ? 201 : 200).json({ data: expense });
}

export async function list(req, res) {
  const expenses = await expensesService.listRecentExpenses(req.trip, req.valid.query);
  res.json({ data: expenses });
}
