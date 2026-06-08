package services

import (
	"errors"
	"time"

	"github.com/neighbortask/server/models"
	"github.com/neighbortask/server/repositories"
)

type TaskService struct {
	taskRepo   *repositories.TaskRepo
	userRepo   *repositories.UserRepo
	txRepo     *repositories.TransactionRepo
	reviewRepo *repositories.ReviewRepo
}

func NewTaskService(taskRepo *repositories.TaskRepo, userRepo *repositories.UserRepo, txRepo *repositories.TransactionRepo, reviewRepo ...*repositories.ReviewRepo) *TaskService {
	svc := &TaskService{taskRepo: taskRepo, userRepo: userRepo, txRepo: txRepo}
	if len(reviewRepo) > 0 {
		svc.reviewRepo = reviewRepo[0]
	}
	return svc
}

type CreateTaskRequest struct {
	Title       string   `json:"title" binding:"required"`
	Description string   `json:"description" binding:"required"`
	Category    string   `json:"category" binding:"required"`
	Reward      float64  `json:"reward" binding:"required,gt=0"`
	Bounty      float64  `json:"bounty"`
	Images      []string `json:"images"`
	Latitude    float64  `json:"latitude"`
	Longitude   float64  `json:"longitude"`
	LocationAddr string  `json:"location_address"`
	CommunityID uint     `json:"community_id" binding:"required"`
}

type UpdateTaskRequest struct {
	Title       *string  `json:"title"`
	Description *string  `json:"description"`
	Category    *string  `json:"category"`
	Reward      *float64 `json:"reward"`
	Bounty      *float64 `json:"bounty"`
	Images      []string `json:"images"`
	Latitude    *float64 `json:"latitude"`
	Longitude   *float64 `json:"longitude"`
	LocationAddr *string `json:"location_address"`
}

type TaskFilter struct {
	CommunityID uint   `form:"community_id"`
	Status      string `form:"status"`
	Category    string `form:"category"`
	SortBy      string `form:"sort_by"`
	Latitude    float64 `form:"latitude"`
	Longitude   float64 `form:"longitude"`
	Radius      float64 `form:"radius"`
	Page        int    `form:"page"`
	PerPage     int    `form:"per_page"`
}

