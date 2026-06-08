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
