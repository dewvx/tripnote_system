import * as tripsService from './trips.service.js';

export async function list(req, res) {
  const trips = await tripsService.listTrips(req.user.id, req.valid.query);
  res.json({ data: trips });
}

export async function create(req, res) {
  const trip = await tripsService.createTrip(req.user.id, req.valid.body);
  res.status(201).json({ data: trip });
}

export async function get(req, res) {
  const trip = await tripsService.getTrip(req.trip.id, req.user.id);
  res.json({ data: trip });
}

export async function update(req, res) {
  const trip = await tripsService.updateTrip(req.trip, req.valid.body, req.user.id);
  res.json({ data: trip });
}

export async function updateStatus(req, res) {
  const trip = await tripsService.changeStatus(req.trip, req.valid.body.status, req.user.id);
  res.json({ data: trip });
}

export async function remove(req, res) {
  await tripsService.deleteTrip(req.trip);
  res.status(204).end();
}
