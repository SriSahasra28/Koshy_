const mysql = require("mysql");
const bcrypt = require("bcrypt");

class DatabaseHandler {
  constructor() {
    this.pool = mysql.createPool({
      host: "103.48.51.36",
      user: "satya",
      password: "Airforce*123",
      database: "koshy",
      connectionLimit: 10,
    });
  }

  async check_login(username, password) {
    return new Promise((resolve, reject) => {
      this.pool.query(
        "SELECT password FROM user WHERE username = ?",
        [username],
        async (error, results) => {
          if (error) {
            reject(error);
          } else {
            if (results.length > 0) {
              const user = results[0];
              // Assuming you have stored hashed passwords in the database
              try {
                const passwordMatch = await bcrypt.compare(
                  password,
                  user.password
                );
                if (passwordMatch) {
                  resolve(true);
                } else {
                  // Password doesn't match
                  resolve(false);
                }
              } catch (bcryptError) {
                reject(bcryptError); // Handle bcrypt error
              }
            } else {
              // User not found
              resolve(false);
            }
          }
        }
      );
    });
  }

  async insertUser(username, password, dob, pob) {
    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    return new Promise((resolve, reject) => {
      this.pool.query(
        "INSERT INTO user (username, password, dob, pob) VALUES (?, ?, ?, ?)",
        [username, hashedPassword, dob, pob],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });
  }

  async checkUserDetails(username, dob, pob) {
    return new Promise((resolve, reject) => {
      this.pool.query(
        "SELECT COUNT(*) AS count FROM user WHERE username = ? AND dob = ? AND pob = ?",
        [username, dob, pob],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0].count > 0);
          }
        }
      );
    });
  }

  async updateUserPassword(username, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return new Promise((resolve, reject) => {
      this.pool.query(
        "UPDATE user SET password = ? WHERE username = ?",
        [hashedPassword, username],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0); // Check if any rows were affected
          }
        }
      );
    });
  }
}

module.exports = DatabaseHandler;
