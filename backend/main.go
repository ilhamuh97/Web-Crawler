package main

import (
	"webcrawler/controllers"
	"webcrawler/database"
	"webcrawler/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	router.Use(middleware.SetupCORS())

	database.ConnectDB()

	router.GET("api/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	router.POST("/api/crawl", controllers.CrawlURL)

	router.Run(":8080")
}
