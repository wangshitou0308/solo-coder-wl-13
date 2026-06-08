package models

import (
	"time"

	"gorm.io/gorm"
)

type Community struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"size:100;not null" json:"name"`
	Description string         `gorm:"size:500" json:"description"`
	Avatar      string         `gorm:"size:500" json:"avatar"`
	InviteCode  string         `gorm:"uniqueIndex;size:20;not null" json:"invite_code"`
	Latitude    float64        `gorm:"not null" json:"latitude"`
	Longitude   float64        `gorm:"not null" json:"longitude"`
	Radius      float64        `gorm:"default:1000" json:"radius"`
	AdminID     uint           `gorm:"not null" json:"admin_id"`
	Admin       *User          `gorm:"foreignKey:AdminID" json:"admin,omitempty"`
	MemberCount int            `gorm:"default:0" json:"member_count"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Community) TableName() string {
	return "communities"
}

type CommunityMember struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	CommunityID  uint      `gorm:"not null;index" json:"community_id"`
	Community    Community `gorm:"foreignKey:CommunityID" json:"community,omitempty"`
	UserID       uint      `gorm:"not null;index" json:"user_id"`
	User         User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	JoinedAt     time.Time `json:"joined_at"`
}

func (CommunityMember) TableName() string {
	return "community_members"
}
