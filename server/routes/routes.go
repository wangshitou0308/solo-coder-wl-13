package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/neighbortask/server/config"
	"github.com/neighbortask/server/controllers"
	"github.com/neighbortask/server/middleware"
	"github.com/neighbortask/server/websocket"
)

func SetupRouter(
	cfg *config.Config,
	hub *websocket.Hub,
	authCtrl *controllers.AuthController,
	taskCtrl *controllers.TaskController,
	communityCtrl *controllers.CommunityController,
	messageCtrl *controllers.MessageController,
	userCtrl *controllers.UserController,
	leaderboardCtrl *controllers.LeaderboardController,
	adminCtrl *controllers.AdminController,
) *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORSMiddleware(cfg))

	api := r.Group("/api/v1")

	auth := api.Group("/auth")
	{
		auth.POST("/register", authCtrl.Register)
		auth.POST("/login", authCtrl.Login)
		auth.POST("/refresh", authCtrl.Refresh)
		auth.GET("/me", middleware.AuthMiddleware(cfg), authCtrl.Me)
	}

	communities := api.Group("/communities")
	{
		communities.GET("", communityCtrl.List)
		communities.GET("/:id", communityCtrl.GetByID)
		communities.GET("/:id/members", communityCtrl.GetMembers)

		authCommunities := communities.Group("")
		authCommunities.Use(middleware.AuthMiddleware(cfg))
		{
			authCommunities.POST("/join/code", communityCtrl.JoinByCode)
			authCommunities.POST("/join/location", communityCtrl.JoinByLocation)
			authCommunities.POST("/join", communityCtrl.Join)
			authCommunities.POST("/join-by-location", communityCtrl.JoinByLocationNew)
		}
	}

	tasks := api.Group("/tasks")
	{
		tasks.GET("", taskCtrl.List)
		tasks.GET("/:id", taskCtrl.GetByID)

		authTasks := tasks.Group("")
		authTasks.Use(middleware.AuthMiddleware(cfg))
		{
			authTasks.POST("", taskCtrl.Create)
			authTasks.PUT("/:id", taskCtrl.Update)
			authTasks.POST("/:id/claim", taskCtrl.Claim)
			authTasks.POST("/:id/complete", taskCtrl.Complete)
			authTasks.POST("/:id/confirm", taskCtrl.Confirm)
			authTasks.POST("/:id/cancel", taskCtrl.Cancel)
			authTasks.POST("/:id/review", taskCtrl.SubmitReview)
		}
	}

	messages := api.Group("/messages")
	messages.Use(middleware.AuthMiddleware(cfg))
	{
		messages.GET("/conversations", messageCtrl.ListConversations)
		messages.GET("/conversations/:id", messageCtrl.ListMessages)
		messages.GET("/conversations/:id/messages", messageCtrl.ListMessagesAlias)
		messages.POST("/send", messageCtrl.Send)
		messages.GET("/unread", messageCtrl.UnreadCount)
	}

	users := api.Group("/users")
	{
		users.GET("/:id", userCtrl.GetPublicInfo)
		users.GET("/:id/stats", userCtrl.GetStats)
		users.GET("/:id/reviews", userCtrl.GetUserReviews)

		authUsers := users.Group("")
		authUsers.Use(middleware.AuthMiddleware(cfg))
		{
			authUsers.GET("/me/transactions", userCtrl.GetTransactions)
			authUsers.POST("/me/withdraw", userCtrl.Withdraw)
			authUsers.POST("/me/credit", userCtrl.AddCredit)
		}
	}

	leaderboard := api.Group("/leaderboard")
	{
		leaderboard.GET("/tasks", leaderboardCtrl.TasksRanking)
		leaderboard.GET("/rating", leaderboardCtrl.RatingRanking)
	}

	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware(cfg))
	admin.Use(middleware.RoleMiddleware("community_admin", "platform_admin"))
	{
		admin.GET("/tasks/pending", adminCtrl.GetPendingTasks)
		admin.POST("/tasks/:id/review", adminCtrl.ReviewTask)
		admin.GET("/complaints", adminCtrl.GetComplaints)
		admin.POST("/complaints/:id/handle", adminCtrl.HandleComplaint)
		admin.GET("/config", adminCtrl.GetConfig)
		admin.PUT("/config", adminCtrl.UpdateConfig)
	}

	ws := api.Group("/ws")
	ws.Use(middleware.AuthMiddleware(cfg))
	{
		ws.GET("", func(c *gin.Context) {
			userID := c.GetUint("user_id")
			websocket.ServeWS(hub, c, userID)
		})
	}

	return r
}
