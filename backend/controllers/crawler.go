package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gocolly/colly"
)

func CrawlURL(c *gin.Context) {
	type Request struct {
		URL string `json:"url"`
	}
	var req Request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	url := req.URL

	collector := colly.NewCollector()

	var pageTitle string
	collector.OnHTML("title", func(e *colly.HTMLElement) {
		pageTitle = e.Text
	})

	collector.Visit(url)

	c.JSON(http.StatusOK, gin.H{
		"title": pageTitle,
	})
}
