import type { Request, Response, Router } from "express";

const express = require("express");
const router: Router = express.Router();
const { User } = require("../dataBase/connection");

const ImageKit = require("imagekit");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY as string,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT as string,
});

router.get("/", (req: Request, res: Response) => {
  res.send("User router is working!");
  // res.json({message: "User router is working!" })
});

router.get("/find-User:ID", async (req: Request, res: Response) => {
  const { ID } = req.params;
    
  try {

    const matchingUser = await User.findOne({ userId: ID });
    if (!matchingUser) throw new Error("User Not FOUND!..");

    console.log("The user was FOUND!...");
    res.json({ message: "Successfully FOUND user!..", matchingUser });
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : "unkown Server Error!.."
    console.error(errMessage)

    res.json({ message: "Failed to find User!.." });
  }
});

router.put("/new-user", async (req: Request, res: Response) => {
  const { name, id, email, image, imageId } = req.body;
  
    try {
    if (!name || !id || !email)throw new Error("You have NOT ENTERED your credentials YET!.");
    if (await User.findOne({ userId: id }))throw new Error("User credentials Exist!.");
    if (await User.findOne({ userEmail: email }))throw new Error("Email already Exist!.");

    const myDate = new Date();

    const newUser = await User.create({
      userId: id,
      profilePicture: { imageId: imageId, imageUrl: image },
      userEmail: email,
      userName: name,
      joinedDate: myDate.toDateString(),
      paymentMethod: "",
      daysLeft: 0,
      accountCanceled: "",
      continueWatching: [],
      userLiked: {
        userSeries: [],
        userMovies: [],
      },
      watchHistory: [],
      userStatus: "",
      userPrefferedGenres: [],
    });

    res.json({ message: "User created successfully!..", newUser });
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : "unkwon cloud error!..";
    console.error(errMessage);

    res.json({ message: errMessage });
  }
});

router.post("/update-userLikes", async (req: Request, res: Response) => {
  const { id, userLikes } = req.body;

  try {
    const user = await User.findOne({ userId: id });
    if (!user) throw new Error("User not found!.");

    user.userLiked = userLikes;
    await user.save();

    console.log("Update was successfully!.");
    res.json({ message: "Update was successfully!." });

  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : "unknown error!.."
    console.log(errMessage);
    res.json({ message: "Failed to update userLikes on the CLOUD!..." });
  }
});

router.post("/update-continue-watch", async(req: Request, res: Response)=>{
  const { id, continueWatch } = req.body

  try{
    const user = await User.findOne({userId: id})
    user.continueWatching = continueWatch
    await user.save()

    res.json({message: "Cloud Updated SuccessFully!.."})
  }
  catch(err: unknown){
    const errMessage = err instanceof Error ? err.message : "unknown Server Error!."
    console.error(errMessage)
    res.json({message: errMessage})
  }
})

router.post("/update-history", async (req: Request, res: Response)=>{
  const { id, history } = req.body

  try{
    const user = await User.findOne({userId: id})
    user.watchHistory = history
    await user.save()

    res.json({message: "Cloud SuccessFully Updated!."})
  }
  catch(err: unknown){
    const errMessage = err instanceof Error ? err.message : "unknown Server Error!."
    console.error(errMessage)
    res.json({message: errMessage})
  }
})

router.post("/update-user-image:ID", async (req: Request, res: Response) => {
  const { ID } = req.params;
  const { image, imageID } = req.body;

  try {
    const user = await User.findOne({ userId: ID });

    console.log("User:\n ", ID)
    if (!user) throw new Error("User not found!.");

    user.profilePicture = { imageId: imageID, imageUrl: image };
    await user.save();
    console.log("Image Updated Successfully!.");
    res.json({ message: "Image Updated Successfully!." });

  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : "inknown cload error!."
    console.error(errMessage);

    res.json({ message: "Failed To Update Profile Image!..." });
  }
});

router.post("/update-user-name:ID", async (req: Request, res: Response) => {
  const { ID } = req.params;
  const { name } = req.body;

  try {

    const user = await User.findOne({ userId: ID });
    user.userName = name;
    await user.save();
    console.log("Update was Successful!.");
    res.json({ message: "Update was Successful!." });

  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : "Failed to Update userName";
    console.error("This is the Error: ", errMessage);
    res.json({ message: errMessage });
  }
});

router.get("/imageKit-auth", async (req: Request, res: Response) => {
    const authParams = await imagekit.getAuthenticationParameters();
    res.json({ ...authParams, publicKey: process.env.IMAGEKIT_PUBLIC_KEY }); // Returns token, expire, and signature

});

router.delete("/delete-image:imageId", async (req: Request, res: Response) => {
  const { imageId } = req.params;
  try {
    
    if (imageId === "") throw new Error("No ImageId FOUND!..");
    await imagekit.deleteFile(imageId);

    res
      .status(200)
      .json({ success: true, message: "File deleted successfully" });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown server error!.",
    });
  }
}); //end of deletion router

module.exports = router;