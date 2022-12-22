const express = require("express");
const accountRouter = express.Router();
const { JWT_SECRET, JWT_SECRET_RESET, JWT_REFRESH_SECRET } = process.env;
const jwt = require("jsonwebtoken");
const { requireUser } = require("./utils");
const path = require("path");
const { body, check, validationResult } = require("express-validator");
const rateLimiter = require("./ratelimiter");
const {
  createUser,
  addToken,
  getUser,
  addLocation,
  addBio,
  getUserByUsername,
  getUserByName,
  getUserByEmail,
  getUserById,
  updatePassword,
  updateVendorSubscriptionStatus,
  updateUserSubscriptionStatus,
} = require("../db");

accountRouter.post(
  "/register",
  rateLimiter({ secondsWindow: 60, allowedHits: 5 }),
  check("username")
    .not()
    .isEmpty()
    .withMessage("Please provide a valid username")
    .trim()
    .escape()
    .isLength({ min: 3 })
    .withMessage({ message: "Username must have a min of 4 characters" }),
  check("email")
    .not()
    .isEmpty()
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  check("location").trim().escape(),
  check("password")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .isLength({ min: 8 })
    .withMessage({
      message: "Password does not meet the min requirements of 8 characters",
    })
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, "i")
    .withMessage({
      message:
        "Password must include one lowercase character, one uppercase character, a number, and a special character.",
    }),
  check("confirmpassword")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .isLength({ min: 8 })
    .withMessage({
      message: "Password does not meet the min requirements of 8 characters",
    })
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, "i")
    .withMessage({
      message:
        "Password must include one lowercase character, one uppercase character, a number, and a special character.",
    }),
  async (req, res, next) => {
    const { username, email, password, confirmpassword, location } = req.body;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array() });
    } else {
      try {
        const _email = await getUserByEmail(email);
        if (_email) {
          next({
            error: "EmailExistsError",
            message: "A user with that email already exists",
          });
          return false;
        }

        const _user = await getUserByUsername(username);
        if (_user) {
          next({
            error: "UserExistsError",
            message: "A user by that username already exists",
          });
          return false;
        }

        if (password.length < 8) {
          next({
            error: "PasswordNotStrongEnough",
            message: "Password not strong enough, minimum 8 characters",
          });
          return false;
        }

        if (password != confirmpassword) {
          next({
            error: "PasswordsMatchError",
            message: "Your password and confirmed password don't match.",
          });
          return false;
        }
        const user = await createUser({
          username,
          email,
          password,
          confirmpassword,
          location,
        });
        if (!user) {
          next({
            message: "Ooops, could not create your account, please try again.",
          });
        } else {
          const token = jwt.sign(
            {
              id: user.id,
              username,
            },
            JWT_SECRET,
            {
              expiresIn: "15m",
            }
          );

          const refreshToken = jwt.sign(
            {
              id: user.id,
              username,
            },
            JWT_REFRESH_SECRET,
            {
              expiresIn: "30d",
            }
          );

          const addRefreshToken = await addToken(username, refreshToken);

          res.send({
            success: "SuccessfulRegistration",
            message: "Thank you for signing up, please return to login.",
            user,
            token,
            refreshToken,
          });
        }
      } catch (error) {
        console.log(error, errors);
        next(error);
      }
    }
  }
);

accountRouter.post(
  "/login",
  check("username")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage({ message: "Please provide a valid username" }),
  check("password")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage({ message: "Please provide a valid password" }),
  rateLimiter({ secondsWindow: 60, allowedHits: 5 }),
  async (req, res, next) => {
    const { username, password, refreshToken } = req.body;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        if (!refreshToken || refreshToken === null) {
          res.status(401).json({ message: "No token found" });
          return false;
        }
        if (!refreshToken.includes(refreshToken)) {
          res.status(403).json({ message: "Invalid token found" });
          return false;
        }
        jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET,
          async (err, user) => {
            if (err) {
              console.log(err);
              return false;
            } else {
              const user = await getUser({ username, password });
              if (user) {
                const token = jwt.sign(user, process.env.JWT_SECRET);
                next({
                  success: "SuccsessfulLogin",
                  message: "Welcome to Fari!",
                  token,
                  refreshToken,
                });
              } else {
                next({
                  error: "IncorrectCredentialsError",
                  message: "Your username or password is invalid.",
                });
              }
            }
          }
        );
      } catch (error) {
        console.error(error, errors);
        next(error);
      }
    }
  }
);