func (s *TaskService) Create(publisherID uint, req CreateTaskRequest) (*models.Task, error) {
	user, err := s.userRepo.FindByID(publisherID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if user.Balance < req.Reward+req.Bounty {
		return nil, errors.New("insufficient balance")
	}

	if err := s.userRepo.UpdateBalance(publisherID, -(req.Reward + req.Bounty)); err != nil {
		return nil, err
	}

	task := &models.Task{
		Title:       req.Title,
		Description: req.Description,
		Category:    req.Category,
		Reward:      req.Reward,
		Bounty:      req.Bounty,
		Images:      models.StringArray(req.Images),
		Latitude:    req.Latitude,
		Longitude:   req.Longitude,
		LocationAddr: req.LocationAddr,
		CommunityID: req.CommunityID,
		PublisherID: publisherID,
		Status:      models.TaskStatusPending,
	}

	if err := s.taskRepo.Create(task); err != nil {
		s.userRepo.UpdateBalance(publisherID, req.Reward+req.Bounty)
		return nil, err
	}

	tx := &models.Transaction{
		UserID:       publisherID,
		TaskID:       &task.ID,
		Type:         models.TransactionTypeFreeze,
		Amount:       -(req.Reward + req.Bounty),
		BalanceAfter: user.Balance - req.Reward - req.Bounty,
		Description:  "冻结任务赏金",
	}
	s.txRepo.Create(tx)

	return task, nil
}

func (s *TaskService) GetByID(id uint) (*models.Task, error) {
	return s.taskRepo.FindByID(id)
}

func (s *TaskService) List(filter TaskFilter) ([]models.Task, int64, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.PerPage <= 0 {
		filter.PerPage = 20
	}

	if filter.Latitude != 0 && filter.Longitude != 0 && filter.Radius > 0 {
		return s.taskRepo.FindNearby(filter.Latitude, filter.Longitude, filter.Radius,
			filter.Status, filter.Category, filter.Page, filter.PerPage)
	}

	return s.taskRepo.List(filter.CommunityID, filter.Status, filter.Category,
		filter.SortBy, filter.Page, filter.PerPage)
}

func (s *TaskService) Update(taskID, userID uint, req UpdateTaskRequest) (*models.Task, error) {
	task, err := s.taskRepo.FindByID(taskID)
	if err != nil {
		return nil, errors.New("task not found")
	}

	if task.PublisherID != userID {
		return nil, errors.New("only publisher can update task")
	}

	if task.Status != models.TaskStatusPending {
		return nil, errors.New("can only update pending tasks")
	}

	if req.Title != nil {
		task.Title = *req.Title
	}
	if req.Description != nil {
		task.Description = *req.Description
	}
	if req.Category != nil {
		task.Category = *req.Category
	}
	if req.Reward != nil {
		task.Reward = *req.Reward
	}
	if req.Bounty != nil {
		task.Bounty = *req.Bounty
	}
	if req.Images != nil {
		task.Images = models.StringArray(req.Images)
	}
	if req.Latitude != nil {
		task.Latitude = *req.Latitude
	}
	if req.Longitude != nil {
		task.Longitude = *req.Longitude
	}
	if req.LocationAddr != nil {
		task.LocationAddr = *req.LocationAddr
	}

	if err := s.taskRepo.Update(task); err != nil {
		return nil, err
	}

	return task, nil
}

func (s *TaskService) Claim(taskID, claimerID uint) (*models.Task, error) {
	task, err := s.taskRepo.FindByID(taskID)
	if err != nil {
		return nil, errors.New("task not found")
	}

	if task.Status != models.TaskStatusPending {
		return nil, errors.New("task is not available for claiming")
	}

	if task.PublisherID == claimerID {
		return nil, errors.New("cannot claim your own task")
	}

	now := time.Now()
	task.ClaimerID = &claimerID
	task.Status = models.TaskStatusClaimed
	task.ClaimedAt = &now

	if err := s.taskRepo.Update(task); err != nil {
		return nil, err
	}

	return task, nil
}

func (s *TaskService) Complete(taskID, claimerID uint) (*models.Task, error) {
	task, err := s.taskRepo.FindByID(taskID)
	if err != nil {
		return nil, errors.New("task not found")
	}

	if task.ClaimerID == nil || *task.ClaimerID != claimerID {
		return nil, errors.New("only claimer can mark task as completed")
	}

	if task.Status != models.TaskStatusClaimed {
		return nil, errors.New("task is not in claimed status")
	}

	now := time.Now()
	task.Status = models.TaskStatusCompleted
	task.CompletedAt = &now

	if err := s.taskRepo.Update(task); err != nil {
		return nil, err
	}

	return task, nil
}

func (s *TaskService) Confirm(taskID, publisherID uint) (*models.Task, error) {
	task, err := s.taskRepo.FindByID(taskID)
	if err != nil {
		return nil, errors.New("task not found")
	}

	if task.PublisherID != publisherID {
		return nil, errors.New("only publisher can confirm task")
	}

	if task.Status != models.TaskStatusCompleted {
		return nil, errors.New("task is not in completed status")
	}

	now := time.Now()
	task.Status = models.TaskStatusConfirmed
	task.ConfirmedAt = &now

	if err := s.taskRepo.Update(task); err != nil {
		return nil, err
	}

	claimerID := *task.ClaimerID
	claimer, _ := s.userRepo.FindByID(claimerID)

	s.userRepo.UpdateBalance(claimerID, task.Reward+task.Bounty)

	tx := &models.Transaction{
		UserID:       claimerID,
		TaskID:       &task.ID,
		Type:         models.TransactionTypeIncome,
		Amount:       task.Reward + task.Bounty,
		BalanceAfter: claimer.Balance + task.Reward + task.Bounty,
		Description:  "完成任务获得赏金",
	}
	s.txRepo.Create(tx)

	s.userRepo.UpdateCreditScore(publisherID, 1)
	s.userRepo.UpdateCreditScore(claimerID, 2)

	return task, nil
}

func (s *TaskService) Cancel(taskID, userID uint, reason string) (*models.Task, error) {
	task, err := s.taskRepo.FindByID(taskID)
	if err != nil {
		return nil, errors.New("task not found")
	}

	if task.PublisherID != userID && (task.ClaimerID == nil || *task.ClaimerID != userID) {
		return nil, errors.New("only publisher or claimer can cancel task")
	}

	if task.Status == models.TaskStatusConfirmed || task.Status == models.TaskStatusCancelled {
		return nil, errors.New("cannot cancel confirmed or already cancelled task")
	}

	now := time.Now()
	task.Status = models.TaskStatusCancelled
	task.CancelledAt = &now
	task.CancelReason = reason

	if err := s.taskRepo.Update(task); err != nil {
		return nil, err
	}

	publisher, _ := s.userRepo.FindByID(task.PublisherID)
	s.userRepo.UpdateBalance(task.PublisherID, task.Reward+task.Bounty)

	tx := &models.Transaction{
		UserID:       task.PublisherID,
		TaskID:       &task.ID,
		Type:         models.TransactionTypeRefund,
		Amount:       task.Reward + task.Bounty,
		BalanceAfter: publisher.Balance + task.Reward + task.Bounty,
		Description:  "取消任务退还赏金",
	}
	s.txRepo.Create(tx)

	s.userRepo.UpdateCreditScore(userID, -5)

	return task, nil
}

func (s *TaskService) GetPendingReview(communityID uint, page, perPage int) ([]models.Task, int64, error) {
	return s.taskRepo.FindPendingReview(communityID, page, perPage)
}

func (s *TaskService) ReviewTask(taskID uint, approved bool) (*models.Task, error) {
	task, err := s.taskRepo.FindByID(taskID)
	if err != nil {
		return nil, errors.New("task not found")
	}

	task.AdminReviewed = true

	if !approved {
		now := time.Now()
		task.Status = models.TaskStatusCancelled
		task.CancelledAt = &now
		task.CancelReason = "管理员审核未通过"

		publisher, _ := s.userRepo.FindByID(task.PublisherID)
		s.userRepo.UpdateBalance(task.PublisherID, task.Reward+task.Bounty)

		tx := &models.Transaction{
			UserID:       task.PublisherID,
			TaskID:       &task.ID,
			Type:         models.TransactionTypeRefund,
			Amount:       task.Reward + task.Bounty,
			BalanceAfter: publisher.Balance + task.Reward + task.Bounty,
			Description:  "审核未通过退还赏金",
		}
		s.txRepo.Create(tx)
	}

	if err := s.taskRepo.Update(task); err != nil {
		return nil, err
	}

	return task, nil
}

func (s *TaskService) SubmitReview(taskID, reviewerID, revieweeID uint, rating int, comment string) (*models.Review, error) {
	task, err := s.taskRepo.FindByID(taskID)
	if err != nil {
		return nil, errors.New("task not found")
	}

	if task.Status != models.TaskStatusConfirmed {
		return nil, errors.New("can only review confirmed tasks")
	}

	if task.PublisherID != reviewerID && (task.ClaimerID == nil || *task.ClaimerID != reviewerID) {
		return nil, errors.New("only task participants can review")
	}

	if revieweeID != task.PublisherID && (task.ClaimerID == nil || revieweeID != *task.ClaimerID) {
		return nil, errors.New("can only review task participants")
	}

	if reviewerID == revieweeID {
		return nil, errors.New("cannot review yourself")
	}

	if s.reviewRepo != nil {
		exists, err := s.reviewRepo.ExistsByTaskAndReviewer(taskID, reviewerID)
		if err != nil {
			return nil, err
		}
		if exists {
			return nil, errors.New("already reviewed")
		}
	}

	review := &models.Review{
		TaskID:     taskID,
		ReviewerID: reviewerID,
		RevieweeID: revieweeID,
		Rating:     rating,
		Comment:    comment,
	}

	if s.reviewRepo != nil {
		if err := s.reviewRepo.Create(review); err != nil {
			return nil, err
		}
	}

	return review, nil
}
