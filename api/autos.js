export default async function handler(req, res) {
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

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send(text);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}