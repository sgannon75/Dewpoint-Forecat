export default async function handler(req, res) {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: "Missing lat/lon" });

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,dewpoint_2m_mean,relative_humidity_2m_mean,sunrise,sunset&hourly=temperature_2m,dewpoint_2m,relative_humidity_2m,apparent_temperature&temperature_unit=celsius&timezone=auto&forecast_days=5`;

  const response = await fetch(url);
  const data = await response.json();
  res.status(200).json(data);
}
