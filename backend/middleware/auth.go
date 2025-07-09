package middleware

import (
	"database/sql"
	"net/http"
	"strings"
	"webcrawler/models"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		providedKey := strings.TrimPrefix(authHeader, "Bearer ")

		validKey, err := models.GetLatestAPIKey(db)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate API key"})
			c.Abort()
			return
		}

		if providedKey != validKey {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid API key"})
			c.Abort()
			return
		}

		c.Next()
	}
}
