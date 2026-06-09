package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

type StringArray []string

func (s StringArray) Value() (driver.Value, error) {
	if s == nil {
		return "[]", nil
	}
	bytes, err := json.Marshal(s)
	return string(bytes), err
}

func (s *StringArray) Scan(value interface{}) error {
	if value == nil {
		*s = StringArray{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, s)
}

type Task struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	Title          string         `gorm:"size:200;not null" json:"title"`
	Description    string         `gorm:"type:text;not null" json:"description"`
	Category       string         `gorm:"size:50;not null" json:"category"`
	Reward         float64        `gorm:"not null" json:"reward"`
	RewardType     string         `gorm:"size:20;default:'fixed'" json:"reward_type"`
	Urgency        string         `gorm:"size:20;default:'normal'" json:"urgency"`
	Deadline       *time.Time     `json:"deadline"`
	Bounty         float64        `gorm:"default:0" json:"bounty"`
	Images         StringArray    `gorm:"type:jsonb;default:'[]'" json:"images"`
	Latitude       float64        `json:"latitude"`
	Longitude      float64        `json:"longitude"`
	LocationAddr   string         `gorm:"size:300" json:"-"`
	Address        string         `gorm:"-" json:"address,omitempty"`
	CommunityID    uint           `gorm:"not null;index" json:"community_id"`
	Community      Community      `gorm:"foreignKey:CommunityID" json:"community,omitempty"`
	PublisherID    uint           `gorm:"not null;index" json:"publisher_id"`
	Publisher      User           `gorm:"foreignKey:PublisherID" json:"publisher,omitempty"`
	ClaimerID      *uint          `gorm:"index" json:"claimer_id"`
	Claimer        *User          `gorm:"foreignKey:ClaimerID" json:"claimer,omitempty"`
	Status         string         `gorm:"size:20;default:pending;index" json:"status"`
	Version        int            `gorm:"default:0" json:"version"`
	ClaimedAt      *time.Time     `json:"claimed_at"`
	CompletedAt    *time.Time     `json:"completed_at"`
	ConfirmedAt    *time.Time     `json:"confirmed_at"`
	CancelledAt    *time.Time     `json:"cancelled_at"`
	CancelReason   string         `gorm:"size:500" json:"cancel_reason"`
	AdminReviewed  bool           `gorm:"default:false" json:"admin_reviewed"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

func (t *Task) MarshalJSON() ([]byte, error) {
	type Alias Task
	addr := t.LocationAddr
	if addr == "" {
		addr = t.Address
	}
	return json.Marshal(&struct {
		*Alias
		LocationAddr string `json:"location_address,omitempty"`
		Address      string `json:"address,omitempty"`
	}{
		Alias:        (*Alias)(t),
		LocationAddr: addr,
		Address:      addr,
	})
}

func (t *Task) UnmarshalJSON(data []byte) error {
	type Alias Task
	aux := &struct {
		*Alias
		LocationAddr string `json:"location_address"`
		Address      string `json:"address"`
	}{
		Alias: (*Alias)(t),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	if aux.LocationAddr != "" {
		t.LocationAddr = aux.LocationAddr
	}
	if aux.Address != "" {
		t.LocationAddr = aux.Address
	}
	t.Address = t.LocationAddr
	return nil
}

func (Task) TableName() string {
	return "tasks"
}

const (
	TaskStatusPending   = "pending"
	TaskStatusClaimed   = "claimed"
	TaskStatusCompleted = "completed"
	TaskStatusConfirmed = "confirmed"
	TaskStatusCancelled = "cancelled"
)

const (
	TaskCategoryDelivery = "delivery"
	TaskCategoryPet      = "pet"
	TaskCategoryRepair   = "repair"
	TaskCategoryMedical  = "medical"
	TaskCategoryTutor    = "tutor"
	TaskCategoryCleaning = "cleaning"
	TaskCategoryCooking  = "cooking"
	TaskCategoryMoving   = "moving"
	TaskCategoryOther    = "other"
)
