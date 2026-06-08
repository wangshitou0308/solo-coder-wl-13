package services

import (
	"errors"

	"github.com/neighbortask/server/models"
	"github.com/neighbortask/server/repositories"
)

type PaymentService struct {
	userRepo *repositories.UserRepo
	txRepo   *repositories.TransactionRepo
}

func NewPaymentService(userRepo *repositories.UserRepo, txRepo *repositories.TransactionRepo) *PaymentService {
	return &PaymentService{userRepo: userRepo, txRepo: txRepo}
}

type WithdrawRequest struct {
	Amount float64 `json:"amount" binding:"required,gt=0"`
}

type CreditRequest struct {
	Amount float64 `json:"amount" binding:"required,gt=0"`
}

func (s *PaymentService) GetTransactions(userID uint, txType string, page, perPage int) ([]models.Transaction, int64, error) {
	return s.txRepo.FindByUserID(userID, txType, page, perPage)
}

func (s *PaymentService) Withdraw(userID uint, req WithdrawRequest) (*models.Transaction, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if user.Balance < req.Amount {
		return nil, errors.New("insufficient balance")
	}

	if err := s.userRepo.UpdateBalance(userID, -req.Amount); err != nil {
		return nil, err
	}

	tx := &models.Transaction{
		UserID:       userID,
		Type:         models.TransactionTypeWithdraw,
		Amount:       -req.Amount,
		BalanceAfter: user.Balance - req.Amount,
		Description:  "提现",
	}

	if err := s.txRepo.Create(tx); err != nil {
		s.userRepo.UpdateBalance(userID, req.Amount)
		return nil, err
	}

	return tx, nil
}

func (s *PaymentService) AddCredit(userID uint, req CreditRequest) (*models.Transaction, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if err := s.userRepo.UpdateBalance(userID, req.Amount); err != nil {
		return nil, err
	}

	tx := &models.Transaction{
		UserID:       userID,
		Type:         models.TransactionTypeCreditAdd,
		Amount:       req.Amount,
		BalanceAfter: user.Balance + req.Amount,
		Description:  "充值",
	}

	if err := s.txRepo.Create(tx); err != nil {
		s.userRepo.UpdateBalance(userID, -req.Amount)
		return nil, err
	}

	return tx, nil
}

func (s *PaymentService) GetBalance(userID uint) (float64, error) {
	return s.txRepo.GetBalance(userID)
}
