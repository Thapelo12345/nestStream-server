"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const { seriesSchema, movieSchema, userSchema } = require("./schemas");
const dotenv = require("dotenv");
dotenv.config({ override: true });
let Series, Movies, User;
// testing if the mongoose url string is the
if (!process.env.MONGO_SHOW_URL || !process.env.MONGO_USER_URL) {
    console.error("No DataBase URL FOUND!");
    process.exit(1);
}
const showDb = mongoose.createConnection(process.env.MONGO_SHOW_URL);
Series = showDb.model("series", seriesSchema);
Movies = showDb.model("movies", movieSchema);
const userDb = mongoose.createConnection(process.env.MONGO_USER_URL);
User = userDb.model("user", userSchema);
showDb.on("connected", () => console.log("Show database connected!."));
userDb.on("connected", () => console.log("User database connected!."));
module.exports = { Series, Movies, User };
//# sourceMappingURL=connection.js.map