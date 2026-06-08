package controllers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/neighbortask/server/services"
	"github.com/neighbortask/server/utils"
)

type AdminController struct {
	adminService *services.AdminService
}

func NewAdminController(adminService *services.AdminService) *AdminController {
	return &AdminController{adminService: adminService}
}

func (ac *AdminController) GetPendingTasks(c *gin.Context) {
	communityID, _ := strconv.ParseUint(c.DefaultQuery("community_id", "0"), 10, 64)
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	tasks, total, err := ac.adminService.GetPendingTasks(uint(communityID), page, perPage)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.Paginated(c, tasks, total, page, perPage)
}

func (ac *AdminController) ReviewTask(c *gin.Context) {
	taskID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "invalid task id")
		return
	}

	var body struct {
		Approved bool `json:"approved"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	task, err := ac.adminService.ReviewTask(uint(taskID), body.Approved)
	if err != nil {
		utils.Error(c, 400, err.Error())
		return
	}

	utils.Success(c, task)
}

func (ac *AdminController) GetComplaints(c *gin.Context) {
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	complaints, total, err := ac.adminService.GetComplaints(status, page, perPage)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.Paginated(c, complaints, total, page, perPage)
}

func (ac *AdminController) HandleComplaint(c *gin.Context) {
	complaintID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "invalid complaint id")
		return
	}

	var body struct {
		Result string `json:"result" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	complaint, err := ac.adminService.HandleComplaint(uint(complaintID), body.Result)
	if err != nil {
		utils.Error(c, 400, err.Error())
		return
	}

	utils.Success(c, complaint)
}

func (ac *AdminController) GetConfig(c *gin.Context) {
	configs, err := ac.adminService.GetConfig()
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.Success(c, configs)
}

func (ac *AdminController) UpdateConfig(c *gin.Context) {
	var body struct {
		Key   string `json:"key" binding:"required"`
		Value string `json:"value" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	config, err := ac.adminService.UpdateConfig(body.Key, body.Value)
	if err != nil {
		utils.Error(c, 400, err.Error())
		return
	}

	utils.Success(c, config)
}
