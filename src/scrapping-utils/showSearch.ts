const { chromium } = require("playwright");
const cheerio = require("cheerio");
const { Series, Movies } = require("../dataBase/connection");
const {retryAction, gettingTheSeason } = require("./scrappingUtils")
const { navigatingPage3 } = require("./gettingShows")

async function SeriesGetUrl(browser:any, pageUrl:string, title: string, season: string, episode: string){
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const mainPage = await context.newPage();

    // opening upLink to page
    console.log("OPENING THE SERIES PAGE\n")
    await retryAction(async () => {await mainPage.goto(pageUrl, { waitUntil: "domcontentloaded" })}, 4, 1500);
    await mainPage.locator("#search-input").waitFor({state: "visible"})

    console.log("Entering the series header on the Search Bar!.")
    await mainPage.getByPlaceholder("Enter keywords...").fill(title);

    const searchBtn = await mainPage.locator("#search-btn")
    console.log("Clicking Search btn!.")
    await searchBtn.click()

    console.log("Waiting for page navigation btn's to disappear!.")
    await mainPage.locator(".page-btn").waitFor({state: "hidden"})

    const card = await mainPage.locator(".show-card").first()
    await card.click()
    console.log("Waitting for season button to be visible!....")
    await mainPage.locator("#season-btn").waitFor({state: "visible"})

    const seasonbtn = await mainPage.locator("#season-btn")
    await seasonbtn.click()
    await mainPage.locator("#season-dropdown").waitFor({state: "visible"})

    console.log("Click Seaon btn!.")
    const currentSeason = await mainPage.locator(`[data-season="${season.split(" ")[1]}"]`)
    await currentSeason.click()
    await mainPage.locator("#season-dropdown").waitFor({state: "hidden"})

    console.log("Click Episode btn!.")
    const episodeBtn = await mainPage.locator("#episode-btn")
    await episodeBtn.click()
    await mainPage.locator("#episode-dropdown").waitFor({state: "visible" })

    const currentEpisode = await mainPage.locator(`[data-episode="${episode.split(" ")[1]}"]`)
    await currentEpisode.click()
    await mainPage.locator("#episode-dropdown").waitFor({state: "hidden"})

    console.log("Click Watch btn!.")
    const watchBtn = await mainPage.locator("#watch-btn")
    await watchBtn.click()
    await mainPage.locator("#watch-dropdown").waitFor({state: "visible" })

    console.log("Click Server1 btn!.")
    const server1Btn = await mainPage.locator(".watch-dropdown-menu").first()
    await server1Btn.click()
    await mainPage.locator("#player-iframe").waitFor({state: "visible" })

    console.log("Got Url!.\n")
    const playLink = await mainPage.locator("#player-iframe").getAttribute("src");

    console.log(`Here is the url:\n${playLink}\n`)

    console.log("Updating Cloud!.")
    await Series.updateOne(
  { seriesHeader: title},
  { $set: { "seriesSeasons.$[seasonEl].episodes.$[episodeEl].play": playLink } },
  {
    arrayFilters: [
      { "seasonEl.season": season },
      { "episodeEl.name": episode }
    ]
  }
);

    return playLink
}

async function UpdateMovie(browser: any, pageUrl: string, title: string){
  browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const mainPage = await context.newPage();

    // opening upLink to page
    console.log("OPENING THE MOVIES PAGE\n")
    await retryAction(async () => {await mainPage.goto(pageUrl, { waitUntil: "domcontentloaded" })}, 4, 1500);
    await mainPage.locator("#search-input").waitFor({state: "visible"})

    console.log("Entering the movie header on the Search Bar!.")
    await mainPage.getByPlaceholder("Enter keywords...").fill(title);

    const searchBtn = await mainPage.locator("#search-btn")
    console.log("Clicking Search btn!.")
    await searchBtn.click()

    console.log("Waiting for page navigation btn's to disappear!.")
    await mainPage.locator(".page-btn").waitFor({state: "hidden"})

    const card = await mainPage.locator(".movie-card").first()
    await card.click()
    console.log("Waitting for season button to be visible!....")
    await mainPage.locator("#watch-btn").waitFor({state: "visible"})

    console.log("Click Watch btn!.")
    const watchBtn = await mainPage.locator("#watch-btn")
    await watchBtn.click()
    await mainPage.locator("#watch-dropdown").waitFor({state: "visible" })

    console.log("Click Server1 btn!.")
    const server1Btn = await mainPage.locator(".watch-dropdown-menu").first()
    await server1Btn.click()
    await mainPage.locator("#player-iframe").waitFor({state: "visible" })

    console.log("Got Url!.\n")
    const playLink = await mainPage.locator("#player-iframe").getAttribute("src");

    console.log("Updating Cloud!.")
    
  await Movies.updateOne(
  { movieHeader: title},
  { $set: {playingUrl: playLink}}
);

    return playLink
}//end of update movie function


