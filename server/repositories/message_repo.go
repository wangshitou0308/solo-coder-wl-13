package repositories

import (
	"github.com/neighbortask/server/models"
	"gorm.io/gorm"
)

type MessageRepo struct {
	db *gorm.DB
}

func NewMessageRepo(db *gorm.DB) *MessageRepo {
	return &MessageRepo{db: db}
}

func (r *MessageRepo) CreateConversation(conv *models.Conversation) error {
	return r.db.Create(conv).Error
}

func (r *MessageRepo) FindConversationByID(id uint) (*models.Conversation, error) {
	var conv models.Conversation
	err := r.db.Preload("User1").Preload("User2").Preload("Task").First(&conv, id).Error
	return &conv, err
}

func (r *MessageRepo) FindOrCreateConversation(user1ID, user2ID uint, taskID *uint) (*models.Conversation, error) {
	var conv models.Conversation

	query := r.db.Where("(user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)",
		user1ID, user2ID, user2ID, user1ID)

	if taskID != nil {
		query = query.Where("task_id = ?", *taskID)
	}

	err := query.First(&conv).Error
	if err == gorm.ErrRecordNotFound {
		conv = models.Conversation{
			User1ID: user1ID,
			User2ID: user2ID,
			TaskID:  taskID,
		}
		if err := r.db.Create(&conv).Error; err != nil {
			return nil, err
		}
		return &conv, nil
	}
	return &conv, err
}

func (r *MessageRepo) ListConversations(userID uint, page, perPage int) ([]models.Conversation, int64, error) {
	var conversations []models.Conversation
	var total int64

	query := r.db.Model(&models.Conversation{}).
		Where("user1_id = ? OR user2_id = ?", userID, userID)

	query.Count(&total)

	offset := (page - 1) * perPage
	err := query.Preload("User1").Preload("User2").Preload("Task").
		Order("updated_at DESC").Offset(offset).Limit(perPage).Find(&conversations).Error

	return conversations, total, err
}

func (r *MessageRepo) CreateMessage(msg *models.Message) error {
	return r.db.Create(msg).Error
}

func (r *MessageRepo) ListMessages(conversationID uint, page, perPage int) ([]models.Message, int64, error) {
	var messages []models.Message
	var total int64

	query := r.db.Model(&models.Message{}).Where("conversation_id = ?", conversationID)
	query.Count(&total)

	offset := (page - 1) * perPage
	err := query.Preload("Sender").
		Order("created_at ASC").Offset(offset).Limit(perPage).Find(&messages).Error

	return messages, total, err
}

func (r *MessageRepo) MarkAsRead(conversationID, userID uint) error {
	return r.db.Model(&models.Message{}).
		Where("conversation_id = ? AND sender_id != ? AND read = false", conversationID, userID).
		Update("read", true).Error
}

func (r *MessageRepo) GetUnreadCount(userID uint) (int64, error) {
	var count int64
	err := r.db.Model(&models.Message{}).
		Joins("JOIN conversations ON conversations.id = messages.conversation_id").
		Where("(conversations.user1_id = ? OR conversations.user2_id = ?) AND messages.sender_id != ? AND messages.read = false",
			userID, userID, userID).
		Count(&count).Error
	return count, err
}
