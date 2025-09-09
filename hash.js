const bcrypt = require("bcryptjs");

const password = "admin123"; // change to your desired admin password

bcrypt.hash(password, 10).then((hash) => {
  console.log("Hashed password:", hash);
});
