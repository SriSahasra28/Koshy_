const express = require("express");
const router = express.Router();
const DatabaseHandler = require("./DatabaseHandler");
const dbHandler = new DatabaseHandler();

router.get("/check_login", async (req, res) => {
  const { username, password } = req.query;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    const data = await dbHandler.check_login(username, password);
    res.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    // Properly handle specific error cases
    if (
      error.message === "User not found" ||
      error.message === "Invalid password"
    ) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

router.post("/insert_user", async (req, res) => {
  const { username, password, dob, pob } = req.body;
  if (!username || !password || !dob || !pob) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    await dbHandler.insertUser(username, password, dob, pob);
    res.status(201).json({ message: "User inserted successfully" });
  } catch (error) {
    console.error("Error inserting user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/check_user_details", async (req, res) => {
  const { username, dob, pob } = req.query;

  // Validate input data
  if (!username || !dob || !pob) {
    return res.status(400).json({ error: "All fields are required" });
  }
  try {
    // Check if user details exist in the database
    const userExists = await dbHandler.checkUserDetails(username, dob, pob);
    res.json({ userExists });
  } catch (error) {
    console.error("Error checking user details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/update_user_password", async (req, res) => {
  const { username, newPassword } = req.body;
  console.log(username);
  console.log(newPassword);

  if (!username || !newPassword) {
    return res
      .status(400)
      .json({ error: "Username and new password are required" });
  }

  try {
    // Update user password in the database
    const passwordUpdated = await dbHandler.updateUserPassword(
      username,
      newPassword
    );
    if (passwordUpdated) {
      res.json({ message: "Password updated successfully" });
    } else {
      res.status(404).json({ error: "User not found or password not updated" });
    }
  } catch (error) {
    console.error("Error updating user password:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
