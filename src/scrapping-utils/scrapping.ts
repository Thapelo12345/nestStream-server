const { chromium } = require("playwright");
const { expect } = require("@playwright/test");
const cheerio = require("cheerio");
const { Series, Movies } = require("../dataBase/connection");
const { navigatingPage3 } = require("./gettingShows");
const {
  retryAction,
  episodesPlayableUrls,
  gettingTheSeason,
  scrappeCardInfo,
} = require("./scrappingUtils");

async function webSiteScrapper(
  browser: any,
  pageUrl: string,
  showType: string,
) {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const mainPage = await context.newPage();

  console.log("Scrapper has started!...");
  await retryAction(
    async () => {
      await mainPage.goto(pageUrl, { waitUntil: "domcontentloaded" });
    },
    4,
    1500,
  );

  // first get number of pages to browse
  const pageInfo = await mainPage.locator(".page-info").last();

  const spanInfo = await pageInfo.innerText();
  const maxPages = Number(spanInfo.split(" ")[3]);

  // main page number 4 loop
  for (let page = 1; page <= maxPages; page++) {
    const cardsVisible = await mainPage
      .locator(".show-card, .movie-card")
      .first()
      .isVisible();
    if (!cardsVisible)
      await mainPage.waitForSelector(".show-card, .movie-card", {
        state: "visible",
      });

    const number_of_cards = await mainPage
      .locator(".show-card, .movie-card")
      .count();

    for (let i = 0; i < number_of_cards; i++) {
      if (
        !(await mainPage.locator(".show-card, .movie-card").first().isVisible())
      )
        await mainPage
          .locator(".show-card, .movie-card")
          .waitFor({ state: "visible" });

      let activePageText = await mainPage
        .locator(".page-btn.active")
        .innerText();

      // moving to current page
      if (activePageText !== String(page)) {
        console.log(
          `MOVING TO PAGE: ${page}\nCurrently on PAGE: ${activePageText}\n`,
        );

        // starting a do while loop
        do {
          const firstOldCard = await mainPage
            .locator(".show-card, .movie-card")
            .first();
          const titleLocation = firstOldCard.locator(
            ".show-info h3, .movie-info h3",
          );
          const oldTitle = await titleLocation.innerText();

          await mainPage.getByRole("button", { name: "→" }).click();
          // await mainPage.waitForSelector(".show-card, .movie-card", { state: "detached"})
          await expect(titleLocation).not.toHaveText(oldTitle);

          activePageText = await mainPage
            .locator(".page-btn.active")
            .innerText();
          console.log("I AM ON PAGE:", activePageText);
        } while (activePageText !== String(page));

        console.log(`ON CORRECT PAGE NUMBER: ${page}`);
        await mainPage.waitForTimeout(1500);
      } //end of if not current page

      // getting the card positioned at i
      const card = mainPage.locator(".show-card, .movie-card").nth(i);
      const cardName = await card
        .locator(".show-info .show-title, .movie-info .movie-title")
        .textContent();

      // search cloud for card
      const cloudShow =
        showType === "series"
          ? await Series.findOne({ seriesHeader: cardName }).lean()
          : await Movies.findOne({ movieHeader: cardName }).lean();

      if (cloudShow) {
        console.log("\nSKIPING SHOW,\nSHOW ALREADY EXIST!.\n");
        await mainPage.waitForTimeout(2500);
        continue;
      }

      console.log(
        `\nWorking on ${cardName}\ncard number ${i + 1} on page ${page}\n`,
      );
      const seasonsAndEpisodes: any[] = [];

      console.log(
        "Clicking card\nAnd Waitting for the details element to appear!",
      );
      await retryAction(
        async () => {
          await Promise.all([
            mainPage.locator(".detail-title").waitFor({ state: "attached" }),
            card.click(),
          ]);
        },
        4,
        15000,
      );

      // Doing cheerio scraping on the *new* tab page
      let secondTapHtml = await mainPage.content();
      let $2 = await cheerio.load(secondTapHtml);

      // getting page details
      const showHeader = $2(".detail-title").text().trim();
      const tagLine =
        $2(".detail-tagline").text().trim() == ""
          ? "no tag line found"
          : $2(".detail-tagline").text().trim();
      const showLanguage =
        showType == "series"
          ? $2(".extra-info .info-item").eq(1).find(".info-value").text().trim()
          : $2(".extra-info .info-item")
              .last()
              .find(".info-value")
              .text()
              .trim();

      const description = $2(".detail-overview p").text().trim();
      const genres = $2(".genre-tag")
        .toArray()
        .map((genre: any) => $2(genre).text().trim());
      const imageUrl = $2(".detail-poster-container img").attr("src");
      const year = $2(".meta-item span").first().text().trim();
      const rate = $2(".rating-large span").text().trim();
      const cast = $2(".cast-card")
        .toArray()
        .map((cas: any) => {
          const actorImage = $2(cas).find(".cast-photo").attr("src");
          const actorCharacter = $2(cas).find(".cast-character").text().trim();
          const actorRealName = $2(cas).find(".cast-name").text().trim();

          return { actorRealName, actorCharacter, actorImage };
        });

      // if showType is a series break
      const targetGenres = ["Talk", "Documentary", "Reality", "Soap", "News"];
      if (
        showType == "series" &&
        targetGenres.some((genre) => genres.includes(genre))
      ) {
        console.log("\nThis show is not a series! going back to main page!");
        console.log("Back to main page! going to next card!\n");

        await mainPage.goBack();
        continue;
      } //end of if showType series

      // if series will have to get season
      let seasons: any =
        showType === "series"
          ? $2("#season-dropdown .dropdown-item")
              .toArray()
              .map((season: any) =>
                $2(season).text().trim().split("-")[0].trim(),
              )
          : [];

      // open page 3 first and get url opening a third new browser tap
      const page3 = await context.newPage();
      let page3Url = await navigatingPage3(mainPage, page3);

      let playableUrl = "";
      // this if will save every season and its episodes

      if (showType == "series") {
        console.log("I am getting a series show");

        console.log(`\nRuning currentSeason loop\nShow name :${showHeader}\n`);

        const newSeason = await gettingTheSeason(
          mainPage,
          seasons[0],
          page3Url,
          page3,
        );
        seasonsAndEpisodes.push(newSeason);

        console.log("\nuploading a series to cloud!.");

        const waitingSeasons = seasons.filter((season: string) => {
          let seasonExist = false;
          for (let i = 0; i < seasonsAndEpisodes.length; i++) {
            if (seasonsAndEpisodes[i].season === season) {
              seasonExist = true;
              break;
            }
          } //end of 4 loop
          if (!seasonExist) return season;
        });

        const uploadedSeries = await Series.create({
          seriesHeader: showHeader,
          seriesTag: tagLine,
          seriesLanguage: showLanguage,
          seriesDescription: description,
          seriesImageUrl: imageUrl,
          seriesYear: year,
          seriesRating: Number(rate == "N/A" ? "0" : rate),
          seriesGenres: genres,
          seriesCast: cast,
          seriesSeasons: seasonsAndEpisodes,
          pendingSeasons: waitingSeasons,
          lastUpdate: "1010-05-10",
        });

        console.log(`Done uploading ${showHeader} to cloud!\n`);
      } //end of if showType == series

      // create movie document
      else {
        console.log("Saving a movie show");
        playableUrl = await page3.locator("#player-iframe").getAttribute("src");

        console.log("\nUploading Movie to cloud!");

        const uploadedMovie = await Movies.create({
          movieHeader: showHeader,
          movieTag: tagLine,
          movieLanguage: showLanguage,
          movieDescription: description,
          movieImageUrl: imageUrl,
          movieYear: year,
          movieRating: Number(rate == "N/A" ? "0" : rate),
          movieGenres: genres,
          movieCast: cast,
          playingUrl: playableUrl,
        });

        console.log("Done uploading movie to cloud!\n");
      }
      // closing page 3
      await page3.close();
      if ((await mainPage.url()) !== pageUrl) await mainPage.goBack();

      console.log("CLOSING PAGE 3\nAT THE END of the CARD LOOP!");
    } //end of inner card 4 loop
  } //end of 4 loop
} //end of website scrapper function

