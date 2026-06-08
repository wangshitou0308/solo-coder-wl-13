package models

import "time"

type PlatformConfig struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Key       string    `gorm:"uniqueIndex;size:100;not null" json:"key"`
	Value     string    `gorm:"type:text;not null" json:"value"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (PlatformConfig) TableName() string {
	return "platform_configs"
}

type Complaint struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	TaskID      uint      `gorm:"not null;index" json:"task_id"`
	Task        Task      `gorm:"foreignKey:TaskID" json:"task,omitempty"`
	ReporterID  uint      `gorm:"not null;index" json:"reporter_id"`
	Reporter    User      `gorm:"foreignKey:ReporterID" json:"reporter,omitempty"`
	Reason      string    `gorm:"type:text;not null" json:"reason"`
	Status      string    `gorm:"size:20;default:pending" json:"status"`
	Result      string    `gorm:"size:500" json:"result"`
	CreatedAt   time.Time `json:"created_at"`
	ResolvedAt  *time.Time `json:"resolved_at"`
}

func (Complaint) TableName() string {
	return "complaints"
}
