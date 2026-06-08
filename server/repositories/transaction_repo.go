package repositories

import (
	"github.com/neighbortask/server/models"
	"gorm.io/gorm"
)

type TransactionRepo struct {
	db *gorm.DB
}

func NewTransactionRepo(db *gorm.DB) *TransactionRepo {
	return &TransactionRepo{db: db}
}

func (r *TransactionRepo) Create(tx *models.Transaction) error {
	return r.db.Create(tx).Error
}

func (r *TransactionRepo) FindByUserID(userID uint, txType string, page, perPage int) ([]models.Transaction, int64, error) {
	var transactions []models.Transaction
	var total int64

	query := r.db.Model(&models.Transaction{}).Where("user_id = ?", userID)

	if txType != "" {
		query = query.Where("type = ?", txType)
	}

	query.Count(&total)

	offset := (page - 1) * perPage
	err := query.Preload("Task").
		Order("created_at DESC").Offset(offset).Limit(perPage).Find(&transactions).Error

	return transactions, total, err
}

func (r *TransactionRepo) GetBalance(userID uint) (float64, error) {
	var user models.User
	err := r.db.Select("balance").First(&user, userID).Error
	return user.Balance, err
}

func (r *TransactionRepo) CreateInBatch(txs []models.Transaction) error {
	return r.db.CreateInBatches(txs, 100).Error
}
