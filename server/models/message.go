package models

import "time"

type Conversation struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	User1ID   uint      `gorm:"not null;index" json:"user1_id"`
	User1     User      `gorm:"foreignKey:User1ID" json:"user1,omitempty"`
	User2ID   uint      `gorm:"not null;index" json:"user2_id"`
	User2     User      `gorm:"foreignKey:User2ID" json:"user2,omitempty"`
	TaskID    *uint     `gorm:"index" json:"task_id"`
	Task      *Task     `gorm:"foreignKey:TaskID" json:"task,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Conversation) TableName() string {
	return "conversations"
}

type Message struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	ConversationID uint      `gorm:"not null;index" json:"conversation_id"`
	Conversation   Conversation `gorm:"foreignKey:ConversationID" json:"conversation,omitempty"`
	SenderID       uint      `gorm:"not null" json:"sender_id"`
	Sender         User      `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
	Content        string    `gorm:"type:text;not null" json:"content"`
	Type           string    `gorm:"size:20;default:text" json:"type"`
	Read           bool      `gorm:"default:false" json:"read"`
	CreatedAt      time.Time `json:"created_at"`
}

func (Message) TableName() string {
	return "messages"
}
