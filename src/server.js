// src/server.js
require("dotenv").config();
const app = require("./app");
const { connectDB, sequelize } = require("./config/db");


console.log("🟢 server.js loaded");

(async () => {
  try {
    console.log("➡️ Step 1: Connecting to DB...");
    await connectDB();
    console.log("➡️ Step 1 done ✅");

    console.log("➡️ Step 2: Sequelize sync...");
    await sequelize.sync();
    console.log("➡️ Step 2 done ✅");

    console.log("➡️ Step 3: Starting server...");
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    // خطوة اختيارية: تلتقط أي خطأ غير متوقع وتمنع nodemon من الخروج
    process.on("unhandledRejection", (err) => {
      console.error("🔥 UNHANDLED REJECTION:", err);
    });

    process.on("uncaughtException", (err) => {
      console.error("🔥 UNCAUGHT EXCEPTION:", err);
    });

  } catch (err) {
    console.error("🔥 STARTUP ERROR:", err);
  }
})();
