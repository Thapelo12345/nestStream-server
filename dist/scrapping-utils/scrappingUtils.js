"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio = require("cheerio");
const mediaUrl = [];
// playwright re-try global function
async function retryAction(action, retries = 3, delay = 2000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await action(); // Try the action
        }
        catch (error) {
            const isTimeout = error.name === "TimeoutError" || error.message.includes("Timeout");
            if (isTimeout && attempt < retries) {
                console.warn(`⚠️ Timeout on attempt ${attempt}/${retries}. Retrying in ${delay / 1000}s...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
            else {
                // If it's a different error or we ran out of retries, throw the error
                throw error;
            }
        }
    }
    throw new Error("Action failed after max retries");
} //end of re-try global function
async function episodesPlayableUrls(mainUrl, currentEpisode, pageNavigation) {
    const arr = currentEpisode.name.trim().split(" ");
    const newFormat = "&" + arr[0].toLowerCase() + "=" + arr[1];
    const copyUrl = mainUrl.replace("&episode=1", newFormat);
    await retryAction(async () => {
        await pageNavigation.goto(copyUrl, { waitUntil: "domcontentloaded" });
        await pageNavigation.waitForSelector("#player-iframe", {
            state: "visible",
        });
    }, 4, 15000);
    const playableUrl = await pageNavigation
        .locator("#player-iframe")
        .getAttribute("src");
    if (mediaUrl.includes(playableUrl) || (playableUrl == undefined || playableUrl == ""))
        return "no url found";
    else {
        mediaUrl.push(playableUrl);
        return playableUrl;
    }
} //end of episodes playable urls function
async function gettingTheSeason(mainCard, currentSeason, originalUrl, thirdPage) {
    const seasonBtn = mainCard.locator("#season-btn");
    console.log("Click the season btn");
    await seasonBtn.click();
    await mainCard.waitForSelector("#season-dropdown", { state: "visible" });
    console.log("Clicking from the dropdown menu!.");
    const dropdownSelected = mainCard.locator(`[data-season="${currentSeason.split(" ")[1]}"]`);
    await dropdownSelected.click();
    await mainCard.waitForSelector("#season-dropdown", { state: "hidden" });
    console.log("updating cheerio!");
    const newUrl = await mainCard.content();
    let $2 = await cheerio.load(newUrl);
    // getting season format
    const seasonArray = currentSeason.toLowerCase().split(" ");
    const previouse_season_number = seasonArray[1] !== "1"
        ? Number(seasonArray[1]) - 1
        : Number(seasonArray[1]);
    const baseSeasonFormat = "&" + seasonArray[0] + "=" + seasonArray[1];
    const previouse_format = `&season=${previouse_season_number}`;
    // change the original url
    const copyUrl3 = originalUrl.replace(previouse_format, baseSeasonFormat);
    originalUrl = copyUrl3;
    // getting all season episodes
    const episodesArr = $2("#episode-dropdown .dropdown-item")
        .toArray()
        .map((episode) => {
        const arr = $2(episode).text().trim().split("-");
        const episodeName = arr[0].trim();
        const episodeTitle = arr[1].trim();
        return { name: episodeName, title: episodeTitle, play: "" };
    });
    // starting episodes loop
    for (const episode of episodesArr) {
        console.log(`\nSeason: ${currentSeason}\nEpisode: ${episode.name}`);
        console.log("Getting episode playable url!");
        episode.play = await episodesPlayableUrls(originalUrl, episode, thirdPage);
        console.log("Done getting Url!");
    } //end of episode loop
    return { season: currentSeason, episodes: episodesArr };
} //end of getting season function
module.exports = { retryAction, episodesPlayableUrls, gettingTheSeason };
//# sourceMappingURL=scrappingUtils.js.map