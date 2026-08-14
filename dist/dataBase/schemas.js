"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const { Schema } = mongoose;
const userSchema = new Schema({
    // BASIC INFORMATION
    userId: String,
    profilePicture: { imageId: String, imageUrl: String },
    userEmail: String,
    userName: String,
    joinedDate: String,
    // SUBSCRIPTION
    paymentMethod: String,
    daysLeft: Number,
    accountCanceled: String,
    // CONTINUE WATCHING
    continueWatching: [String],
    // PERSONAL LIST
    userLiked: {
        userSeries: [String],
        userMovies: [String]
    },
    watchHistory: [String],
    userStatus: String,
    userPrefferedGenres: [String],
});
// parent schema for series
const seriesSchema = new Schema({
    seriesHeader: String,
    seriesTag: String,
    seriesLanguage: String,
    seriesDescription: String,
    seriesImageUrl: String,
    seriesYear: String,
    seriesRating: Number,
    seriesGenres: [String],
    seriesCast: [
        {
            _id: false,
            actorRealName: String,
            actorCharacter: String,
            actorImage: String,
        }, { _id: false }
    ],
    seriesSeasons: [
        {
            _id: false,
            season: String,
            episodes: [{ _id: false, name: String, title: String, play: String, }],
        }
    ],
    pendingSeasons: [String],
});
const movieSchema = new Schema({
    movieHeader: String,
    movieTag: String,
    movieLanguage: String,
    movieDescription: String,
    movieImageUrl: String,
    movieYear: String,
    movieRating: Number,
    movieGenres: [String],
    movieCast: [
        {
            _id: false,
            actorRealName: String,
            actorCharacter: String,
            actorImage: String,
        }
    ],
    playingUrl: String
});
module.exports = { seriesSchema, movieSchema, userSchema };
//# sourceMappingURL=schemas.js.map