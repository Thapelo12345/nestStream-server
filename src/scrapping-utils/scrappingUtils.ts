const cheerio = require("cheerio");
const mediaUrl: string[] = []

type EPISODE = {
  _id: boolean;
name: String;
 title: String;
  play: String;
}
// playwright re-try global function
async function retryAction<T>(
  action: () => Promise<T>,
  retries = 3,
  delay = 2000,
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await action(); // Try the action
    } catch (error: any) {
      const isTimeout =
        error.name === "TimeoutError" || error.message.includes("Timeout");

      if (isTimeout && attempt < retries) {
        console.warn(
          `⚠️ Timeout on attempt ${attempt}/${retries}. Retrying in ${delay / 1000}s...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        // If it's a different error or we ran out of retries, throw the error
        throw error;
      }
    }
  }
  throw new Error("Action failed after max retries");
} //end of re-try global function

async function episodesPlayableUrls(
  mainUrl: string,
  currentEpisode: any,
  pageNavigation: any,
) {
  const arr = currentEpisode.name.trim().split(" ");
  const newFormat = "&" + arr[0].toLowerCase() + "=" + arr[1];

  const copyUrl = mainUrl.replace("&episode=1", newFormat);

  await retryAction(
    async () => {
      await pageNavigation.goto(copyUrl, { waitUntil: "domcontentloaded" });
      await pageNavigation.locator("#player-iframe").waitFor({state: "visible"})
    },
    4,
    15000,
  );

  const playableUrl = await pageNavigation
    .locator("#player-iframe")
    .getAttribute("src");

    if(mediaUrl.includes(playableUrl) || (playableUrl == undefined || playableUrl == "")) return "no url found"
    else{
      mediaUrl.push(playableUrl)
      return  playableUrl;
    }
} //end of episodes playable urls function

async function gettingTheSeason(
  mainCard: any,
  currentSeason: string,
  originalUrl: string,
  thirdPage: any,
) {
  const seasonBtn = mainCard.locator("#season-btn");

  console.log("Click the season btn");
  await seasonBtn.click();
  await mainCard.locator("#season-dropdown").waitFor({ state: "visible" })

  console.log("Clicking from the dropdown menu!.");

  const dropdownSelected = mainCard.locator(`[data-season="${currentSeason.split(" ")[1]}"]`)

  await dropdownSelected.click();
  await mainCard.locator("#season-dropdown").waitFor({state: "hidden" })

  console.log("updating cheerio!");
  const newUrl = await mainCard.content();
  let $2 = await cheerio.load(newUrl);

  // getting season format
  const seasonArray = currentSeason.toLowerCase().split(" ");
  const previouse_season_number =
    seasonArray[1] !== "1"
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
    .map((episode: any) => {
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

async function GetSeason(currentPage: any, currentSeason: string){
const seasonNumber = currentSeason.split(" ")[1]
if(!seasonNumber) throw new Error("No Season FOUND!.")

const seasonMainBtn = await currentPage.locator("#season-btn")
console.log("Opening season btn from detail page")

console.log("Clicking the season btn to open the season dropdown1.")
await seasonMainBtn.click()
await currentPage.locator("#season-dropdown").waitFor({state: "visible"})

 const allSeasonBtn = await currentPage.locator("#season-dropdown .dropdown-item ").all()

 for(const season of allSeasonBtn){
  const seasonNumberValue = await season.getAttribute('data-season');

  if(seasonNumberValue.trim() === seasonNumber.trim()){
    console.log("This is the current season: ", seasonNumber)
    await season.click()
    await currentPage.locator("#season-dropdown").waitFor({state: "hidden"})
    break;
  }
 }//end of 4 loop


//  get all the episodes
 const episodes:EPISODE[] = [] 
 
 console.log("Getting all episodes from Details page!.")
 const mainEpisodeBtn  = await currentPage.locator("#episode-btn")

 console.log("opening episode drop down menu!.")

 await mainEpisodeBtn.click()
 await currentPage.locator("#episode-dropdown").waitFor({state: "visible"})

 const AllEpisodes = await currentPage.locator("#episode-dropdown .dropdown-item ").all()

 // for each episode create an object
for(const episode of AllEpisodes){
  const rawText = await episode.textContent()
  const arr = rawText.trim().split("-")

  console.log(`Creating ${arr[0]}`)
  episodes.push({_id: false, name: arr[0].trim(), title: arr[1], play: ""})
}//end of 4 loop

console.log("Getting episode Url's")

const watchBtn = await currentPage.locator("#watch-btn")
await watchBtn.click()
await currentPage.locator("#watch-dropdown").waitFor({state: "visible"})

const server1 = await currentPage.locator("#watch-dropdown .watch-dropdown-item").first()
console.log("opening the first epsode 1 url!.")
await server1.click()
await currentPage.locator("#player-iframe").waitFor({state: "visible"})

const firstFrameUrl = await currentPage.url()

for(const episode of episodes){
  const remove = "episode=1"
  const episodeNumber = episode.name.split(" ")[1]?.trim()

  if(episodeNumber !== "1"){
    // console.log(`Moving to episode ${episodeNumber}`)

    const add = `episode=${episodeNumber}`

    const newUrl = firstFrameUrl.replace(remove, add)
    await currentPage.goto(newUrl, { waitUntil: "domcontentloaded" })
    await currentPage.locator("#player-iframe").waitFor({state: "visible"})
  }//end of if

  console.log(`Getting Episode ${episodeNumber}`)
  const playLink = await currentPage.locator("#player-iframe").getAttribute("src")
  episode.play = playLink
}//end of 4 loop

return {_id: false, currentSeason, episodes}

}

async function scrappeCardInfo(page: any){
  // Doing cheerio scraping on the *new* tab page
      let secondTapHtml = await page.content();
      let $2 = await cheerio.load(secondTapHtml);

      // getting page details
      const showHeader = $2(".detail-title").text().trim();
      const tagLine = $2(".detail-tagline").text().trim() == "" ? "no tag line found" : $2(".detail-tagline").text().trim();
      const showLanguage = $2(".extra-info .info-item").last().find(".info-value").text().trim();

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

    const seasons = $2("#season-dropdown .dropdown-item").toArray().map((season: any) => $2(season).text().trim().split("-")[0].trim()) 

    return {showHeader, tagLine, showLanguage, description, genres, imageUrl, year, rate, cast, seasons}
}//end of scrappe function

module.exports = { retryAction, episodesPlayableUrls, gettingTheSeason, scrappeCardInfo, GetSeason }