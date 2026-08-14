const mongoose = require("mongoose");
const {seriesSchema, movieSchema, userSchema } = require("./schemas")
const dotenv = require("dotenv");
dotenv.config({ override: true });

let Series: any, Movies: any, User: any;

    // testing if the mongoose url string is the
if (!process.env.MONGO_SHOW_URL || !process.env.MONGO_USER_URL) {
  console.error("No DataBase URL FOUND!");
  process.exit(1);

}

const showDb = mongoose.createConnection(process.env.MONGO_SHOW_URL as string)
Series = showDb.model("series", seriesSchema);
Movies = showDb.model("movies", movieSchema);

const userDb = mongoose.createConnection(process.env.MONGO_USER_URL as string)
User = userDb.model("user", userSchema);

showDb.on("connected", ()=> console.log("Show database connected!."))
userDb.on("connected", ()=> console.log("User database connected!."))


module.exports = { Series, Movies, User }
