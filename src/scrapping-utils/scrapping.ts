const { chromium } = require("playwright");
const { Series, Movies } = require("../dataBase/connection");
const {retryAction, GetSeason, scrappeCardInfo } = require("./scrappingUtils");

async function brandNewShows(browserRef: { instance: any }, pageUrl: string) {
  browserRef.instance = await chromium.launch({headles: true,
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
    
  const context = await browserRef.instance.newContext();
  const mainPage = await context.newPage();

  const newShows: any[] = [];

  await retryAction(
    async () => {
      await mainPage.goto(pageUrl, { waitUntil: "domcontentloaded" });
    },
    3,
    1500,
  );

  const backToMainPage = await mainPage.url()

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

      const fullSeason = await GetSeason(mainPage, seasons[0])
      const newSeason =  { season: fullSeason.currentSeason, episodes: fullSeason.episodes }

      seasonsAndEpisodes.push(newSeason)

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

  // if ((await mainPage.url()) !== pageUrl) await mainPage.goBack();
  await mainPage.goto(backToMainPage, { waitUntil: "domcontentloaded" });

  } //end of loop

  return newShows;
} //end of new movies or series

module.exports = { brandNewShows };
