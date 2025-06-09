import express from "express";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

const router = express.Router();

function getSwissDateTime() {
  return new Date()
    .toLocaleString("de-CH", {
      timeZone: "Europe/Zurich",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace(",", "");
}

/**
 * Route: POST /api/users
 * Purpose: Register a new user
 * Required fields: name, email, password
 * Optional fields: company, telnummer, clientID
 * Notes:
 *   - Password must be 8+ chars, include one uppercase and one number
 *   - Password is hashed using bcrypt
 * Example curl:
 * curl -u AdminHS:SecurePassword -X POST http://localhost:7023/api/users \
 * -H "Content-Type: application/json" \
 * -d '{"name":"Test User","email":"test@user.ch","password":"Password1"}'
 *
 * Example (React fetch):
 * await fetch("/api/users", {
 *   method: "POST",
 *   headers: {
 *     "Content-Type": "application/json",
 *     Authorization: "Basic " + btoa("AdminHS:Security@Home15!")
 *   },
 *   body: JSON.stringify({ name, email, password })
 * });
 */
router.post("/", async (req, res) => {
  const db = req.db;
  const { name, email, password, company, telnummer, clientID } = req.body;

  const missing = [];
  if (!name) missing.push("name");
  if (!email) missing.push("email");

  if (!password) {
    missing.push("password");
  } else {
    const isValidPassword =
      password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
    if (!isValidPassword) {
      return res
        .status(400)
        .send(
          "Password must be at least 8 characters, include one uppercase letter and one number",
        );
    }
  }

  if (missing.length > 0) {
    return res
      .status(400)
      .send(`Missing required field(s): ${missing.join(", ")}`);
  }

  try {
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return res.status(409).send("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name,
      email,
      password: hashedPassword,
      company: company || null,
      telnummer: telnummer || null,
      clientID: clientID || null,
      createdAt: getSwissDateTime(),
    };

    await db.collection("users").insertOne(newUser);
    res.status(201).send("User created");
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).send("DB error");
  }
});

/**
 * Route: GET /api/users
 * Purpose: Fetch all users (excluding passwords)
 * Example:
 * curl -u AdminHS:SecurePassword http://localhost:7023/api/users
 */
router.get("/", async (req, res) => {
  const db = req.db;

  try {
    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .toArray();

    res.status(200).json(users);
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).send("DB error");
  }
});

/**
 * Route: PUT /api/users
 * Purpose: Update user data by email
 * Required: email
 * Optional updates: { name, telnummer, clientID, company, password, etc }
 * Special:
 *   - If password is updated, oldPassword is required for verification
 *   - Password is hashed before saving
 * Example payload:
 * {
 *   "email": "a@b.ch",
 *   "updates": {
 *     "name": "New Name",
 *     "password": "NewPass123",
 *     "oldPassword": "OldPass1"
 *   }
 * }
 */
router.put("/", async (req, res) => {
  const db = req.db;
  const { email, updates } = req.body;

  if (!email || typeof updates !== "object") {
    return res
      .status(400)
      .send("Invalid payload. Expected email and updates object.");
  }

  try {
    const user = await db.collection("users").findOne({ email });
    if (!user) return res.status(404).send("User not found");

    // Handle password update
    if (updates.password) {
      if (!updates.oldPassword) {
        return res.status(400).send("Old password required for update");
      }
      const match = await bcrypt.compare(updates.oldPassword, user.password);
      if (!match) return res.status(403).send("Old password incorrect");

      const isValidPassword =
        updates.password.length >= 8 &&
        /[A-Z]/.test(updates.password) &&
        /[0-9]/.test(updates.password);
      if (!isValidPassword) {
        return res
          .status(400)
          .send("New password must be 8+ chars, with uppercase and number");
      }
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // Remove oldPassword from update if present
    delete updates.oldPassword;

    await db.collection("users").updateOne({ email }, { $set: updates });
    res.status(200).send("User updated");
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).send("DB error");
  }
});

/**
 * Route: DELETE /api/users
 * Purpose: Delete user by email
 * Required: { email }
 * Example: { "email": "a@b.ch" }
 */
router.delete("/", async (req, res) => {
  const db = req.db;
  const { email } = req.body;

  if (!email) return res.status(400).send("Email required to delete user");

  try {
    const result = await db.collection("users").deleteOne({ email });
    if (result.deletedCount === 0) {
      return res.status(404).send("User not found");
    }
    res.status(200).send("User deleted");
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).send("DB error");
  }
});



export default router;
