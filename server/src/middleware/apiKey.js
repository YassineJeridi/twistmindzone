import crypto from "crypto";

const digest = (value) => crypto.createHash("sha256").update(value).digest();

// Server-to-server access for other Redix apps (e.g. the REDIX dashboard).
// Unlike the passkey session, this is a long-lived key set as API_KEY in
// .env and sent in the `X-API-Key` header.
export function requireApiKey(req, res, next) {
  const expected = process.env.API_KEY;
  if (!expected) {
    return res.status(503).json({ message: "API access is not configured." });
  }

  const provided = req.get("x-api-key") || "";
  // Hashing both sides gives equal-length buffers, which timingSafeEqual needs.
  if (!provided || !crypto.timingSafeEqual(digest(provided), digest(expected))) {
    return res.status(401).json({ message: "Invalid or missing API key." });
  }

  next();
}
