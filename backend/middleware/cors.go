package middleware

import (
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupCORS() gin.HandlerFunc {
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	config := cors.DefaultConfig()
	config.AllowOrigins = []string{frontendURL}
	config.AllowCredentials = true

	return cors.New(config)
}
