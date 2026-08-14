const { chromium } = require("playwright");
const { expect } = require("@playwright/test");
const {
  retryAction,
  episodesPlayableUrls,
  gettingTheSeason,
} = require("./scrappingUtils");

async function getServerUrls(
  browser: any,
  navigate: string,
  prgrammeName: string,
  season?: string,
  episode?: string,
) {
  browser = await chromium.launch({ headless: true});

  const context = await browser.newContext();
  const mainPage = await context.newPage();

  await retryAction(
    async () => {
      await mainPage.goto(navigate, { waitUntil: "domcontentloaded" });
    },
    4,
    1500,
  );
  await mainPage.locator("#search-input").waitFor({state: "visible" })

  console.log("Entering the series header on the Search Bar!.");
  await mainPage.getByPlaceholder("Enter keywords...").fill(prgrammeName);

  const searchBtn = await mainPage.locator("#search-btn");
  console.log("Clicking Search btn!.");
  await searchBtn.click();

  console.log("Waiting for page navigation btn's to disappear!.");
  await mainPage.locator(".show-card, .movie-card").first().waitFor({ state: "visible"})

  const numberOfCards = await mainPage
    .locator(".show-card, .movie-card")
    .count();

    console.log("Number of cards: ", numberOfCards)
  if (numberOfCards === 0) throw new Error("No Show Was FOUND!.");

  const cards = await mainPage.locator(".show-card, .movie-card").all();

  for (let i = 0; i < numberOfCards; i++) {
    const rawText = await cards[i].locator("h3").textContent();
    const cardText = rawText ? rawText.trim() : "";

    if (prgrammeName.toLocaleLowerCase() === cardText.toLocaleLowerCase()) {
      console.log("Found show, now clicking card!.");
      await cards[i].click();
      break;
    } else if (
      prgrammeName.toLocaleLowerCase() !== cardText.toLocaleLowerCase() &&
      i + 1 === numberOfCards
    ) {
      throw new Error("Show Not FOUND!");
    }
  } //enf of 4 loop

  await mainPage.locator(".watch-dropdown").waitFor({ state: "visible" });
  if (season && episode) {

    console.log("Found season and Episode!.")
    const seasonBtn = await mainPage.locator("#season-btn");
    const episodeBtn = await mainPage.locator("#episode-btn");

    // ckicking btns
    await seasonBtn.click();
    await mainPage.locator("#season-dropdown").waitFor({ state: "visible" });
    const numberOfSeasons = await mainPage
      .locator("#season-dropdown .dropdown-item")
      .count();
    const seasons = await mainPage
      .locator("#season-dropdown .dropdown-item")
      .all();

    const inputSeasonNumber = season.split(" ")[1];
    console.log(`This is the seasond: ${inputSeasonNumber}`);

    for (let i = 0; i < numberOfSeasons; i++) {
      const seasonNumber = await seasons[i].getAttribute("data-season");

      if (inputSeasonNumber === seasonNumber) {
        await seasons[i].click();
        await mainPage.locator("#season-dropdown").waitFor({ state: "hidden" });
        break;
      } else if (
        inputSeasonNumber !== seasonNumber &&
        i + 1 === numberOfSeasons
      )
        throw new Error("Season Not FOUND!.");
    } //end of 4 loop

    await episodeBtn.click();
    await mainPage.locator("#episode-dropdown").waitFor({ state: "visible" });
    const numberOfEpisodes = await mainPage
      .locator("#episode-dropdown .dropdown-item")
      .count();
    const episodes = await mainPage
      .locator("#episode-dropdown .dropdown-item")
      .all();

    const inputEpisodeNumber = episode.split(" ")[1];
    console.log(`This is the episode: ${inputEpisodeNumber}`);

    for (let i = 0; i < numberOfEpisodes; i++) {
      const episodeNumber = await episodes[i].getAttribute("data-episode");

      if (inputEpisodeNumber === episodeNumber) {
        await episodes[i].click();
        await mainPage
          .locator("#episode-dropdown")
          .waitFor({ state: "hidden" });
        break;
      } else if (
        inputEpisodeNumber !== episodeNumber &&
        i + 1 === numberOfEpisodes
      )
        throw new Error("Episode Not FOUND!.");
    } //end of 4 loop
  }

  const watchBtn = await mainPage.locator("#watch-btn");
  console.log("Clicking watch btn!.");
  await watchBtn.click();
  await mainPage.locator("#watch-dropdown").waitFor({ state: "visible" });

  const serverBtn = await mainPage.locator(".watch-dropdown-item").first();
  console.log("clicking server btn!.");
  await serverBtn.click();
  await mainPage.locator(".server-btn").first().waitFor({state: "visible"})

  const links: string[] = [];
  const numberOfServer = await mainPage.locator(".server-btn").count();
  const playLinks = await mainPage.locator(".server-btn").all();

  console.log(`Found ${numberOfServer} server buttons!.`)

  for (let i = 1; i < numberOfServer - 1; i++) {
    await playLinks[i].click();
    await expect(playLinks[i]).toHaveClass(/active/);

    const iframe = mainPage.locator("#player-iframe")
    links.push(await iframe.getAttribute("src"))
  }

  return links
} //end of get server urls

module.exports = { getServerUrls };
