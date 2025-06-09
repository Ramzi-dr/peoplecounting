import express from "express";
import bcrypt from "bcrypt";

const router = express.Router();

/**
 * Route: PUT /api/superuser/reset-password
 * Purpose: Force reset a user's password by superUser
 * Required in body:
 *   - email (user to update)
 *   - newPassword (new user password)
 *   - superUserEmail, superUserPassword (must match .env)
 *   - force: true
 * Env vars:
 *   - SUPERUSER_EMAIL
 *   - SUPERUSER_PASSWORD
 * Example curl:
 * curl -u AdminHS:SecurePassword \
 * -X PUT http://localhost:7023/api/superuser/reset-password \
 * -H "Content-Type: application/json" \
 * -d '{
 *        "email": "ramzi@tester.ch",
 *        "newPassword": "ResetPass123",
 *        "superUserEmail": "SUPERUSER_EMAIL",
 *        "superUserPassword": "SUPERUSER_PASSWORD",
 *        "force": true
 *      }'
 * 
 */

router.put("/reset-password", async (req, res) => {
  const db = req.db;

  const { email, newPassword, superUserEmail, superUserPassword, force } =
    req.body;

  if (
    !email ||
    !newPassword ||
    !superUserEmail ||
    !superUserPassword ||
    !force
  ) {
    return res.status(400).send("Missing required fields or force flag");
  }

  if (
    superUserEmail !== process.env.SUPERUSER_EMAIL ||
    superUserPassword !== process.env.SUPERUSER_PASSWORD
  ) {
    return res.status(401).send("Unauthorized superUser credentials");
  }

  const isValidPassword =
    newPassword.length >= 8 &&
    /[A-Z]/.test(newPassword) &&
    /[0-9]/.test(newPassword);

  if (!isValidPassword) {
    return res
      .status(400)
      .send(
        "New password must be 8+ chars, have 1 uppercase letter and 1 number",
      );
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await db
      .collection("users")
      .updateOne({ email }, { $set: { password: hashedPassword } });

    if (result.matchedCount === 0) {
      return res.status(404).send("User not found");
    }

    res.status(200).send("Password reset successfully");
  } catch (err) {
    console.error("SuperUser reset error:", err);
    res.status(500).send("DB error");
  }
});

export default router;
