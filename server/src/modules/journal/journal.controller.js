import * as journalService from './journal.service.js';

export async function create(req, res) {
  const { entry, created } = await journalService.createEntry(
    req.trip,
    req.user.id,
    req.valid.body,
  );
  res.status(created ? 201 : 200).json({ data: entry });
}

export async function update(req, res) {
  const entry = await journalService.updateEntry(
    req.trip,
    req.valid.params.entryId,
    req.valid.body,
  );
  res.json({ data: entry });
}

export async function remove(req, res) {
  await journalService.deleteEntry(req.trip, req.valid.params.entryId);
  res.status(204).end();
}
