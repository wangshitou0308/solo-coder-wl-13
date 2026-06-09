package controllers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/neighbortask/server/services"
	"github.com/neighbortask/server/utils"
)

type TaskController struct {
	taskService *services.TaskService
}

func NewTaskController(taskService *services.TaskService) *TaskController {
	return &TaskController{taskService: taskService}
}

func (tc *TaskController) Create(c *gin.Context) {
	var req services.CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	userID := c.GetUint("user_id")
	task, err := tc.taskService.Create(userID, req)
	if err != nil {
		utils.Error(c, 400, err.Error())
		return
	}

	utils.Success(c, task)
}

func (tc *TaskController) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "invalid task id")
		return
	}

	task, err := tc.taskService.GetByID(uint(id))
	if err != nil {
		utils.NotFound(c, "task not found")
		return
	}

	utils.Success(c, task)
}

func (tc *TaskController) List(c *gin.Context) {
	var filter services.TaskFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	pageSizeStr := c.Query("page_size")
	perPageStr := c.Query("per_page")
	if pageSizeStr != "" {
		if ps, err := strconv.Atoi(pageSizeStr); err == nil {
			filter.PageSize = ps
		}
	}
	if perPageStr != "" {
		if pp, err := strconv.Atoi(perPageStr); err == nil {
			filter.PerPage = pp
		}
	}

	tasks, total, err := tc.taskService.List(filter)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.Paginated(c, tasks, total, filter.Page, filter.PerPage)
}

func (tc *TaskController) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "invalid task id")
		return
	}

	var req services.UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	userID := c.GetUint("user_id")
	task, err := tc.taskService.Update(uint(id), userID, req)
	if err != nil {
		utils.Error(c, 400, err.Error())
		return
	}

	utils.Success(c, task)
}

func (tc *TaskController) Claim(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "invalid task id")
		return
	}

	userID := c.GetUint("user_id")
	task, err := tc.taskService.Claim(uint(id), userID)
	if err != nil {
		utils.Error(c, 400, err.Error())
		return
	}

	utils.Success(c, task)
}

func (tc *TaskController) Complete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "invalid task id")
		return
	}

	userID := c.GetUint("user_id")
	task, err := tc.taskService.Complete(uint(id), userID)
	if err != nil {
		utils.Error(c, 400, err.Error())
		return
	}

	utils.Success(c, task)
}

func (tc *TaskController) Confirm(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "invalid task id")
		return
	}

	userID := c.GetUint("user_id")
	task, err := tc.taskService.Confirm(uint(id), userID)
	if err != nil {
		utils.Error(c, 400, err.Error())
		return
	}

	utils.Success(c, task)
}

func (tc *TaskController) Cancel(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "invalid task id")
		return
	}

	var body struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&body)

	userID := c.GetUint("user_id")
	task, err := tc.taskService.Cancel(uint(id), userID, body.Reason)
	if err != nil {
		utils.Error(c, 400, err.Error())
		return
	}

	utils.Success(c, task)
}

func (tc *TaskController) SubmitReview(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "invalid task id")
		return
	}

	var body struct {
		RevieweeID uint   `json:"reviewee_id"`
		Rating     int    `json:"rating" binding:"required,min=1,max=5"`
		Comment    string `json:"comment"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	userID := c.GetUint("user_id")
	taskID := uint(id)

	revieweeID := body.RevieweeID
	if revieweeID == 0 {
		task, err := tc.taskService.GetByID(taskID)
		if err != nil {
			utils.NotFound(c, "task not found")
			return
		}
		if userID == task.PublisherID {
			if task.ClaimerID != nil {
				revieweeID = *task.ClaimerID
			} else {
				utils.Error(c, 400, "task has no claimer")
				return
			}
		} else if task.ClaimerID != nil && userID == *task.ClaimerID {
			revieweeID = task.PublisherID
		} else {
			utils.Error(c, 400, "only task participants can submit review")
			return
		}
	}

	review, err := tc.taskService.SubmitReview(taskID, userID, revieweeID, body.Rating, body.Comment)
	if err != nil {
		utils.Error(c, 400, err.Error())
		return
	}

	utils.Success(c, review)
}
