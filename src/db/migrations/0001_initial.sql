-- Migration: 0001_initial
-- Creates the core schema for Flare on Cloudflare D1

CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'bookmark',
    title TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('app', 'bookmark')),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '',
    desc TEXT NOT NULL DEFAULT '',
    private INTEGER NOT NULL DEFAULT 0,
    category_id TEXT DEFAULT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_links_type ON links(type);
CREATE INDEX IF NOT EXISTS idx_links_category ON links(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_links_sort ON links(type, sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(type, sort_order);

-- Default application settings
INSERT INTO settings (data_json) VALUES (
    '{"Title":"flare","Footer":"由 <a href=\"https://github.com/lurenyang418/flare\">Flare</a> ❤️ 强力驱动","OpenAppNewTab":true,"OpenBookmarkNewTab":true,"ShowTitle":true,"Greetings":"你好","ShowSearchComponent":true,"DisabledSearchAutoFocus":false,"ShowDateTime":true,"ShowApps":true,"ShowBookmarks":true,"HideSettingsButton":false,"HideHelpButton":false,"EnableEncryptedLink":false,"IconMode":"DEFAULT","Theme":"blackboard","KeepLetterCase":false}'
);

-- Default categories for bookmarks
INSERT INTO categories (id, type, title, sort_order) VALUES
    ('1', 'bookmark', '链接分类1', 0),
    ('2', 'bookmark', '链接分类2', 1),
    ('3', 'bookmark', '链接分类3', 2),
    ('4', 'bookmark', '链接分类4', 3);

-- Default sample bookmarks
INSERT INTO links (type, name, url, icon, desc, private, category_id, sort_order) VALUES
    ('bookmark', '示例链接', 'https://link.example.com', 'checkDecagram', '', 0, '1', 0),
    ('bookmark', '示例链接', 'https://link.example.com', 'eraser', '', 0, '1', 1),
    ('bookmark', '示例链接', 'https://link.example.com', 'mastodon', '', 0, '1', 2),
    ('bookmark', '示例链接', 'https://link.example.com', 'alphaACircleOutline', '', 0, '1', 3),
    ('bookmark', '示例链接', 'https://link.example.com', 'flask', '', 0, '1', 4),
    ('bookmark', '示例链接', 'https://link.example.com', 'sofaOutline', '', 0, '2', 0),
    ('bookmark', '示例链接', 'https://link.example.com', 'BowArrow', '', 0, '2', 1),
    ('bookmark', '示例链接', 'https://link.example.com', 'messageCog', '', 0, '2', 2),
    ('bookmark', '示例链接', 'https://link.example.com', 'alphaRCircleOutline', '', 0, '2', 3),
    ('bookmark', '示例链接', 'https://link.example.com', 'cityVariantOutline', '', 0, '2', 4),
    ('bookmark', '示例链接', 'https://link.example.com', 'foodCroissant', '', 0, '3', 0),
    ('bookmark', '示例链接', 'https://link.example.com', 'KeyboardOutline', '', 0, '3', 1),
    ('bookmark', '示例链接', 'https://link.example.com', 'alphaFCircleOutline', '', 0, '3', 2),
    ('bookmark', '示例链接', 'https://link.example.com', 'alphaECircleOutline', '', 0, '3', 3),
    ('bookmark', '示例链接', 'https://link.example.com', 'alphaYCircleOutline', '', 0, '3', 4),
    ('bookmark', '示例链接', 'https://link.example.com', 'musicCircleOutline', '', 0, '4', 0),
    ('bookmark', '示例链接', 'https://link.example.com', 'Incognito', '', 0, '4', 1),
    ('bookmark', '示例链接', 'https://link.example.com', 'alphaLCircleOutline', '', 0, '4', 2),
    ('bookmark', '示例链接', 'https://link.example.com', 'accountSupervisorCircle', '', 0, '4', 3),
    ('bookmark', '示例链接', 'https://link.example.com', 'sproutOutline', '', 0, '4', 4);

-- Default sample apps (apps have no category, so category_id is NULL)
INSERT INTO links (type, name, url, icon, desc, private, category_id, sort_order) VALUES
    ('app', '示例链接', 'https://link.example.com', 'evernote', '链接描述文本', 0, NULL, 0),
    ('app', '示例链接', 'https://link.example.com', 'FireHydrant', '链接描述文本', 0, NULL, 1),
    ('app', '示例链接', 'https://link.example.com', 'email', '链接描述文本', 0, NULL, 2),
    ('app', '示例链接', 'https://link.example.com', 'MicrosoftOnenote', '链接描述文本', 0, NULL, 3),
    ('app', '示例链接', 'https://link.example.com', 'Robber', '', 0, NULL, 4),
    ('app', '示例链接', 'https://link.example.com', 'EvPlugType1', '', 0, NULL, 5),
    ('app', '示例链接', 'https://link.example.com', 'FileImage', '', 0, NULL, 6),
    ('app', '示例链接', 'https://link.example.com', 'WeatherHazy', '', 0, NULL, 7);

-- Metadata
INSERT INTO metadata (key, value) VALUES ('version', '1.0.0');
INSERT INTO metadata (key, value) VALUES ('migration_status', 'ready');
