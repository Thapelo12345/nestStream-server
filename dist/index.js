"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;
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
//# sourceMappingURL=index.js.map