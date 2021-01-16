require('dotenv').config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { verify } = require("jsonwebtoken");
const { hash, compare } = require("bcryptjs");
const {
  sendAccessToken,
  sendRefreshToken,
  createAccessToken,
  createRefreshToken,
} = require("./tokens");
const fakeDB = require("./fakeDB.js");
const server = express();
const { isAuth } = require('./isAuth');


// config 
server.use(cookieParser());

server.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// need to able to read the data
server.use(express.json()); // to supports JSON-encoded bodies
server.use(express.urlencoded({ extended: true })); // to supports url-encoded bodies

// 1. Register a user
server.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    // check if user exists
    const user = fakeDB.find((user) => user.email === email);
    if (user) throw new Error("user already exists");
    // if user not exists, hash the password
    const hashPassword = await hash(password, 10);
    // add user in "database"
    fakeDB.push({
      id: fakeDB.length,
      email,
      password: hashPassword,
    });
    res.send({
      message: "user created.",
    });
    // console.log(fakeDB);
  } catch (error) {
    res.send({
      error: `${error.message}`,
    });
  }
});

// 2. login user

server.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. find user in "database"
    const user = await fakeDB.find((user) => user.email === email);
    if (!user) throw new Error("user does not exits");
    // 2. compare the password
    const valid = await compare(password, user.password);
    if (!valid) throw new Error("password invalid");
    // 3. create refresh and excess Token
    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);
    // 4. put refresh token in "database"
    user.refreshToken = refreshToken;
    console.log(user);
    // 5. send token, refreshToken as cookie and accessToken as response
    sendRefreshToken(res, refreshToken);
    sendAccessToken(res, req, accessToken);
  } catch (error) {
    res.send({
      Error: `${error.message}`,
    });
  }
});

// 3. logout user 
server.post('/logout', (_req, res) => {
    res.clearCookie('refreshToken');
    res.send({
        message: 'Logged out',
    });
});

// 4 protected route
server.post('/protected', async(req, res) => {
    try {
        const userId = isAuth(req);
    } catch (error) {
        
    }
})


server.listen(process.env.PORT, () => {
  console.log(`server listenng on port ${process.env.PORT}`);
});
