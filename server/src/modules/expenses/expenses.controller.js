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
  const { expenses, meta } = await expensesService.listExpenses(req.trip, req.valid.query);
  res.json({ data: expenses, meta });
}

export async function summary(req, res) {
  const result = await expensesService.getSummary(req.trip);
  res.json({ data: result });
}

export async function update(req, res) {
  const expense = await expensesService.updateExpense(
    req.trip,
    req.valid.params.expenseId,
    req.valid.body,
  );
  res.json({ data: expense });
}

export async function remove(req, res) {
  await expensesService.deleteExpense(req.trip, req.valid.params.expenseId);
  res.status(204).end();
}
