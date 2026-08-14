import type { Application } from "express";
const express = require("express");

const app: Application = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;
app.use(express.json());

const seriesRouter = require("./programms-routers/series");
const moviesRouter = require("./programms-routers/movies");
const userRouter = require("./user-routers/user");

app.use("/series", seriesRouter);
app.use("/movies", moviesRouter);
app.use("/user", userRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
