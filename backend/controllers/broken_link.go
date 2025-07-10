package controllers

import (
	"database/sql"
	"log"
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
		// Get crawl_task_id from URL param
		taskID := c.Param("id")
		log.Printf("Fetching broken links for crawl_task_id = %s", taskID)

		// Query DB
		rows, err := db.Query(`
			SELECT id, crawl_task_id, url, status_code, created_at
			FROM broken_links
			WHERE crawl_task_id = ?
		`, taskID)
		if err != nil {
			log.Printf("DB query failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query broken links"})
			return
		}
		defer rows.Close()

		columns, _ := rows.Columns()
		log.Printf("Columns returned: %v", columns)

		// Read rows
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
				log.Printf("Row scan failed: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse broken link"})
				return
			}

			brokenLinks = append(brokenLinks, bl)
		}

		// Check for errors after iterating
		if err := rows.Err(); err != nil {
			log.Printf("Row iteration error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read broken links"})
			return
		}

		// Return JSON
		c.JSON(http.StatusOK, brokenLinks)
	}
}
