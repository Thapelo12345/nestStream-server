import type { Request, Response, Router } from "express";

const express = require("express");
const { brandNewShows } = require("../scrapping-utils/scrapping");
const { Movies } = require("../dataBase/connection");
const { FindShow } = require("../scrapping-utils/showSearch");
const { UpdateMovie } = require("../scrapping-utils/showSearch");
const { getServerUrls } = require("../scrapping-utils/server-urls");
const moviesUrl = "https://watchseriestv.org/movies";

const router: Router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  res.json({ message: "Movies router is working!." });
});

router.get("/new-movies", async (req: Request, res: Response) => {
  const browserRef = { instance: null as any }

  try {
      const results = await brandNewShows(browserRef.instance, moviesUrl);
      res.json({ message: "Added new shows successfully!..", results });

  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : "unknown server Error";
    console.error(errMessage);

    res.json({ message: "Failed to add new Shows!.." });
  }
  finally{
    if (browserRef.instance) {
      try {await browserRef.instance.close();}
       catch (closeError) {console.error("Failed cleaning up active workspace allocations:", closeError);}
    }
  }
});

router.get("/latest-movies-updates", async (req: Request, res: Response) => {

  try {
    const allMovies = await Movies.find();

    for (const movie of allMovies) {
      console.log(`Updating:\n ${movie.movieHeader}\n`);
    } //end of 4loop

    res.json({ message: "All movie data updated Successfully!." });

  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : "unknown server Error!.";
    console.error(errMessage);

    res.json({ message: "Failed to get Latest movies Updates!." });
  }
});

router.get("/get-playableLinks", async (req: Request, res: Response) => {
  const { movieName } = req.body;
  const browserRef = { instance: null as any }

  try {
    const playableServer = await getServerUrls(browserRef.instance, moviesUrl, movieName);
    res.json({ playableLinks: playableServer });

  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : "unknown server Error!.";
    console.error(errMessage);
    res.json({ message: errMessage });
   
  }finally{
    if (browserRef.instance) {
      try {await browserRef.instance.close();}
       catch (closeError) {console.error("Failed cleaning up active workspace allocations:", closeError);}
    }
  }
});

router.get("/programs", async (req: Request, res: Response) => {
  try {
    const movies = await Movies.find({});
    res.json({ message: "Movies fetched successfully", data: movies }).status(200);

  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : "unknown error!";
    console.error(errMessage);
    res.json({ message: "Error fetching movies!" }).status(500);
  }
});

router.post("/update-movie", async (req: Request, res: Response) => {
  const { Title } = req.body;
  // let browser: any = null;
  const browserRef = { instance: null as any }

  try {
    const playLink = await UpdateMovie(browserRef.instance, moviesUrl, Title);
    console.log("Movie updated successfully!.");
    res.json({ playLink }).status(200);

  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : "unknown nework error!.";
    console.log(errMessage);
    res.json({ message: "Falied to update NETWORK ERROR!." }).status(500);
    
  }finally{
    if (browserRef.instance) {
      try {await browserRef.instance.close();}
       catch (closeError) {console.error("Failed cleaning up active workspace allocations:", closeError);}
    }
  }
}); //end o f update movie route

router.post("/find-show", async (req: Request, res: Response) => {
  const { Title, showType } = req.body;
  // let browser: any;
  const browserRef = { instance: null as any }

  try {
    const newShow = await FindShow(browserRef.instance, moviesUrl, Title, showType);
    console.log("Show was successfully FOUND!.");
   
    res.json({ message: "Retrive show Successfully!.", showData: newShow }).status(200);

  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : "unknown server error!.";
    console.log(errMessage);
    res.json({ message: "Failed to find show!.." });
    
  }finally{
    if (browserRef.instance) {
      try {await browserRef.instance.close();}
       catch (closeError) {console.error("Failed cleaning up active workspace allocations:", closeError);}
    }
  }
}); //end of route

module.exports = router;
