CREATE TABLE crawl_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  url VARCHAR(2048) NOT NULL,
  status ENUM('pending', 'in_progress', 'success', 'failed') DEFAULT 'pending',
  html_version VARCHAR(50),
  page_title VARCHAR(512),
  h1_count INT,
  h2_count INT,
  h3_count INT,
  internal_links INT,
  external_links INT,
  broken_links INT,
  has_login_form BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_value VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE broken_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  crawl_task_id INT NOT NULL,
  url VARCHAR(2048) NOT NULL,
  status_code INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (crawl_task_id) REFERENCES crawl_tasks(id) ON DELETE CASCADE,
  UNIQUE KEY unique_task_url (crawl_task_id, url(255))
);

