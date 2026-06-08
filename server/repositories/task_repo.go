package repositories

import (
	"math"

	"github.com/neighbortask/server/models"
	"gorm.io/gorm"
)

type TaskRepo struct {
	db *gorm.DB
}

func NewTaskRepo(db *gorm.DB) *TaskRepo {
	return &TaskRepo{db: db}
}

func (r *TaskRepo) Create(task *models.Task) error {
	return r.db.Create(task).Error
}

func (r *TaskRepo) FindByID(id uint) (*models.Task, error) {
	var task models.Task
	err := r.db.Preload("Publisher").Preload("Claimer").Preload("Community").First(&task, id).Error
	return &task, err
}

func (r *TaskRepo) Update(task *models.Task) error {
	return r.db.Save(task).Error
}

func (r *TaskRepo) List(communityID uint, status, category string, sortBy string, page, perPage int) ([]models.Task, int64, error) {
	var tasks []models.Task
	var total int64

	query := r.db.Model(&models.Task{}).Where("community_id = ?", communityID)

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}

	query.Count(&total)

	switch sortBy {
	case "reward_asc":
		query = query.Order("reward ASC")
	case "reward_desc":
		query = query.Order("reward DESC")
	case "newest":
		query = query.Order("created_at DESC")
	default:
		query = query.Order("created_at DESC")
	}

	offset := (page - 1) * perPage
	err := query.Preload("Publisher").Preload("Claimer").
		Offset(offset).Limit(perPage).Find(&tasks).Error

	return tasks, total, err
}

func (r *TaskRepo) FindNearby(lat, lng, radius float64, status, category string, page, perPage int) ([]models.Task, int64, error) {
	var tasks []models.Task
	var total int64

	latDiff := radius / 111000.0
	lngDiff := radius / (111320.0 * math.Cos(lat*math.Pi/180.0))

	query := r.db.Model(&models.Task{}).
		Where("latitude BETWEEN ? AND ?", lat-latDiff, lat+latDiff).
		Where("longitude BETWEEN ? AND ?", lng-lngDiff, lng+lngDiff)

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}

	query.Count(&total)

	offset := (page - 1) * perPage
	err := query.Preload("Publisher").Preload("Claimer").
		Order("created_at DESC").Offset(offset).Limit(perPage).Find(&tasks).Error

	return tasks, total, err
}

func (r *TaskRepo) FindPendingReview(communityID uint, page, perPage int) ([]models.Task, int64, error) {
	var tasks []models.Task
	var total int64

	query := r.db.Model(&models.Task{}).
		Where("community_id = ? AND admin_reviewed = false AND status IN ?", communityID,
			[]string{models.TaskStatusPending, models.TaskStatusClaimed})

	query.Count(&total)

	offset := (page - 1) * perPage
	err := query.Preload("Publisher").Preload("Claimer").
		Order("created_at ASC").Offset(offset).Limit(perPage).Find(&tasks).Error

	return tasks, total, err
}

func (r *TaskRepo) GetTaskRanking(communityID uint, limit int) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	err := r.db.Model(&models.Task{}).
		Select("claimer_id, COUNT(*) as task_count").
		Where("community_id = ? AND status = ? AND claimer_id IS NOT NULL", communityID, models.TaskStatusConfirmed).
		Group("claimer_id").
		Order("task_count DESC").
		Limit(limit).
		Find(&results).Error
	return results, err
}

func (r *TaskRepo) GetRatingRanking(communityID uint, limit int) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	err := r.db.Model(&models.Review{}).
		Select("reviewee_id, AVG(rating) as avg_rating, COUNT(*) as review_count").
		Joins("JOIN tasks ON tasks.id = reviews.task_id").
		Where("tasks.community_id = ?", communityID).
		Group("reviewee_id").
		Order("avg_rating DESC").
		Limit(limit).
		Find(&results).Error
	return results, err
}
