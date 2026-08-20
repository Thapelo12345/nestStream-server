import type { Request, Response, Router } from "express";
import LockManager = require("../lockState");

const express = require("express");
const { brandNewShows} = require("../scrapping-utils/scrapping")
const { Movies } = require("../dataBase/connection")
const { FindShow } = require("../scrapping-utils/showSearch")
const { UpdateMovie } = require("../scrapping-utils/showSearch")
const { getServerUrls } = require("../scrapping-utils/server-urls")
const moviesUrl = "https://watchseriestv.org/movies"

const router: Router = express.Router();

router.get("/", async (req: Request, res: Response) => {
    res.json({ message: "Movies router is working!." });
})

router.get("/new-movies", async(req: Request, res: Response)=>{
  let browser: any;
  try{

    if(LockManager.isBusy()) throw new Error("Server is Currently Busy with another Process!.")
    LockManager.setBusy(true)

    const results = await brandNewShows(browser, moviesUrl)
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

router.get("/latest-movies-updates", async(req: Request, res: Response)=>{
  try{

    if(LockManager.isBusy()) throw new Error("Server is Currently Busy!.")
    LockManager.setBusy(true)

    const allMovies = await Movies.find()

    for(const movie of allMovies){
      console.log(`Updating:\n ${movie.movieHeader}\n`)

    }//end of 4loop

    res.json({message: "All movie data updated Successfully!."})
  }
  catch(err: unknown){
    const  errMessage = err instanceof Error ? err.message : "unknown server Error!."
    console.error(errMessage)

    errMessage === "Server is Currently Busy with another Process!." ?
    res.json({message: errMessage}) :
    res.json({message: "Failed to get Latest movies Updates!."})
  }
  finally{LockManager.setBusy(false)}
})

router.get("/get-playableLinks", async(req:Request, res:Response)=>{
  let browser: any = null;
  const { movieName } = req.body

  try{

    if(LockManager.isBusy()) throw new Error("Server is Currently Busy!.")
    LockManager.setBusy(true)

    const playableServer = await getServerUrls(browser, moviesUrl, movieName)
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

router.get("/programs", async (req: Request, res: Response) => {
  try {
    if(LockManager.isBusy()) throw new Error("Server is Currently Busy!.")
    LockManager.setBusy(true)

    const movies = await Movies.find({});
    res
      .json({ message: "Movies fetched successfully", data: movies })
      .status(200);
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : "unknown error!";
    console.error(errMessage);

    errMessage === "Server is Currently Busy with another Process!." ?
    res.json({message: errMessage}) :
    res.json({ message: "Error fetching movies!" }).status(500);
  }
  finally{LockManager.setBusy(false)}
});

router.post("/update-movie", async (req: Request, res: Response)=>{

  const { Title } = req.body;
  let browser: any = null

  try{

    if(LockManager.isBusy()) throw new Error("Server is Currently Busy!.")
    LockManager.setBusy(true)

    const playLink = await UpdateMovie(browser, moviesUrl, Title)
    console.log("Movie updated successfully!.")
    res.json({playLink}).status(200)
  }
  catch(err: unknown){
    const errMessage = err instanceof Error ? err.message : "unknown nework error!."
    console.log(errMessage)

    errMessage === "Server is Currently Busy with another Process!." ?
    res.json({message: errMessage}) :
    res.json({message: "Falied to update NETWORK ERROR!."}).status(500)
  }
  finally{
    LockManager.setBusy(false)
    if (browser) await browser.close();
  }

})//end o f update movie route

router.post("/find-show", async (req:Request, res: Response)=>{
  const { Title, showType } = req.body
  let browser: any;

  try{

    if(LockManager.isBusy()) throw new Error("Server is Currently Busy!.")
    LockManager.setBusy(true)

    const newShow = await FindShow(browser, moviesUrl, Title, showType)
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