accountRouter.patch(
  "/addbio/:id",
  requireUser,
  check("bio").trim().escape(),
  check("id")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { id } = req.params;
    const bio = req.body.bio;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const data = {
          bio: bio,
        };
        const biography = await addBio(id, data);
        res.send({ user: biography });
      } catch (error) {
        console.log(error);
        next({ name: "ErrorSettiingBio", message: "Could not add biography" });
      }
    }
  }
);

accountRouter.patch(
  "/addlocation/:id",
  requireUser,
  check("location").trim().escape(),
  check("id")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { id } = req.params;
    const location = req.body.location;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const data = {
          location: location,
        };
        const userLocation = await addLocation(id, data);
        res.send({ user: userLocation });
      } catch (error) {
        console.log(error);
        next({
          name: "ErrorSettiingLocation",
          message: "Could not add location",
        });
      }
    }
  }
);

accountRouter.get(
  "/password-reset/:id/:token",
  rateLimiter({ secondsWindow: 60, allowedHits: 5 }),
  async (req, res, next) => {
    const { id, token } = req.params;
    try {
      const _user2 = await getUserById(id);
      const payload = jwt.verify(token, JWT_SECRET_RESET);
      res.set(
        "Content-Security-Policy",
        "default-src *; style-src 'self' http://* 'unsafe-inline'; script-src 'self' http://* 'unsafe-inline' 'unsafe-eval'"
      );
      res.sendFile(path.join(__dirname, "../public/password-reset.html"));
    } catch (error) {
      console.log(error);
      res.sendFile(path.join(__dirname, "../public/password-reset-link.html"));
    }
  }
);

accountRouter.post(
  "/password-reset/:id/:token",
  rateLimiter({ secondsWindow: 60, allowedHits: 5 }),
  check("id")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  check("password")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .isLength({ min: 8 })
    .withMessage("Password does not meet the min requirements of 8 characters")
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, "i")
    .withMessage(
      "Password must include one lowercase character, one uppercase character, a number, and a special character."
    ),
  check("confirmpassword")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .isLength({ min: 8 })
    .withMessage("Password does not meet the min requirements of 8 characters")
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, "i")
    .withMessage(
      "Password must include one lowercase character, one uppercase character, a number, and a special character."
    ),
  async (req, res, next) => {
    const { id, token } = req.params;
    const { password, confirmpassword } = req.body;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const updatedPassword = {
          password: password,
          confirmpassword: confirmpassword,
        };
        if (password != confirmpassword) {
          next({
            error: "PasswordsMatchError",
            message: "Your password and confirmed password does not match",
          });
          return false;
        }
        const updatingUser = await updatePassword(id, updatedPassword);
        res.sendFile(
          path.join(__dirname, "../public/password-reset-success.html")
        );
      } catch (error) {
        console.log("Oops, could not update user password", error);
        res.sendFile(
          path.join(__dirname, "../public/password-reset-unsuccessful.html")
        );
        next(error);
      }
    }
  }
);

accountRouter.patch(
  "/vendor-subscription-update/:id",
  requireUser,
  check("id")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { id } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const updatingVendor = await updateVendorSubscriptionStatus(id);
        res.send({ updatedSubscription: updatingVendor });
      } catch (error) {
        console.log("Oops, could not update vendor subscription status", error);
      }
    }
  }
);

accountRouter.patch(
  "/user-subscription-update/:id",
  requireUser,
  check("id")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { id } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const updatingUser = await updateUserSubscriptionStatus(id);
        res.send({ updatedSubscription: updatingUser });
      } catch (error) {
        console.log("Oops, could not update user subscription status", error);
      }
    }
  }
);

module.exports = accountRouter;
