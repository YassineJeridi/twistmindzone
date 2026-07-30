import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", (req, res) => {
  const { passkey } = req.body;

  if (!passkey || passkey !== process.env.PASSKEY) {
    return res.status(401).json({ message: "Incorrect passkey." });
  }

  const token = jwt.sign({ unlocked: true }, process.env.JWT_SECRET, { expiresIn: "12h" });
  res.json({ token });
});

export default router;
