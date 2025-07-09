package controllers

import (
	"database/sql"
	"log"
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gocolly/colly"
)

type CrawlTask struct {
	ID     int64  `json:"id"`
	URL    string `json:"url"`
	Status string `json:"status"`
}

func CreateCrawlTask(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var task CrawlTask
		if err := c.ShouldBindJSON(&task); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		result, err := db.Exec("INSERT INTO crawl_tasks (url, status) VALUES (?, ?)", task.URL, "pending")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		id, _ := result.LastInsertId()
		task.ID = id
		task.Status = "pending"
		c.JSON(http.StatusOK, task)
	}
}

func GetCrawlTasks(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.Query("SELECT id, url, status FROM crawl_tasks")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var tasks []CrawlTask
		for rows.Next() {
			var t CrawlTask
			if err := rows.Scan(&t.ID, &t.URL, &t.Status); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			tasks = append(tasks, t)
		}

		c.JSON(http.StatusOK, tasks)
	}
}

func UpdateCrawlTaskStatus(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var task CrawlTask
		if err := c.ShouldBindJSON(&task); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		_, err := db.Exec("UPDATE crawl_tasks SET status = ? WHERE id = ?", task.Status, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Updated"})
	}
}

func DeleteCrawlTask(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		_, err := db.Exec("DELETE FROM crawl_tasks WHERE id = ?", id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
	}
}

func CrawlUrl(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		var task CrawlTask
		row := db.QueryRow("SELECT id, url FROM crawl_tasks WHERE id = ?", id)
		if err := row.Scan(&task.ID, &task.URL); err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}

		_, _ = db.Exec("UPDATE crawl_tasks SET status = 'in_progress' WHERE id = ?", task.ID)

		crawler := colly.NewCollector()

		var htmlVersion, pageTitle string
		h1Count, h2Count, h3Count := 0, 0, 0
		internalLinks, externalLinks, brokenLinks := 0, 0, 0
		hasLoginForm := false

		baseURL, _ := url.Parse(task.URL)

		crawler.OnHTML("html", func(e *colly.HTMLElement) {
			htmlVersion = e.Attr("version")
		})

		crawler.OnHTML("title", func(e *colly.HTMLElement) {
			pageTitle = e.Text
		})

		crawler.OnHTML("h1", func(e *colly.HTMLElement) {
			h1Count++
		})
		crawler.OnHTML("h2", func(e *colly.HTMLElement) {
			h2Count++
		})
		crawler.OnHTML("h3", func(e *colly.HTMLElement) {
			h3Count++
		})

		crawler.OnHTML("a[href]", func(e *colly.HTMLElement) {
			link := e.Attr("href")
			u, err := url.Parse(link)
			if err != nil {
				return
			}
			if u.Host == "" || u.Host == baseURL.Host {
				internalLinks++
			} else {
				externalLinks++
			}
		})

		crawler.OnHTML("form", func(e *colly.HTMLElement) {
			if strings.Contains(strings.ToLower(e.Text), "login") {
				hasLoginForm = true
			}
		})

		crawler.OnRequest(func(r *colly.Request) {
			log.Println("Visiting", r.URL.String())
		})

		crawler.OnResponse(func(r *colly.Response) {
			log.Println("Visited:", r.Request.URL.String(), "Status:", r.StatusCode)
		})

		crawler.OnError(func(r *colly.Response, err error) {
			log.Println("Error on", r.Request.URL.String(), "Status:", r.StatusCode)
			if r.StatusCode >= 400 {
				brokenLinks++
			}
		})

		err := crawler.Visit(task.URL)
		if err != nil {
			db.Exec("UPDATE crawl_tasks SET status = 'failed' WHERE id = ?", task.ID)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Store the results
		_, err = db.Exec(`
			UPDATE crawl_tasks SET 
				status = 'success',
				html_version = ?, 
				page_title = ?, 
				h1_count = ?, 
				h2_count = ?, 
				h3_count = ?, 
				internal_links = ?, 
				external_links = ?, 
				broken_links = ?, 
				has_login_form = ?
			WHERE id = ?`,
			htmlVersion, pageTitle, h1Count, h2Count, h3Count,
			internalLinks, externalLinks, brokenLinks, hasLoginForm, task.ID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Crawl complete", "task_id": task.ID})
	}
}
