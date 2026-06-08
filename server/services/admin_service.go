package services

import (
	"time"

	"github.com/neighbortask/server/models"
	"github.com/neighbortask/server/repositories"
	"gorm.io/gorm"
)

type AdminService struct {
	taskRepo      *repositories.TaskRepo
	communityRepo *repositories.CommunityRepo
	userRepo      *repositories.UserRepo
	db            *gorm.DB
}

func NewAdminService(taskRepo *repositories.TaskRepo, communityRepo *repositories.CommunityRepo, userRepo *repositories.UserRepo, db *gorm.DB) *AdminService {
	return &AdminService{taskRepo: taskRepo, communityRepo: communityRepo, userRepo: userRepo, db: db}
}

func (s *AdminService) GetPendingTasks(communityID uint, page, perPage int) ([]models.Task, int64, error) {
	return s.taskRepo.FindPendingReview(communityID, page, perPage)
}

func (s *AdminService) ReviewTask(taskID uint, approved bool) (*models.Task, error) {
	taskService := NewTaskService(s.taskRepo, s.userRepo, repositories.NewTransactionRepo(s.db))
	return taskService.ReviewTask(taskID, approved)
}

func (s *AdminService) GetComplaints(status string, page, perPage int) ([]models.Complaint, int64, error) {
	var complaints []models.Complaint
	var total int64

	query := s.db.Model(&models.Complaint{})
	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Count(&total)

	offset := (page - 1) * perPage
	err := query.Preload("Task").Preload("Reporter").
		Order("created_at DESC").Offset(offset).Limit(perPage).Find(&complaints).Error

	return complaints, total, err
}

func (s *AdminService) HandleComplaint(complaintID uint, result string) (*models.Complaint, error) {
	var complaint models.Complaint
	if err := s.db.First(&complaint, complaintID).Error; err != nil {
		return nil, err
	}

	complaint.Status = "resolved"
	complaint.Result = result

	now := time.Now()
	complaint.ResolvedAt = &now

	if err := s.db.Save(&complaint).Error; err != nil {
		return nil, err
	}

	return &complaint, nil
}

func (s *AdminService) GetConfig() ([]models.PlatformConfig, error) {
	var configs []models.PlatformConfig
	err := s.db.Find(&configs).Error
	return configs, err
}

func (s *AdminService) GetConfigByKey(key string) (*models.PlatformConfig, error) {
	var config models.PlatformConfig
	err := s.db.Where("key = ?", key).First(&config).Error
	return &config, err
}

func (s *AdminService) UpdateConfig(key, value string) (*models.PlatformConfig, error) {
	var config models.PlatformConfig
	err := s.db.Where("key = ?", key).First(&config).Error

	if err != nil {
		config = models.PlatformConfig{
			Key:   key,
			Value: value,
		}
		if err := s.db.Create(&config).Error; err != nil {
			return nil, err
		}
		return &config, nil
	}

	config.Value = value
	if err := s.db.Save(&config).Error; err != nil {
		return nil, err
	}

	return &config, nil
}
