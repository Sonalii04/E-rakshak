import app from "./src/app.js";
import { initDb } from "./src/database/db.js";

const PORT = process.env.PORT || 3001;

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Smart CCTV backend listening on port ${PORT}`);
  });
});