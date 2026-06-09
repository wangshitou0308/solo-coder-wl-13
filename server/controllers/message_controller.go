package controllers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/neighbortask/server/services"
	"github.com/neighbortask/server/utils"
)

type MessageController struct {
	messageService *services.MessageService
}

func NewMessageController(messageService *services.MessageService) *MessageController {
	return &MessageController{messageService: messageService}
}

func (mc *MessageController) ListConversations(c *gin.Context) {
	userID := c.GetUint("user_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	conversations, total, err := mc.messageService.ListConversations(userID, page, perPage)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.Paginated(c, conversations, total, page, perPage)
}

func (mc *MessageController) ListMessages(c *gin.Context) {
	conversationID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "invalid conversation id")
		return
	}

	userID := c.GetUint("user_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "50"))

	messages, total, err := mc.messageService.ListMessages(uint(conversationID), userID, page, perPage)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.Paginated(c, messages, total, page, perPage)
}

func (mc *MessageController) ListMessagesAlias(c *gin.Context) {
	idStr := c.Param("id")
	taskIDStr := c.Query("task_id")

	userID := c.GetUint("user_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "50"))
	pageSizeStr := c.Query("page_size")
	if pageSizeStr != "" {
		if ps, err := strconv.Atoi(pageSizeStr); err == nil {
			perPage = ps
		}
	}

	var conversationID uint
	idVal, idErr := strconv.ParseUint(idStr, 10, 64)

	if taskIDStr != "" {
		taskID, err := strconv.ParseUint(taskIDStr, 10, 64)
		if err != nil {
			utils.BadRequest(c, "invalid task_id")
			return
		}
		conv, err := mc.messageService.GetConversationByTaskID(userID, uint(taskID))
		if err != nil {
			conv, err = mc.messageService.GetOrCreateConversation(userID, 0, &uint(taskID))
			if err != nil {
				utils.NotFound(c, "conversation not found for this task")
				return
			}
		}
		conversationID = conv.ID
	} else if idErr == nil {
		taskID := uint(idVal)
		conv, err := mc.messageService.GetConversationByTaskID(userID, taskID)
		if err == nil {
			conversationID = conv.ID
		} else {
			conversationID = uint(idVal)
		}
	} else {
		utils.BadRequest(c, "invalid id")
		return
	}

	messages, total, err := mc.messageService.ListMessages(conversationID, userID, page, perPage)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.Paginated(c, messages, total, page, perPage)
}

func (mc *MessageController) Send(c *gin.Context) {
	var req services.SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	userID := c.GetUint("user_id")
	msg, err := mc.messageService.SendMessage(userID, req)
	if err != nil {
		utils.Error(c, 400, err.Error())
		return
	}

	utils.Success(c, msg)
}

func (mc *MessageController) UnreadCount(c *gin.Context) {
	userID := c.GetUint("user_id")
	count, err := mc.messageService.GetUnreadCount(userID)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.Success(c, gin.H{"unread_count": count})
}
