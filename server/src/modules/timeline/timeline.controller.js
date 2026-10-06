import * as timelineService from './timeline.service.js';

export async function get(req, res) {
  const timeline = await timelineService.getTimeline(req.trip);
  res.json({ data: timeline });
}
