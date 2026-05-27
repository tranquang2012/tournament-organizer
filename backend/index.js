const express = require("express");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./src/modules/user/user.routes");
const errorHandler = require("./src/shared/middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.use("/api/users", userRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
