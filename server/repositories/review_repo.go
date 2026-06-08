package repositories

import (
	"github.com/neighbortask/server/models"
	"gorm.io/gorm"
)

type ReviewRepo struct {
	db *gorm.DB
}

func NewReviewRepo(db *gorm.DB) *ReviewRepo {
	return &ReviewRepo{db: db}
}

func (r *ReviewRepo) Create(review *models.Review) error {
	return r.db.Create(review).Error
}

func (r *ReviewRepo) FindByUserID(userID uint, page, perPage int) ([]models.Review, int64, error) {
	var reviews []models.Review
	var total int64

	query := r.db.Model(&models.Review{}).Where("reviewee_id = ?", userID)
	query.Count(&total)

	offset := (page - 1) * perPage
	err := query.Preload("Reviewer").Preload("Task").
		Order("created_at DESC").Offset(offset).Limit(perPage).Find(&reviews).Error

	return reviews, total, err
}

func (r *ReviewRepo) FindByTaskID(taskID uint) ([]models.Review, error) {
	var reviews []models.Review
	err := r.db.Where("task_id = ?", taskID).Preload("Reviewer").Find(&reviews).Error
	return reviews, err
}

func (r *ReviewRepo) ExistsByTaskAndReviewer(taskID, reviewerID uint) (bool, error) {
	var count int64
	err := r.db.Model(&models.Review{}).
		Where("task_id = ? AND reviewer_id = ?", taskID, reviewerID).
		Count(&count).Error
	return count > 0, err
}

func (r *ReviewRepo) GetAverageRating(userID uint) (float64, error) {
	var avgRating float64
	err := r.db.Model(&models.Review{}).
		Where("reviewee_id = ?", userID).
		Select("COALESCE(AVG(rating), 0)").
		Scan(&avgRating).Error
	return avgRating, err
}
