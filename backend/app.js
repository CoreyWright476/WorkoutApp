const express = require("express");
const workoutRoutes = require("./routes/workouts");
const exerciseRoutes = require("./routes/exercises");
const planRoutes = require("./routes/plans");
const metricsRoutes = require("./routes/metrics");

//express app
const app = express();

// middleware
app.use(express.json());

app.use((req, res, next) => {
  if (process.env.NODE_ENV !== "test") {
    console.log(req.path, req.method);
  }
  next();
});

// routes
app.use("/api/workouts", workoutRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/metrics", metricsRoutes);

module.exports = app;
