package controllers

import (
	"database/sql"
	"net/http"
	"webcrawler/models"

	"github.com/gin-gonic/gin"
)

type APIKeyController struct {
	DB *sql.DB
}

func (ctrl *APIKeyController) GetAPIKey(c *gin.Context) {
	key, err := models.GetLatestAPIKey(ctrl.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get API key"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"api_key": key})
}

func (ctrl *APIKeyController) GenerateNewAPIKey(c *gin.Context) {
	key, err := models.CreateNewAPIKey(ctrl.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create new API key"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"api_key": key})
}
