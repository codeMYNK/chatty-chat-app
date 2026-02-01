import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/message.modal.js";
import User from "../models/user.modal.js";

export const getUsersForSidebar = async (req, res) => {
  // Logic to fetch users for sidebar
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getUserForSidebar: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMessages = async (req, res) => {
  // Logic to fetch messages between users
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const message = await Message.find({
        $or: [
            {senderId:myId, receiverId:userToChatId},
            {senderId:userToChatId, receiverId:myId},
        ]
    })

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in getMessages: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const sendMessage = async (req, res) => {
    try {
        const {text, image} = req.body;
        const {id: receiverId} = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if(image) {
            //Upload base64 image to cloudinary
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });
        await newMessage.save();
        // TODO: Real Time Functionality to be implement
        const receiverSocketId = getReceiverSocketId(receiverId);
        if(receiverSocketId){
          io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage: ", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};