async function FindShow(browser: any, pageUrl: string, title: string, typeOfShow: string){
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const mainPage = await context.newPage();

    // opening upLink to page
    console.log("OPENING THE SHOW PAGE\n")
    await retryAction(async () => {await mainPage.goto(pageUrl, { waitUntil: "domcontentloaded" })}, 4, 1500);
    await mainPage.locator("#search-input").waitFor({state: "visible"})

    console.log("Entering the movie header on the Search Bar!..")
    await mainPage.getByRole("textbox").fill(title)

    console.log(`Searching for: ${title}`)

    const searchBtn = await mainPage.locator("#search-btn")
    console.log("Clicking Search btn!.")

    await searchBtn.click()
    await mainPage.locator(".show-card, .movie-card").first().waitFor({state: "visible"})

    const numberOfCards = await mainPage.locator(".show-card, .movie-card").count()
    let startingCardPosition = -1
   
    // if the number of cards is zero then that mean the is noresults
    if(numberOfCards === 0) throw new Error("Show not FOUND!..")
      
      // loop through crads to find a card that is not in mongoDB
      for(let i = 0; i < numberOfCards; i++){
      const cardChecked = await mainPage.locator(".show-card, .movie-card").nth(i)
      const headerText = await cardChecked.locator("h3").textContent();

      const showFound = typeOfShow  == "series" ?
       await Series.findOne({seriesHeader: headerText}) :
       await Movies.findOne({movieHeader: headerText})

       if(!showFound){
        startingCardPosition = i
        break;
       }

    }//end of 4 loop

    if(startingCardPosition === -1) throw new Error("Their No MORE SHOWS!..")

    const card = await mainPage.locator(".show-card, .movie-card").nth(startingCardPosition)

    console.log("Clicking tv programme card!..")

    await card.click()
    await mainPage.locator(".detail-content").waitFor({ state: "visible" })

      let secondTapHtml = await mainPage.content();
      let $2 = await cheerio.load(secondTapHtml);

      // getting page details
      const showHeader = $2(".detail-title").text().trim();
      
      const tagLine = $2(".detail-tagline").text().trim() == "" ? "no tag line found" : $2(".detail-tagline").text().trim();
      const showLanguage =  $2(".extra-info .info-item").eq(1).find(".info-value").text().trim()

      const description = $2(".detail-overview p").text().trim();
      const genres = $2(".genre-tag").toArray().map((genre: any) => $2(genre).text().trim());
      const imageUrl = $2(".detail-poster-container img").attr("src");
      const year = $2(".meta-item span").first().text().trim();
      const rate = $2(".rating-large span").text().trim();
      const cast = $2(".cast-card").toArray().map((cas: any) => {
          const actorImage = $2(cas).find(".cast-photo").attr("src");
          const actorCharacter = $2(cas).find(".cast-character").text().trim();
          const actorRealName = $2(cas).find(".cast-name").text().trim();

          return { actorRealName, actorCharacter, actorImage };
        });

      
        if(typeOfShow === "series"){

      // if showType is a series break
      const targetGenres = ["Talk", "Reality", "News"]

      if( targetGenres.some((genre)=> genres.includes(genre)) )
        {
        console.log("\nThis show is not a series! going back to main page!");
        console.log("Back to main page! going to next card!\n");
        await mainPage.goBack()
        throw new Error("The is not a series or soapie!..")
      } //end of if showType series

          const seasonsAndEpisodes: any[] = [];

        // if series will have to get season
        let seasons: any;

        seasons = $2("#season-dropdown .dropdown-item").toArray().map((season: any) => $2(season).text().trim().split("-")[0].trim());
        let newSeason: any;

        // open page 3 first and get url opening a third new browser tap
        const page3 = await context.newPage();
        let page3Url = await navigatingPage3(mainPage, page3);
        console.log("I am getting a series show");

        newSeason = await gettingTheSeason(mainPage, seasons[0], page3Url, page3);
        seasonsAndEpisodes.push(newSeason);

        const waitingSeasons = seasons.filter((season: string)=> {
              let seasonExist = false
              for(let i = 0; i < seasonsAndEpisodes.length; i++){
                  if(seasonsAndEpisodes[i].season === season){
                    seasonExist = true
                    break
                  }
              }//end of 4 loop
              if(!seasonExist) return season

            })
        const uploadedSeries = await Series.create({
            seriesHeader: showHeader,
            seriesTag: tagLine,
            seriesLanguage: showLanguage,
            seriesDescription: description,
            seriesImageUrl: imageUrl,
            seriesYear: year,
            seriesRating: Number(rate == "N/A" ? "0.0" : rate),
            seriesGenres: genres,
            seriesCast: cast,
            seriesSeasons: seasonsAndEpisodes,
            pendingSeasons: waitingSeasons,
            lastUpdate: "1010-05-10"
          });

          await page3.close()
          const tempShow = await Series.findOne({ seriesHeader: uploadedSeries.seriesHeader }).lean()
          return tempShow
      }//end of series if

      else{
        const watchBtn = await mainPage.locator("#watch-btn")
        await watchBtn.click()
        await mainPage.locator("#watch-dropdown").waitFor({state: "visible"})

        const server1 = await mainPage.locator(".watch-dropdown-item").first()
        await server1.click()

        await mainPage.locator("#player-iframe").waitFor({ state: "visible" })
        const playLink = await mainPage.locator("#player-iframe").getAttribute("src")

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
          playingUrl: playLink,
        });

        let tempShow = await Movies.findOne({ movieHeader: uploadedMovie.movieHeader }).lean()
        return tempShow
      }

}//end of find show function

