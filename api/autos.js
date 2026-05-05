export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    const response = await fetch("https://oracleapex.com/ords/tbdandres/alquiler/autos/", {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
        "Accept-Language": "es-ES,es;q=0.9",
        "Connection": "keep-alive"
      }
    });

    const text = await response.text();

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(response.status).send(text);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
