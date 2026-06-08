package controllers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/neighbortask/server/repositories"
	"github.com/neighbortask/server/utils"
)

type LeaderboardController struct {
	taskRepo *repositories.TaskRepo
}

func NewLeaderboardController(taskRepo *repositories.TaskRepo) *LeaderboardController {
	return &LeaderboardController{taskRepo: taskRepo}
}

func (lc *LeaderboardController) TasksRanking(c *gin.Context) {
	communityID, _ := strconv.ParseUint(c.DefaultQuery("community_id", "0"), 10, 64)
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if limit <= 0 || limit > 100 {
		limit = 20
	}

	ranking, err := lc.taskRepo.GetTaskRanking(uint(communityID), limit)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.Success(c, ranking)
}

func (lc *LeaderboardController) RatingRanking(c *gin.Context) {
	communityID, _ := strconv.ParseUint(c.DefaultQuery("community_id", "0"), 10, 64)
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if limit <= 0 || limit > 100 {
		limit = 20
	}

	ranking, err := lc.taskRepo.GetRatingRanking(uint(communityID), limit)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.Success(c, ranking)
}
