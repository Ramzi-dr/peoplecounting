import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import express from "express";
import { MongoClient } from "mongodb";
import usersRouter from "./routes/users.js";
import superUserRouter from "./routes/superUser.js";




// Load config
const env = process.env.ENV || "dev";
const username = encodeURIComponent(process.env.MONGO_INITDB_ROOT_USERNAME);
const password = encodeURIComponent(process.env.MONGO_INITDB_ROOT_PASSWORD);

const host =
  env === "dev" ? process.env.MONGO_DEV_HOST : process.env.MONGO_DOCKER_HOST;
const port =
  env === "dev" ? process.env.MONGO_DEV_PORT : process.env.MONGO_DOCKER_PORT;

const mongoUrl = `mongodb://${username}:${password}@${host}:${port}/?authSource=admin`;

const app = express();
const client = new MongoClient(mongoUrl);

// ✅ IP restriction: only allow localhost and local network
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const allowedRanges = [
    "::1",
    "127.0.0.1",
    "::ffff:127.0.0.1",
    "192.168.",
    "10.",
  ];
  const isAllowed = allowedRanges.some((range) => ip.includes(range));
  if (!isAllowed) {
    return res.status(403).send("Forbidden: external access denied");
  }
  next();
});

// ✅ Basic Auth using ENV credentials
const authUser = process.env.EXPRESS_USER;
const authPass = process.env.EXPRESS_PASS;

app.use((req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Basic ")) {
    return res
      .status(401)
      .set("WWW-Authenticate", "Basic")
      .send("Auth required");
  }
  const [user, pass] = Buffer.from(auth.split(" ")[1], "base64")
    .toString()
    .split(":");
  if (user !== authUser || pass !== authPass) {
    return res.status(403).send("Forbidden: wrong credentials");
  }
  next();
});

app.use(express.json()); // JSON body parsing

// ✅ Inject MongoDB into each request
app.use(async (req, res, next) => {
  try {
    if (!client.topology?.isConnected()) {
      await client.connect();
    }
    req.db = client.db("peoplecount");
    next();
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    res.status(500).send("MongoDB error");
  }
});

// ✅ Routes
app.use("/api/users", usersRouter);
app.use("/api/superuser", superUserRouter);

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Backend OK");
});

export default app;
