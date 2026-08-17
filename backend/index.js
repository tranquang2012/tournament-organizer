const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

const userRoutes = require("./src/modules/user/user.routes");
const errorHandler = require("./src/shared/middleware/errorHandler");
const tournamentRoutes = require('./src/modules/tournament/tournament.routes');
const sportRoutes = require("./src/modules/sport/sport.routes");
const matchesRoutes = require("./src/modules/matches/matches.routes");
const adminRoutes = require('./src/modules/admin/admin.routes');

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.use("/api/users", userRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use("/api/sports", sportRoutes);
app.use("/api/matches", matchesRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
