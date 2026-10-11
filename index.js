const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.get("/", (req, res) => {
  res.json({ status: "Pornhub Proxy running", usage: "/search?q=indian&page=1" });
});

app.get("/search", async (req, res) => {
  const query = req.query.q || req.query.search;
  const page = req.query.page || "1";

  if (!query) {
    return res.status(400).json({ error: "Missing q parameter" });
  }

  try {
    // First get cookies from homepage
    const homeRes = await fetch("https://www.pornhub.com/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const setCookies = homeRes.headers.raw()["set-cookie"] || [];
    let cookieStr = "age_verified=1; accessAgeDisclaimerPH=1; accessAgeDisclaimerUK=1; accessPH=1; platform=pc; cookiesBannerSeen=1; hasVisited=1";

    if (setCookies.length > 0) {
      const extra = setCookies.map(c => c.split(";")[0]).join("; ");
      cookieStr += "; " + extra;
    }

    const searchUrl = `https://www.pornhub.com/webmasters/search?search=${encodeURIComponent(query)}&page=${page}&thumbsize=medium`;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Referer": "https://www.pornhub.com/",
        "Origin": "https://www.pornhub.com",
        "Cookie": cookieStr,
      },
    });

    const text = await response.text();

    if (text.trim().startsWith("<") || text.includes("COOKIE_DOMAIN")) {
      return res.status(502).json({
        error: "Pornhub blocked the request",
        preview: text.substring(0, 200),
      });
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
