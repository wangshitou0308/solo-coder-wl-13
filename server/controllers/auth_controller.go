package controllers

import (
	"github.com/gin-gonic/gin"
	"github.com/neighbortask/server/services"
	"github.com/neighbortask/server/utils"
)

type AuthController struct {
	authService *services.AuthService
}

func NewAuthController(authService *services.AuthService) *AuthController {
	return &AuthController{authService: authService}
}

func (ac *AuthController) Register(c *gin.Context) {
	var req services.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	user, tokens, err := ac.authService.Register(req)
	if err != nil {
		utils.Error(c, 400, err.Error())
		return
	}

	utils.Success(c, gin.H{
		"user":   user,
		"tokens": tokens,
	})
}

func (ac *AuthController) Login(c *gin.Context) {
	var req services.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	user, tokens, err := ac.authService.Login(req)
	if err != nil {
		utils.Unauthorized(c, err.Error())
		return
	}

	utils.Success(c, gin.H{
		"user":   user,
		"tokens": tokens,
	})
}

func (ac *AuthController) Refresh(c *gin.Context) {
	var req services.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	tokens, err := ac.authService.RefreshToken(req.RefreshToken)
	if err != nil {
		utils.Unauthorized(c, err.Error())
		return
	}

	utils.Success(c, tokens)
}

func (ac *AuthController) Me(c *gin.Context) {
	userID := c.GetUint("user_id")

	user, err := ac.authService.GetCurrentUser(userID)
	if err != nil {
		utils.NotFound(c, "user not found")
		return
	}

	utils.Success(c, user)
}
