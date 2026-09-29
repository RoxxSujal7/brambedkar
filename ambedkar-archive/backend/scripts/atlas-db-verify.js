require("dotenv").config();
const mongoose = require("mongoose");
const uri = process.env.MONGO_URI;

mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 }).then(async () => {
  const db = mongoose.connection.db;
  
  // List all collections created
  const cols = await db.listCollections().toArray();
  console.log("=== COLLECTIONS ===");
  cols.forEach(c => console.log(" -", c.name));
  
  // Check users collection
  const users = db.collection("users");
  const count = await users.countDocuments();
  console.log("\n=== USERS ===");
  console.log("Total users:", count);
  
  // Find the atlas verify user
  const testUser = await users.findOne({ email: /atlas\.verify\./i });
  if (testUser) {
    console.log("\n--- Test User (MongoDB Document) ---");
    console.log("_id:", testUser._id.toString());
    console.log("email:", testUser.email);
    console.log("role:", testUser.role);
    console.log("loginCount:", testUser.loginCount);
    console.log("firstLoginAt:", testUser.firstLoginAt);
    console.log("lastLoginAt:", testUser.lastLoginAt);
    console.log("createdAt:", testUser.createdAt);
    console.log("password present:", !!testUser.password);
    console.log("password exposed:", false); // never log it
  } else {
    console.log("Test user NOT FOUND in MongoDB");
  }
  
  // Check authevents collection
  try {
    const authEvents = db.collection("authevents");
    const evCount = await authEvents.countDocuments();
    console.log("\n=== AUTH EVENTS ===");
    console.log("Total auth events:", evCount);
    if (evCount > 0) {
      const recent = await authEvents.find({}).sort({ createdAt: -1 }).limit(3).toArray();
      recent.forEach(e => console.log(" event:", e.event, "user:", e.userEmail || e.actor, "at:", e.createdAt));
    }
  } catch(e) {
    console.log("authevents collection:", e.message);
  }
  
  await mongoose.disconnect();
  console.log("\nDone.");
}).catch(err => { console.error("FAILED:", err.message); process.exit(1); });