async function AddSeason(browser: any, pageUrl: string, title: string){
  
  const cloudShow = await Series.findOne({ seriesHeader: title})

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const mainPage = await context.newPage();

    // opening upLink to page
    console.log("OPENING THE SERIES PAGE\n")
    await retryAction(async () => {await mainPage.goto(pageUrl, { waitUntil: "domcontentloaded" })}, 4, 1500);
    await mainPage.locator("#search-input").waitFor({state: "visible"})

    console.log("Entering the movie header on the Search Bar!.")
    await mainPage.getByPlaceholder("Enter keywords...").fill(title);

    console.log(`Searching for: ${title}`)
    const searchBtn = await mainPage.locator("#search-btn")
    console.log("Clicking Search btn!.")
    await searchBtn.click()
    await mainPage.locator(".page-btn").waitFor({ state: "hidden"})

    await retryAction(async () => {await mainPage.waitForSelector(".show-card")}, 2, 1500);

    const card = await mainPage.locator(".show-card").first()

    console.log("Clicking card!..")
    await retryAction(async () => {
        await Promise.all([mainPage.locator(".detail-content").waitFor({state: "attached" }), card.click()])
      }, 4, 15000 );

        // open page 3 first and get url opening a third new browser tap
        const page3 = await context.newPage();
        let page3Url = await navigatingPage3(mainPage, page3);

        console.log("Getting the next new season!..\n")
        const newSeason = await gettingTheSeason(mainPage, cloudShow.pendingSeasons[0], page3Url, page3);
       
        await page3.close()
        cloudShow.seriesSeasons.push(newSeason);
        cloudShow.markModified('seriesSeasons')
        await cloudShow.save()

        console.log("Removing an element in pending seasons!")

        cloudShow.pendingSeasons.splice(0, 1)
        cloudShow.markModified('pendingSeasons')
        await cloudShow.save()

        return newSeason
}

module.exports = { SeriesGetUrl, UpdateMovie, FindShow, AddSeason }