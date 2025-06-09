import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import app from "./app.js";

const appPort = process.env.EXPRESS_PORT || 3000;
app.listen(appPort, () => {
  console.log(`Server running on http://localhost:${appPort}`);
});
