package controllers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/neighbortask/server/repositories"
	"github.com/neighbortask/server/services"
	"github.com/neighbortask/server/utils"
)

type UserController struct {
	userRepo    *repositories.UserRepo
	paymentSvc  *services.PaymentService
	reviewRepo  *repositories.ReviewRepo
}

func NewUserController(userRepo *repositories.UserRepo, paymentSvc *services.PaymentService, reviewRepo *repositories.ReviewRepo) *UserController {
	return &UserController{userRepo: userRepo, paymentSvc: paymentSvc, reviewRepo: reviewRepo}
}

func (uc *UserController) GetPublicInfo(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "invalid user id")
		return
	}

	user, err := uc.userRepo.FindByID(uint(id))
	if err != nil {
		utils.NotFound(c, "user not found")
		return
	}

	utils.Success(c, gin.H{
		"id":          user.ID,
		"nickname":    user.Nickname,
		"avatar":      user.Avatar,
		"bio":         user.Bio,
		"role":        user.Role,
		"credit_score": user.CreditScore,
		"created_at":  user.CreatedAt,
	})
}

func (uc *UserController) GetStats(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "invalid user id")
		return
	}

	stats, err := uc.userRepo.GetStats(uint(id))
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.Success(c, stats)
}

func (uc *UserController) GetTransactions(c *gin.Context) {
	userID := c.GetUint("user_id")
	txType := c.Query("type")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	transactions, total, err := uc.paymentSvc.GetTransactions(userID, txType, page, perPage)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.Paginated(c, transactions, total, page, perPage)
}

func (uc *UserController) Withdraw(c *gin.Context) {
	var req services.WithdrawRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	userID := c.GetUint("user_id")
	tx, err := uc.paymentSvc.Withdraw(userID, req)
	if err != nil {
		utils.Error(c, 400, err.Error())
		return
	}

	utils.Success(c, tx)
}

func (uc *UserController) AddCredit(c *gin.Context) {
	var req services.CreditRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	userID := c.GetUint("user_id")
	tx, err := uc.paymentSvc.AddCredit(userID, req)
	if err != nil {
		utils.Error(c, 400, err.Error())
		return
	}

	utils.Success(c, tx)
}

func (uc *UserController) GetUserReviews(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "invalid user id")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	reviews, total, err := uc.reviewRepo.FindByUserID(uint(id), page, perPage)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.Paginated(c, reviews, total, page, perPage)
}
