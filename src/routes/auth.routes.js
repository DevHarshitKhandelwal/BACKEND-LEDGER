const express = require("express")
const authController = require("../controller/auth.controller")

const router = express.Router()

/**
 * -user Register controller
 * -POST /api/auth/register
 */
router.post("/register",authController.userRegisterController)

/**
 * -user Login controller
 * -POST /api/auth/login
 */
router.post("/login",authController.userLoginController)

/**
 * -user logout controller
 * -POST /api/auth/logout
 */


module.exports=router