package models

import "time"

type Review struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	TaskID    uint      `gorm:"not null;index" json:"task_id"`
	Task      Task      `gorm:"foreignKey:TaskID" json:"task,omitempty"`
	ReviewerID uint     `gorm:"not null;index" json:"reviewer_id"`
	Reviewer  User      `gorm:"foreignKey:ReviewerID" json:"reviewer,omitempty"`
	RevieweeID uint     `gorm:"not null;index" json:"reviewee_id"`
	Reviewee  User      `gorm:"foreignKey:RevieweeID" json:"reviewee,omitempty"`
	Rating    int       `gorm:"not null" json:"rating"`
	Comment   string    `gorm:"size:500" json:"comment"`
	CreatedAt time.Time `json:"created_at"`
}

func (Review) TableName() string {
	return "reviews"
}
