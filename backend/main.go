package main

import (
	"database/sql"
	"log"
	"os"
	"webcrawler/controllers"
	"webcrawler/database"
	"webcrawler/middleware"

	"github.com/gin-gonic/gin"
)

func setupRouter(db *sql.DB) *gin.Engine {
	router := gin.Default()
	router.Use(middleware.SetupCORS())

	apiKeyController := controllers.APIKeyController{DB: db}

	router.GET("/api/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	router.GET("/api/api-key", apiKeyController.GetAPIKey)
	router.POST("/api/api-key", apiKeyController.GenerateNewAPIKey)

	protected := router.Group("/api")
	protected.Use(middleware.AuthMiddleware(db))
	{
		protected.POST("/crawl-tasks/:id/crawl", controllers.CrawlUrl(db))

		protected.GET("/crawl_tasks/:id/broken_links", controllers.GetBrokenLinks(db))

		protected.POST("/crawl-tasks", controllers.CreateCrawlTask(db))
		protected.DELETE("/crawl-tasks/:id", controllers.DeleteCrawlTask(db))
		protected.PATCH("/crawl-tasks/:id", controllers.UpdateCrawlTaskStatus(db))
		protected.GET("/crawl-tasks", controllers.GetCrawlTasks(db))
		protected.POST("/crawl/:id/stop", controllers.StopCrawl())
	}

	return router
}

func main() {
	db, err := database.ConnectDB()
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	router := setupRouter(db)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	router.Run(":" + port)
}
