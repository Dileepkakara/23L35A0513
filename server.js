const express = require("express");
const bodyParser = require("body-parser");
const { nanoid } = require("nanoid");
const morgan = require("morgan");

const app = express();
app.use(bodyParser.json());
app.use(morgan("combined")); // ✅ Logging middleware

const port = 3000;
const hostname = "localhost";

const shortUrls = {};

// Create Short URL
app.post("/shorturis", (req, res) => {
  const { url, validity = 30, shortcode } = req.body;

  if (!url || !/^https?:\/\/.+/i.test(url)) {
    return res.status(400).json({ error: "Invalid or missing URL" });
  }

  let code = shortcode || nanoid(6);

  if (shortUrls[code]) {
    return res.status(409).json({ error: "Shortcode already exists" });
  }

  const now = new Date();
  const validUntil = new Date(now.getTime() + validity * 60000);

  shortUrls[code] = { url, validUntil };

  res.status(201).json({
    shortlink: `http://${hostname}:${port}/${code}`,
    expiry: validUntil.toISOString()
  });
});

// Redirect Short URL
app.get("/:code", (req, res) => {
  const { code } = req.params;
  const entry = shortUrls[code];

  if (!entry) {
    return res.status(404).json({ error: "Short URL not found" });
  }

  const now = new Date();
  if (now > entry.validUntil) {
    return res.status(410).json({ error: "Short URL expired" });
  }

  res.redirect(entry.url);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(port, () => {
  console.log(`Server running at http://${hostname}:${port}`);
});