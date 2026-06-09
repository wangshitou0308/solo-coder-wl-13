package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/neighbortask/server/config"
	"github.com/neighbortask/server/controllers"
	"github.com/neighbortask/server/models"
	"github.com/neighbortask/server/repositories"
	"github.com/neighbortask/server/routes"
	"github.com/neighbortask/server/services"
	"github.com/neighbortask/server/websocket"
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()

	db, err := gorm.Open(postgres.Open(cfg.Database.DSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("failed to get database instance: %v", err)
	}
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)

	err = db.AutoMigrate(
		&models.User{},
		&models.Community{},
		&models.CommunityMember{},
		&models.Task{},
		&models.Review{},
		&models.Conversation{},
		&models.Message{},
		&models.Transaction{},
		&models.PlatformConfig{},
		&models.Complaint{},
	)
	if err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.Redis.Addr(),
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	})
	_ = rdb

	userRepo := repositories.NewUserRepo(db)
	taskRepo := repositories.NewTaskRepo(db)
	communityRepo := repositories.NewCommunityRepo(db)
	messageRepo := repositories.NewMessageRepo(db)
	reviewRepo := repositories.NewReviewRepo(db)
	transactionRepo := repositories.NewTransactionRepo(db)

	authService := services.NewAuthService(userRepo, cfg)
	taskService := services.NewTaskService(db, taskRepo, userRepo, transactionRepo, reviewRepo)
	communityService := services.NewCommunityService(communityRepo, userRepo)
	messageService := services.NewMessageService(messageRepo)
	paymentService := services.NewPaymentService(userRepo, transactionRepo)
	adminService := services.NewAdminService(taskRepo, communityRepo, userRepo, db)

	authController := controllers.NewAuthController(authService)
	taskController := controllers.NewTaskController(taskService)
	communityController := controllers.NewCommunityController(communityService)
	messageController := controllers.NewMessageController(messageService)
	userController := controllers.NewUserController(userRepo, paymentService, reviewRepo)
	leaderboardController := controllers.NewLeaderboardController(taskRepo)
	adminController := controllers.NewAdminController(adminService)

	hub := websocket.NewHub()
	go hub.Run()

	if cfg.Server.Mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := routes.SetupRouter(
		cfg,
		hub,
		authController,
		taskController,
		communityController,
		messageController,
		userController,
		leaderboardController,
		adminController,
	)

	addr := fmt.Sprintf(":%s", cfg.Server.Port)
	log.Printf("Server starting on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
