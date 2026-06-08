package controllers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/neighbortask/server/services"
	"github.com/neighbortask/server/utils"
)

type CommunityController struct {
	communityService *services.CommunityService
}

func NewCommunityController(communityService *services.CommunityService) *CommunityController {
	return &CommunityController{communityService: communityService}
}

func (cc *CommunityController) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	communities, total, err := cc.communityService.List(page, perPage)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.Paginated(c, communities, total, page, perPage)
}

func (cc *CommunityController) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "invalid community id")
		return
	}

	community, err := cc.communityService.GetByID(uint(id))
	if err != nil {
		utils.NotFound(c, "community not found")
		return
	}

	utils.Success(c, community)
}

func (cc *CommunityController) JoinByCode(c *gin.Context) {
	var req services.JoinByCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	userID := c.GetUint("user_id")
	community, err := cc.communityService.JoinByCode(userID, req)
	if err != nil {
		utils.Error(c, 400, err.Error())
		return
	}

	utils.Success(c, community)
}

func (cc *CommunityController) JoinByLocation(c *gin.Context) {
	var req services.JoinByLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	userID := c.GetUint("user_id")
	community, err := cc.communityService.JoinByLocation(userID, req)
	if err != nil {
		utils.Error(c, 400, err.Error())
		return
	}

	utils.Success(c, community)
}

func (cc *CommunityController) GetMembers(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "invalid community id")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	members, total, err := cc.communityService.GetMembers(uint(id), page, perPage)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.Paginated(c, members, total, page, perPage)
}
