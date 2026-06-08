package repositories

import (
	"github.com/neighbortask/server/models"
	"gorm.io/gorm"
)

type UserRepo struct {
	db *gorm.DB
}

func NewUserRepo(db *gorm.DB) *UserRepo {
	return &UserRepo{db: db}
}

func (r *UserRepo) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepo) FindByID(id uint) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, id).Error
	return &user, err
}

func (r *UserRepo) FindByPhone(phone string) (*models.User, error) {
	var user models.User
	err := r.db.Where("phone = ?", phone).First(&user).Error
	return &user, err
}

func (r *UserRepo) FindByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *UserRepo) Update(user *models.User) error {
	return r.db.Save(user).Error
}

func (r *UserRepo) UpdateBalance(id uint, amount float64) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).
		Update("balance", gorm.Expr("balance + ?", amount)).Error
}

func (r *UserRepo) UpdateCreditScore(id uint, delta int) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).
		Update("credit_score", gorm.Expr("credit_score + ?", delta)).Error
}

func (r *UserRepo) UpdateCommunity(id uint, communityID *uint) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).
		Update("community_id", communityID).Error
}

func (r *UserRepo) GetStats(id uint) (map[string]interface{}, error) {
	var taskCount int64
	var completedCount int64
	var avgRating float64

	r.db.Model(&models.Task{}).Where("publisher_id = ? OR claimer_id = ?", id, id).Count(&taskCount)
	r.db.Model(&models.Task{}).Where("(publisher_id = ? OR claimer_id = ?) AND status = ?", id, id, models.TaskStatusConfirmed).Count(&completedCount)
	r.db.Model(&models.Review{}).Where("reviewee_id = ?").Select("COALESCE(AVG(rating), 0)").Scan(&avgRating)

	return map[string]interface{}{
		"task_count":      taskCount,
		"completed_count": completedCount,
		"avg_rating":      avgRating,
	}, nil
}
