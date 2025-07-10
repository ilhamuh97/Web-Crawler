package controllers

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gocolly/colly"
)

// --- Struct definition ---
type CrawlTask struct {
	ID            int64   `json:"id"`
	URL           string  `json:"url"`
	Status        string  `json:"status"`
	HTMLVersion   *string `json:"html_version"`
	PageTitle     *string `json:"page_title"`
	H1Count       *int    `json:"h1_count"`
	H2Count       *int    `json:"h2_count"`
	H3Count       *int    `json:"h3_count"`
	InternalLinks *int    `json:"internal_links"`
	ExternalLinks *int    `json:"external_links"`
	BrokenLinks   *int    `json:"broken_links"`
	HasLoginForm  *bool   `json:"has_login_form"`
	CreatedAt     string  `json:"created_at"`
}

var activeCrawlers = struct {
	m  map[int64]context.CancelFunc
	mu sync.Mutex
}{
	m: make(map[int64]context.CancelFunc),
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
		rows, err := db.Query("SELECT * FROM crawl_tasks")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var tasks []CrawlTask
		for rows.Next() {
			var t CrawlTask
			if err := rows.Scan(
				&t.ID, &t.URL, &t.Status, &t.HTMLVersion, &t.PageTitle,
				&t.H1Count, &t.H2Count, &t.H3Count,
				&t.InternalLinks, &t.ExternalLinks, &t.BrokenLinks,
				&t.HasLoginForm, &t.CreatedAt,
			); err != nil {
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
		idStr := c.Param("id")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
			return
		}

		var task CrawlTask
		row := db.QueryRow("SELECT id, url FROM crawl_tasks WHERE id = ?", id)
		if err := row.Scan(&task.ID, &task.URL); err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}

		_, _ = db.Exec("UPDATE crawl_tasks SET status = 'in_progress' WHERE id = ?", task.ID)

		ctx, cancel := context.WithCancel(context.Background())
		activeCrawlers.mu.Lock()
		activeCrawlers.m[task.ID] = cancel
		activeCrawlers.mu.Unlock()

		go func() {
			defer func() {
				activeCrawlers.mu.Lock()
				delete(activeCrawlers.m, task.ID)
				activeCrawlers.mu.Unlock()
				cancel()
			}()

			log.Printf("Starting crawl for ID %d: %s", task.ID, task.URL)

			crawler := colly.NewCollector(
				colly.MaxDepth(1), // stay only on the base page
			)

			var htmlVersion, pageTitle string
			h1Count, h2Count, h3Count := 0, 0, 0
			internalLinks, externalLinks := 0, 0
			hasLoginForm := false
			brokenLinksCount := 0

			visitedLinks := make(map[string]bool)

			baseURL, err := url.Parse(task.URL)
			if err != nil {
				log.Printf("Invalid base URL: %v", err)
				db.Exec("UPDATE crawl_tasks SET status = 'failed' WHERE id = ?", task.ID)
				return
			}

			const rateLimit = 5
			const maxConcurrentChecks = 5

			semaphore := make(chan struct{}, maxConcurrentChecks)
			rateLimiter := time.Tick(time.Second / rateLimit)

			crawler.OnHTML("html", func(e *colly.HTMLElement) {
				htmlVersion = e.Attr("version")
				if htmlVersion == "" {
					htmlVersion = "HTML5 or unknown"
				}
			})

			crawler.OnHTML("title", func(e *colly.HTMLElement) {
				pageTitle = e.Text
			})

			crawler.OnHTML("h1", func(e *colly.HTMLElement) { h1Count++ })
			crawler.OnHTML("h2", func(e *colly.HTMLElement) { h2Count++ })
			crawler.OnHTML("h3", func(e *colly.HTMLElement) { h3Count++ })

			crawler.OnHTML("a[href]", func(e *colly.HTMLElement) {
				link := e.Request.AbsoluteURL(e.Attr("href"))
				if link == "" || visitedLinks[link] {
					return
				}
				visitedLinks[link] = true

				u, err := url.Parse(link)
				if err != nil {
					return
				}

				if u.Host == "" || u.Host == baseURL.Host {
					internalLinks++
				} else {
					externalLinks++
				}

				<-rateLimiter
				semaphore <- struct{}{}

				go func(link string) {
					defer func() { <-semaphore }()

					resp, err := http.Head(link)
					if err != nil {
						log.Printf("HEAD request failed for %s: %v", link, err)
						return
					}
					defer resp.Body.Close()

					if resp.StatusCode >= 400 && resp.StatusCode < 600 && resp.StatusCode != 429 {
						brokenLinksCount++
						fmt.Printf("Broken link: %s (%d)\n", link, resp.StatusCode)
						_, insertErr := db.Exec(
							"INSERT INTO broken_links (crawl_task_id, url, status_code, created_at) VALUES (?, ?, ?, NOW())",
							task.ID, link, resp.StatusCode,
						)
						if insertErr != nil {
							log.Printf("Failed to insert broken link: %v", insertErr)
						}
					}
				}(link)
			})

			crawler.OnHTML("form", func(e *colly.HTMLElement) {
				e.ForEach("input", func(_ int, el *colly.HTMLElement) {
					t := strings.ToLower(el.Attr("type"))
					if t == "password" {
						hasLoginForm = true
					}
				})
			})

			// Check base page itself for broken status
			crawler.OnResponse(func(r *colly.Response) {
				if r.StatusCode >= 400 && r.StatusCode < 600 {
					brokenLinksCount++
					log.Printf("Base page failed: %s (%d)", r.Request.URL.String(), r.StatusCode)
					_, _ = db.Exec(
						"INSERT INTO broken_links (crawl_task_id, url, status_code, created_at) VALUES (?, ?, ?, NOW())",
						task.ID, r.Request.URL.String(), r.StatusCode,
					)
				}
			})

			crawler.OnRequest(func(r *colly.Request) {
				select {
				case <-ctx.Done():
					log.Println("Aborting request:", r.URL.String())
					r.Abort()
				default:
					log.Println("Visiting:", r.URL.String())
				}
			})

			if err := crawler.Visit(task.URL); err != nil {
				log.Printf("Visit failed: %v", err)
				db.Exec("UPDATE crawl_tasks SET status = 'failed' WHERE id = ?", task.ID)
				return
			}

			crawler.Wait()

			select {
			case <-ctx.Done():
				db.Exec("UPDATE crawl_tasks SET status = 'failed' WHERE id = ?", task.ID)
				log.Printf("Crawl cancelled for ID %d", task.ID)
				return
			default:
			}

			// Wait for remaining HEAD checks to finish
			for i := 0; i < maxConcurrentChecks; i++ {
				semaphore <- struct{}{}
			}

			_, _ = db.Exec(`UPDATE crawl_tasks SET 
				status = 'success',
				html_version = ?, page_title = ?,
				h1_count = ?, h2_count = ?, h3_count = ?,
				internal_links = ?, external_links = ?, broken_links = ?, has_login_form = ?
				WHERE id = ?`,
				htmlVersion, pageTitle, h1Count, h2Count, h3Count,
				internalLinks, externalLinks, brokenLinksCount, hasLoginForm, task.ID)

			log.Printf("Crawl finished for ID %d", task.ID)
		}()

		c.JSON(http.StatusOK, gin.H{"message": "Crawl started", "status": "in_progress"})
	}
}

func StopCrawl() gin.HandlerFunc {
	return func(c *gin.Context) {
		idStr := c.Param("id")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
			return
		}

		activeCrawlers.mu.Lock()
		cancel, ok := activeCrawlers.m[id]
		activeCrawlers.mu.Unlock()

		if !ok {
			c.JSON(http.StatusNotFound, gin.H{"error": "No active crawl for that ID"})
			return
		}

		cancel()
		c.JSON(http.StatusOK, gin.H{"message": "Stop requested"})
	}
}
