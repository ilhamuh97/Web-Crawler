package controllers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

type BrokenLink struct {
	ID          int64  `json:"id"`
	CrawlTaskID int64  `json:"crawl_task_id"`
	URL         string `json:"url"`
	StatusCode  int    `json:"status_code"`
	CreatedAt   string `json:"created_at"`
}

func GetBrokenLinks(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		taskID := c.Param("id")

		rows, err := db.Query(`
			SELECT id, crawl_task_id, url, status_code, created_at
			FROM broken_links
			WHERE crawl_task_id = ?
		`, taskID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query broken links"})
			return
		}
		defer rows.Close()

		var brokenLinks []BrokenLink
		for rows.Next() {
			var bl BrokenLink

			if err := rows.Scan(
				&bl.ID,
				&bl.CrawlTaskID,
				&bl.URL,
				&bl.StatusCode,
				&bl.CreatedAt,
			); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse broken link"})
				return
			}

			brokenLinks = append(brokenLinks, bl)
		}

		if err := rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read broken links"})
			return
		}

		c.JSON(http.StatusOK, brokenLinks)
	}
}
