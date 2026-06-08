package models

import "time"

type Transaction struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	UserID       uint      `gorm:"not null;index" json:"user_id"`
	User         User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	TaskID       *uint     `gorm:"index" json:"task_id"`
	Task         *Task     `gorm:"foreignKey:TaskID" json:"task,omitempty"`
	Type         string    `gorm:"size:30;not null" json:"type"`
	Amount       float64   `gorm:"not null" json:"amount"`
	BalanceAfter float64   `gorm:"not null" json:"balance_after"`
	Description  string    `gorm:"size:300" json:"description"`
	CreatedAt    time.Time `json:"created_at"`
}

func (Transaction) TableName() string {
	return "transactions"
}

const (
	TransactionTypeDeposit    = "deposit"
	TransactionTypeWithdraw   = "withdraw"
	TransactionTypeFreeze     = "freeze"
	TransactionTypeUnfreeze   = "unfreeze"
	TransactionTypePayment    = "payment"
	TransactionTypeIncome     = "income"
	TransactionTypeRefund     = "refund"
	TransactionTypeCreditAdd  = "credit_add"
)