async function brandNewShows(browser: any, pageUrl: string) {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const mainPage = await context.newPage();

  const newShows: any[] = [];

  await retryAction(
    async () => {
      await mainPage.goto(pageUrl, { waitUntil: "domcontentloaded" });
    },
    3,
    1500,
  );
  console.log("Show Page Open!!..");

  await mainPage.locator(".show-card, .movie-card").first().waitFor({ state: "visible" });

  const is_it_a_series = await mainPage.locator(".show-card").first().isVisible();
  const showType = is_it_a_series ? "series" : "movie";

  const cards = await mainPage.locator(".show-card, .movie-card").all();

  for (const card of cards) {
    const rawText = await card.locator("h3").textContent();
    const cardHeader = rawText.trim();

    console.log(`\nSearching for ${cardHeader} on mongodb!.\n`);

    const cloudShow =
      showType === "series"
        ? await Series.findOne({ seriesHeader: cardHeader })
        : await Movies.findOne({ movieHeader: cardHeader });

    if (cloudShow) continue;

    console.log("Card is beign clicked!.");
    await card.click();
    await mainPage.locator(".detail-content").waitFor({ state: "visible" });

    console.log("Getting card Information!..");
    const {
      showHeader,
      tagLine,
      showLanguage,
      description,
      genres,
      imageUrl,
      year,
      rate,
      cast,
      seasons,
    } = await scrappeCardInfo(mainPage);

    const targetGenres = ["Talk", "Documentary", "Reality", "Soap", "News"];
    
    if (targetGenres.some((genre) => genres.includes(genre))) {
      await mainPage.goBack();
      continue;
    }

    const page3 = await context.newPage();
    
    let page3Url = await navigatingPage3(mainPage, page3);
    let playableUrl = "";

    if (showType === "series") {
      const seasonsAndEpisodes: any[] = [];
      console.log("I am getting a series show");

      console.log(`\nRuning currentSeason loop\nShow name :${showHeader}\n`);

      const newSeason = await gettingTheSeason(
        mainPage,
        seasons[0],
        page3Url,
        page3,
      );
      seasonsAndEpisodes.push(newSeason);

      console.log("\nuploading a series to cloud!.");

      const waitingSeasons = seasons.filter((season: string) => {
        let seasonExist = false;
        for (let i = 0; i < seasonsAndEpisodes.length; i++) {
          if (seasonsAndEpisodes[i].season === season) {
            seasonExist = true;
            break;
          }
        } //end of 4 loop
        if (!seasonExist) return season;
      });

      const uploadedSeries = await Series.create({
        seriesHeader: showHeader,
        seriesTag: tagLine,
        seriesLanguage: showLanguage,
        seriesDescription: description,
        seriesImageUrl: imageUrl,
        seriesYear: year,
        seriesRating: Number(rate == "N/A" ? "0" : rate),
        seriesGenres: genres,
        seriesCast: cast,
        seriesSeasons: seasonsAndEpisodes,
        pendingSeasons: waitingSeasons,
        lastUpdate: "1010-05-10",
      });

      newShows.push(uploadedSeries);
      console.log(`Done uploading ${showHeader} to cloud!\n`);
    } else {

      console.log("Saving a movie show");
        playableUrl = await page3.locator("#player-iframe").getAttribute("src");

        console.log("\nUploading Movie to cloud!");

        const uploadedMovie = await Movies.create({
          movieHeader: showHeader,
          movieTag: tagLine,
          movieLanguage: showLanguage,
          movieDescription: description,
          movieImageUrl: imageUrl,
          movieYear: year,
          movieRating: Number(rate == "N/A" ? "0" : rate),
          movieGenres: genres,
          movieCast: cast,
          playingUrl: playableUrl,
        });

        newShows.push(uploadedMovie)
        console.log("Done uploading movie to cloud!\n");
    }

    await page3.close();
    if ((await mainPage.url()) !== pageUrl) await mainPage.goBack();
  } //end of loop

  return newShows;
} //end of new movies or series

module.exports = { webSiteScrapper, brandNewShows };
