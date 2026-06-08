package services

import (
	"github.com/neighbortask/server/models"
	"github.com/neighbortask/server/repositories"
)

type MessageService struct {
	messageRepo *repositories.MessageRepo
}

func NewMessageService(messageRepo *repositories.MessageRepo) *MessageService {
	return &MessageService{messageRepo: messageRepo}
}

type SendMessageRequest struct {
	ConversationID uint   `json:"conversation_id"`
	ReceiverID     uint   `json:"receiver_id"`
	Content        string `json:"content" binding:"required"`
	Type           string `json:"type"`
	TaskID         *uint  `json:"task_id"`
}

func (s *MessageService) ListConversations(userID uint, page, perPage int) ([]models.Conversation, int64, error) {
	return s.messageRepo.ListConversations(userID, page, perPage)
}

func (s *MessageService) GetOrCreateConversation(user1ID, user2ID uint, taskID *uint) (*models.Conversation, error) {
	return s.messageRepo.FindOrCreateConversation(user1ID, user2ID, taskID)
}

func (s *MessageService) SendMessage(senderID uint, req SendMessageRequest) (*models.Message, error) {
	convID := req.ConversationID

	if convID == 0 {
		conv, err := s.messageRepo.FindOrCreateConversation(senderID, req.ReceiverID, req.TaskID)
		if err != nil {
			return nil, err
		}
		convID = conv.ID
	}

	msgType := req.Type
	if msgType == "" {
		msgType = "text"
	}

	msg := &models.Message{
		ConversationID: convID,
		SenderID:       senderID,
		Content:        req.Content,
		Type:           msgType,
		Read:           false,
	}

	if err := s.messageRepo.CreateMessage(msg); err != nil {
		return nil, err
	}

	return msg, nil
}

func (s *MessageService) ListMessages(conversationID, userID uint, page, perPage int) ([]models.Message, int64, error) {
	messages, total, err := s.messageRepo.ListMessages(conversationID, page, perPage)
	if err != nil {
		return nil, 0, err
	}

	s.messageRepo.MarkAsRead(conversationID, userID)

	return messages, total, nil
}

func (s *MessageService) GetUnreadCount(userID uint) (int64, error) {
	return s.messageRepo.GetUnreadCount(userID)
}
