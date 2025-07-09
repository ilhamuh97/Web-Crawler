package models

import (
	"database/sql"
	"math/rand"
	"time"
)

type APIKey struct {
	ID        int
	KeyValue  string
	CreatedAt time.Time
}

func generateRandomKey() string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, 32)

	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	for i := range b {
		b[i] = charset[r.Intn(len(charset))]
	}

	return string(b)
}

func CreateNewAPIKey(db *sql.DB) (string, error) {
	newKey := generateRandomKey()

	_, err := db.Exec("DELETE FROM api_keys")
	if err != nil {
		return "", err
	}

	_, err = db.Exec("INSERT INTO api_keys (key_value) VALUES (?)", newKey)
	if err != nil {
		return "", err
	}

	return newKey, nil
}

func GetLatestAPIKey(db *sql.DB) (string, error) {
	var key string
	err := db.QueryRow("SELECT key_value FROM api_keys ORDER BY created_at DESC LIMIT 1").Scan(&key)
	if err == sql.ErrNoRows {
		return CreateNewAPIKey(db)
	}
	if err != nil {
		return "", err
	}
	return key, nil
}
