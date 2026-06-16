import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from "./src/config/db.js";
import Note from "./src/models/Note.js";
import mongoose from "mongoose";

async function check() {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    const count = await Note.countDocuments();
    console.log("Total notes in DB:", count);
    const newest = await Note.find().sort({ createdAt: -1 }).limit(3);
    console.log("Newest 3 notes:");
    newest.forEach(n => console.log(`- ${n.title} (Created: ${n.createdAt})`));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

check();
