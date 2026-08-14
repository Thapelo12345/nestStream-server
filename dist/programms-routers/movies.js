"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const webSiteScrapper = require("../scrapping-utils/scrapping");
const { Movies } = require("../dataBase/connection");
const { FindShow } = require("../scrapping-utils/showSearch");
const { UpdateMovie } = require("../scrapping-utils/showSearch");
const moviesUrl = "https://watchseriestv.net/movies";
const router = express.Router();
router.get("/", async (req, res) => {
    res.json({ message: "Movies router is working!." });
});
router.get("/add-new", async (req, res) => {
    console.log("Adding new movies!...");
    let browser = null;
    try {
        await webSiteScrapper(browser, moviesUrl, "movies");
        res.json({ message: "Retrival was a SUCCESSFULL!" }).status(200);
    }
    catch (err) {
        const errMessage = err instanceof Error ? err.message : "unknown server error!.";
        return res.json({ message: errMessage }).status(401);
    } //end of catch
    finally {
        if (browser)
            await browser.close();
    } //end of final
}); //end of getting all movies route
router.get("/programs", async (req, res) => {
    try {
        const movies = await Movies.find({});
        res
            .json({ message: "Movies fetched successfully", data: movies })
            .status(200);
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : "unknown error!";
        console.error(errorMessage);
        res.json({ message: "Error fetching movies!" }).status(500);
    }
});
router.post("/update-movie", async (req, res) => {
    const { Title } = req.body;
    let browser = null;
    try {
        const playLink = await UpdateMovie(browser, moviesUrl, Title);
        console.log("Movie updated successfully!.");
        res.json({ playLink }).status(200);
    }
    catch (err) {
        const errMessage = err instanceof Error ? err.message : "unknown nework error!.";
        console.log(errMessage);
        res.json({ message: "Falied to update NETWORK ERROR!." }).status(500);
    }
    finally {
        if (browser)
            await browser.close();
    }
}); //end o f update movie route
router.post("/find-show", async (req, res) => {
    const { Title, showType } = req.body;
    let browser;
    try {
        const newShow = await FindShow(browser, moviesUrl, Title, showType);
        console.log("Show was successfully FOUND!.");
        res.json({ message: "Retrive show Successfully!.", showData: newShow }).status(200);
    }
    catch (err) {
        const errMessage = err instanceof Error ? err.message : "unknown server error!.";
        console.log(errMessage);
        res.json({ message: "Failed to find show!.." });
    }
    finally {
        if (browser)
            await browser.close();
    } //end of final
}); //end of route
module.exports = router;
//# sourceMappingURL=movies.js.map