"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const webSiteScrapper = require("../scrapping-utils/scrapping");
const { Series } = require("../dataBase/connection");
const { SeriesGetUrl, FindShow, AddSeason } = require("../scrapping-utils/showSearch");
const router = express.Router();
const seriesUrl = "https://watchseriestv.net/tv-shows";
router.get("/", async (req, res) => {
    res.status(200).json({ message: "Series router is working!." });
});
router.get("/add-new", async (req, res) => {
    let browser = null;
    try {
        await webSiteScrapper(browser, seriesUrl, "series");
        res.json({ message: "Retrival was a SUCCESSFULL!" });
    }
    catch (err) {
        const errMessage = err instanceof Error ? err.message : "unknown server error!.";
        return res.json({ message: errMessage }).status(401);
    } //end of catch
    finally {
        if (browser)
            await browser.close();
    } //end of final
});
router.get("/programs", async (req, res) => {
    try {
        const show = await Series.find({});
        console.log("Show Data recieved successfully!.");
        res
            .json({ message: "Series fetched successfully", data: show })
            .status(200);
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : "unknown error!";
        console.error(errorMessage);
        res.json({ message: "Error fetching series!" }).status(500);
    }
});
router.post("/search-url", async (req, res) => {
    const { Title, Season, Episode } = req.body;
    let browser = null;
    try {
        const url = await SeriesGetUrl(browser, seriesUrl, Title, Season, Episode);
        console.log("Url Retrived successfully!.");
        res.json({ playLink: url }).status(200);
    }
    catch (err) {
        const errMessage = err instanceof Error ? err.message : "Unknown Server Error!.";
        console.error(errMessage);
        res.json({ message: errMessage }).status(404);
    }
    finally {
        if (browser)
            await browser.close();
    } //end of final
});
router.post("/add-season", async (req, res) => {
    const { Title } = req.body;
    console.log(`This is the title: ${Title}`);
    let browser;
    try {
        if (!Title)
            throw new Error("Title empty!..");
        const nextSeason = await AddSeason(browser, seriesUrl, Title);
        res.json({ message: "Season Retrived successfully!.", Season: nextSeason }).status(200);
    }
    catch (err) {
        const errMessage = err instanceof Error ? err.message : "unknown error!.";
        console.log(errMessage);
        res.json({ message: "Failed to add season!.." });
    }
    finally {
        if (browser)
            await browser.close();
    } //end of final
}); //end of add season route
router.post("/find-show", async (req, res) => {
    const { Title, showType } = req.body;
    let browser;
    try {
        const newShow = await FindShow(browser, seriesUrl, Title, showType);
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
//# sourceMappingURL=series.js.map