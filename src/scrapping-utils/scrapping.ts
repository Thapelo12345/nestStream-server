const { chromium } = require("playwright");
const { server2 } = require("../constant/secondServerUrl")
const { Series, Movies } = require("../dataBase/connection");
const { navigatingPage3 } = require("./gettingShows");
const {retryAction, gettingTheSeason, scrappeCardInfo } = require("./scrappingUtils");


async function brandNewShows(browser: any, pageUrl: string) {
  browser = await chromium.launch({headles: true,
      args: [
      '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage', 
    '--disable-accelerated-2d-canvas', 
    '--disable-gpu', 
    '--no-zygote', 
    '--single-process',              
    '--js-flags="--max-old-space-size=150"'
      ]
  })
    
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
      console.log("This is not a Series!.")
      await mainPage.goBack();
      continue;
    }

   let moviePlayLink = "";

    if (showType === "series") {
      const seasonsAndEpisodes: any[] = [];

      const currentUrl = mainPage.url()
      const currentSeason = seasons[0]

      const secondServer = await fetch(`${server2}/get-season`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: currentUrl,
          Season: currentSeason
        })
      })

      if(!secondServer.ok) throw new Error("Failed to get Seasons From the second Server!.")
        const secondServerData = await secondServer.json() as any

      if(secondServerData.message !== "Season retrived successfully!.") throw new Error(secondServerData.message)

      seasonsAndEpisodes.push(secondServerData.results)

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

/*
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
      */
    } else {

      const watchBtn = await mainPage.locator("#watch-btn")
        console.log("Clicking the watch Btn!.")

        await watchBtn.click()
        await mainPage.locator("#watch-dropdown").waitFor({state: "visible"})

        const server1 = await mainPage.locator(".watch-dropdown-item").first()
        console.log("Clicking the server 1 btn!.")
        await server1.click()
        
        await mainPage.locator("#player-iframe").waitFor({state: "visible"})
        moviePlayLink = await mainPage.locator("#player-iframe").getAttribute("src")

        console.log("\nUploading Movie to cloud!\nSaving a movie show");

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
          playingUrl: moviePlayLink,
        });

        newShows.push(uploadedMovie)
        console.log("Done uploading movie to cloud!\n");
    }

  if ((await mainPage.url()) !== pageUrl) await mainPage.goBack();

  } //end of loop

  return newShows;
} //end of new movies or series

module.exports = { brandNewShows };
