import dotenv from 'dotenv';
dotenv.config();
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { connectDB } from "./src/config/db.js";
import Note from "./src/models/Note.js";
import mongoose from "mongoose";

async function wipeDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    
    const countBefore = await Note.countDocuments();
    console.log(`Found ${countBefore} old notes.`);
    
    if (countBefore > 0) {
      console.log("Nuking all notes from the database...");
      await Note.deleteMany({});
      console.log("Successfully deleted all notes!");
    } else {
      console.log("Database is already empty!");
    }
    
    const countAfter = await Note.countDocuments();
    console.log(`Remaining notes: ${countAfter}`);
    
  } catch (error) {
    console.error("Error wiping database:", error);
  } finally {
    mongoose.connection.close();
  }
}

wipeDatabase();
