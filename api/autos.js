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
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept": "application/json,text/plain,*/*",
        "Accept-Language": "es-AR,es;q=0.9,en;q=0.8"
      }
    });

    const text = await response.text();
    const contentType = response.headers.get("content-type") || "";

    res.setHeader("Content-Type", "application/json; charset=utf-8");

    if (!response.ok || !contentType.includes("application/json")) {
      return res.status(response.status || 502).json({
        error: "Oracle APEX no devolvio JSON al proxy.",
        status: response.status,
        contentType,
        preview: text.slice(0, 240)
      });
    }

    res.status(200).send(text);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
