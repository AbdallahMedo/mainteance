const express = require("express");
const cors = require("cors");
const app = express();

const authRoutes = require("./routes/auth.routes");
const maintenanceTeamRoutes = require('./routes/maintenanceTeam.routes');

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use('/api/maintenance-team', maintenanceTeamRoutes);

module.exports = app;
