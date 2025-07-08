package database

import (
	"database/sql"
	"fmt"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

var DB *sql.DB

func ConnectDB() {
	user := os.Getenv("DB_USER")
	pass := os.Getenv("DB_PASS")
	name := os.Getenv("DB_NAME")
	host := os.Getenv("DB_HOST")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:3306)/%s", user, pass, host, name)

	var db *sql.DB
	var err error

	for {
		db, err = sql.Open("mysql", dsn)
		if err != nil {
			fmt.Println("MySQL not ready, retrying in 2 seconds...")
			time.Sleep(2 * time.Second)
			continue
		}

		err = db.Ping()
		if err == nil {
			break
		}

		fmt.Println("MySQL not ready, retrying in 2 seconds...")
		time.Sleep(2 * time.Second)
	}

	DB = db
	fmt.Println("Connected to MySQL!")
}
