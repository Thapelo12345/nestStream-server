"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const router = express.Router();
const { User } = require("../dataBase/connection");
const ImageKit = require("imagekit");
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});
router.get("/", (req, res) => {
    res.send("User router is working!");
});
router.put("/new-user", async (req, res) => {
    const { name, id, email, image, imageId } = req.body;
    try {
        if (!name || !id || !email)
            throw new Error("You have NOT ENTERED your credentials YET!.");
        if (await User.findOne({ userId: id }))
            throw new Error("User credentials Exist!.");
        if (await User.findOne({ userEmail: email }))
            throw new Error("Email already Exist!.");
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
    }
    catch (err) {
        const errMessage = err instanceof Error ? err.message : "unkwon cloud error!..";
        console.error(errMessage);
        res.json({ message: errMessage });
    }
});
router.get("/find-User:ID", async (req, res) => {
    const { ID } = req.params;
    /*
    try {
      const matchingUser = await User.findOne({ userId: ID });
      if (!matchingUser) throw new Error("User Not FOUND!..");
  
      console.log("The user was FOUND!...");
      res.json({ message: "Successfully FOUND user!..", matchingUser });
    } catch (err: unknown) {
      console.error(
        err instanceof Error ? err.message : "unkown Server Error!..",
      );
      res.json({ message: "Failed to find User!.." });
    }
      */
    res.send(`User with ID: ${ID} was Found!.`);
});
router.post("/update-userLikes", async (req, res) => {
    console.log("update liked show route retch");
    const { id, userLikes } = req.body;
    console.log("New user likes bellow");
    console.log(userLikes);
    try {
        const user = await User.findOne({ userId: id });
        console.log("This is the user id:\n ", id);
        if (!user)
            throw new Error("User not found!.");
        user.userLiked = userLikes;
        await user.save();
        console.log("Update was successfully!.");
        res.json({ message: "Update was successfully!." });
    }
    catch (err) {
        console.error(err instanceof Error ? err.message : "unknown error!..");
        res.json({ message: "Failed to update userLikes on thecloud!." });
    }
});
router.post("/update-user-image:ID", async (req, res) => {
    const { ID } = req.params;
    const { image, imageID } = req.body;
    console.log(`This is the image url : \n${image}\nAnd this is the image id:\n${imageID}`);
    try {
        const user = await User.findOne({ userId: ID });
        user.profilePicture = { imageId: imageID, imageUrl: image };
        user.save();
        console.log("Image Updated Successfully!.");
        res.json({ message: "Image Updated Successfully!." });
    }
    catch (err) {
        console.error(err instanceof Error ? err.message : "unknown cloud error!.");
        res.json({ message: "Failed To Update Profile Image!..." });
    }
});
router.get("/imageKit-auth", async (req, res) => {
    const authParams = await imagekit.getAuthenticationParameters();
    res.json({ ...authParams, publicKey: process.env.IMAGEKIT_PUBLIC_KEY }); // Returns token, expire, and signature
});
router.delete("/delete-image/:imageId", async (req, res) => {
    const { imageId } = req.params;
    try {
        // Perform authentication check here before deleting
        if (imageId === "")
            throw new Error("No ImageId FOUND!..");
        await imagekit.deleteFile(imageId);
        res
            .status(200)
            .json({ success: true, message: "File deleted successfully" });
    }
    catch (err) {
        console.error(err);
        res
            .status(500)
            .json({
            success: false,
            message: err instanceof Error ? err.message : "Unknown server error!.",
        });
    }
}); //end of deletion router
module.exports = router;
//# sourceMappingURL=user.js.map