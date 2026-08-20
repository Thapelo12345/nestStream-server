import type { Request, Response, Router } from "express";
import LockManager = require("../lockState");

const express = require("express");
const { brandNewShows } = require("../scrapping-utils/scrapping")
const { getServerUrls } = require("../scrapping-utils/server-urls")
const { Series } = require("../dataBase/connection")
const { SeriesGetUrl, FindShow, AddSeason } = require("../scrapping-utils/showSearch")

const router: Router = express.Router();
const seriesUrl = "https://watchseriestv.org/tv-shows"

router.get("/", async (req: Request, res: Response) => {
    res.json({message: "Series router is working!."})
})

router.get("/latestDate", async (req:Request, res:Response) => {

      try{
        if(LockManager.isBusy()) throw new Error("Server is Currently Busy!.")
         LockManager.setBusy(true)

          const allSeries = await Series.find()
          console.log("Got all the series documents!.")

          for(const series of allSeries){
            console.log(`\nWorking on :\n${series.seriesHeader} \nSeries.\n`)

            const encoded = encodeURIComponent(series.seriesHeader)
            console.log(`This is the encoded value:\n${encoded}`)

            const tvmazeResponse = await fetch(`https://api.tvmaze.com/singlesearch/shows?q=${encoded}`, {method: "GET"})

            if(!tvmazeResponse.ok) {
              console.log("No response From tvmaze!.")

              await Series.updateOne(
                {_id: series._id}, 
                {$set: {lastUpdate: '1010-05-10'}}
              )
              continue
            }

            const data: any = await tvmazeResponse.json()

            console.log(`This the updated : ${data.updated}`)

            if(data.updated === 0) throw new Error("No Date Found!.")

              const newUpdatedDate = new Date(data.updated * 1000)
              console.log(` THis is the date Retrived:\n${newUpdatedDate.toISOString().split("T")[0]}`)

              await Series.updateOne(
                {_id: series._id}, 
                {$set: {lastUpdate: newUpdatedDate.toISOString().split("T")[0]}}
              )

              console.log("Cloud Data Updated!...")

          }//end of 4 loop

          res.json({message: "All Data Updated Successfully!."})
      }
      catch(err: unknown){
        const errMessage = err instanceof Error ? err.message : "unknown error!."

        errMessage === "Server is Currently Busy with another Process!." ?
        res.json({message: errMessage}) :
        res.json({message: "Failed to update Series!.", errorMessage: errMessage})
      }
      finally{LockManager.setBusy(false)}
});

router.get("/new-series", async(req: Request, res: Response)=>{
  let browser: any;
  try{

    if(LockManager.isBusy()) throw new Error("Server is Currently Busy!.")
    LockManager.setBusy(true)

    const results = await brandNewShows(browser, seriesUrl)
    res.json({message: "Added new shows successfully!..", results})
  }

  catch(err: unknown){
    const errMessage = err instanceof Error ? err.message : "unknown server Error"
    console.error(errMessage)

    errMessage === "Server is Currently Busy with another Process!." ?
    res.json({message: errMessage}) :
    res.json({message: "Failed to add new Shows!.."})
  }
  finally{
    LockManager.setBusy(false)
    if (browser) await browser.close();
  }
})

router.get("/programs", async (req: Request, res: Response) => {
  try {

    if(LockManager.isBusy()) throw new Error("Server is Currently Busy!.")
    LockManager.setBusy(true)

    const show = await Series.find({});
    console.log("Show Data recieved successfully!.");
    res
      .json({ message: "Series fetched successfully", data: show })
      .status(200);
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : "unknown error!";
    console.error(errMessage);

    errMessage === "Server is Currently Busy with another Process!." ?
    res.json({message: errMessage}) :
    res.json({ message: "Error fetching series!" }).status(500);
  }finally{LockManager.setBusy(false)}
});

router.post("/get-playableLinks", async(req:Request, res:Response)=>{
  let browser: any = null
  const { seriesName, season, episode } = req.body
  try{
    if(LockManager.isBusy()) throw new Error("Server is Currently Busy!.")
    LockManager.setBusy(true)

    const playableServer = await getServerUrls(browser, seriesUrl, seriesName, season, episode)
    res.json({playableLinks: playableServer})
  }
  catch(err: unknown){
    const errMessage = err instanceof Error ? err.message : "unknown server Error!."
    console.error(errMessage)
    res.json({message: errMessage})
  }
  finally {
    LockManager.setBusy(false)
    if (browser) await browser.close();
  }
})

router.post("/search-url", async(req: Request, res: Response)=>{
  const {Title, Season, Episode } =  req.body
  let browser: any = null

  try{
    if(LockManager.isBusy()) throw new Error("Server is Currently Busy!.")
    LockManager.setBusy(true)

    const url = await SeriesGetUrl(browser, seriesUrl, Title, Season, Episode)
    console.log("Url Retrived successfully!.")
    res.json({playLink: url}).status(200)
  }
  catch(err: unknown){
    const errMessage = err instanceof Error ? err.message : "Unknown Server Error!."
    console.error(errMessage)
    res.json({message: errMessage}).status(404)
  }
  finally {
    LockManager.setBusy(false)
    if (browser) await browser.close();
  }//end of final
})

router.post("/add-season", async(req: Request, res: Response)=>{
  const { Title }  = req.body

  let browser: any;
  try{
    if(LockManager.isBusy()) throw new Error("Server is Currently Busy!.")
    LockManager.setBusy(true)

    if(!Title) throw new Error("Title empty!..")
    const nextSeason = await AddSeason(browser, seriesUrl, Title)
    debugger

    res.json({message: "Season Retrived successfully!.", nextSeason}).status(200)

  }
  catch(err: unknown){
    const errMessage = err instanceof Error ? err.message : "unknown error!."
    console.log(errMessage)

    errMessage === "Server is Currently Busy with another Process!." ?
    res.json({message: errMessage}) :
    res.json({message: "Failed to add season!.."})
  }
  finally {
    LockManager.setBusy(false)
    if (browser) await browser.close();}//end of final

})//end of add season route

router.post("/find-show", async (req:Request, res: Response)=>{
  const { Title, showType } = req.body
  let browser: any;
  try{
    if(LockManager.isBusy()) throw new Error("Server is Currently Busy with another Process!.")
    LockManager.setBusy(true)

    const newShow = await FindShow(browser, seriesUrl, Title, showType)
    console.log("Show was successfully FOUND!.")
    
    res.json({message: "Retrive show Successfully!.", showData: newShow}).status(200)
  }
  catch(err: unknown){
    const errMessage = err instanceof Error ? err.message : "unknown server error!."
    console.log(errMessage)

    errMessage === "Server is Currently Busy with another Process!." ?
    res.json({message: errMessage}) :
    res.json({message: "Failed to find show!.."})
  }
  finally {
    LockManager.setBusy(false)
    if (browser) await browser.close();
  }//end of final

})//end of route

module.exports = router;