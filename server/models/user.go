package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Username     string         `gorm:"uniqueIndex;size:50" json:"username"`
	Email        string         `gorm:"uniqueIndex;size:100" json:"email"`
	Phone        string         `gorm:"uniqueIndex;size:20" json:"phone"`
	PasswordHash string         `gorm:"not null" json:"-"`
	Avatar       string         `gorm:"size:500" json:"avatar"`
	Bio          string         `gorm:"size:500" json:"bio"`
	Role         string         `gorm:"size:20;default:user" json:"role"`
	CreditScore  int            `gorm:"default:100" json:"credit_score"`
	Balance      float64        `gorm:"default:0" json:"balance"`
	CommunityID  *uint          `json:"community_id"`
	Community    *Community     `gorm:"foreignKey:CommunityID" json:"community,omitempty"`
	Latitude     *float64       `json:"latitude"`
	Longitude    *float64       `json:"longitude"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

func (User) TableName() string {
	return "users"
}
