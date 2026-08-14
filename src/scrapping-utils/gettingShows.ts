const { retryAction } = require("./scrappingUtils")

async function navigatingPage3 (mainPageCopy: any, p3: any){

  console.log("page 3 navigation Run!..")
    // open page 3 first and get url opening a third new browser tap
      const url3 = await mainPageCopy.url();

      // waitting for the page3 to load and appear
      await retryAction(async () => {await p3.goto(url3, { waitUntil: "domcontentloaded" })}, 4, 15000 );

      //i am opening the details page on a new browser tap
      await p3.locator("#watch-btn").waitFor({state: "visible" })
      const watchBtn = await p3.locator("#watch-btn");

      // clicking the watch btn and waiting for the dropdown menu to appear
      await watchBtn.click();
      await p3.locator("#watch-dropdown").waitFor({state: "visible" })

      // getting the first server btn
      const server1 = await p3.locator(".watch-dropdown-item").first();
      console.log("clicking server1 button on page 3!");

      // clicking the server1 button and waitting for the url to change to the playable page
      await retryAction(
        async () => { await Promise.all([p3.waitForURL("https://watchseriestv.org/**", { timeout: 15000 }), server1.click(),])},
        3, 15000 );

        return await p3.url();
}

module.exports = { navigatingPage3 }