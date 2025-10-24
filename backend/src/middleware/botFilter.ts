import { Request, Response, NextFunction } from 'express';

// Common bot/scanner request patterns to filter out
const BOT_PATTERNS = [
  /\.js$/i,
  /\.xml$/i,
  /\.cgi$/i,
  /\.php$/i,
  /\.asp$/i,
  /\.jsp$/i,
  /\.txt$/i,
  /\.log$/i,
  /\.conf$/i,
  /\.ini$/i,
  /\.env$/i,
  /\.git$/i,
  /\.svn$/i,
  /\.htaccess$/i,
  /\.htpasswd$/i,
  /\.sql$/i,
  /\.bak$/i,
  /\.old$/i,
  /\.tmp$/i,
  /\.temp$/i,
  /wp-admin/i,
  /wp-login/i,
  /phpmyadmin/i,
  /mysql/i,
  /database/i,
  /config/i,
  /backup/i,
  /debug/i,
  /loginMsg/i,
  /rootDesc/i,
  /get\.cgi/i,
  /robots\.txt/i,
  /sitemap\.xml/i,
  /favicon\.ico/i,
  /\.well-known/i
];

// User agents that are likely bots
const BOT_USER_AGENTS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /scanner/i,
  /curl/i,
  /wget/i,
  /python/i,
  /java/i,
  /go-http-client/i,
  /http\.rb/i,
  /okhttp/i,
  /postman/i,
  /insomnia/i
];

export const botFilter = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.get('User-Agent') || '';
  const path = req.path.toLowerCase();
  
  // Check if it's a bot request
  const isBotUserAgent = BOT_USER_AGENTS.some(pattern => pattern.test(userAgent));
  const isBotPath = BOT_PATTERNS.some(pattern => pattern.test(path));
  
  if (isBotUserAgent || isBotPath) {
    // Silently return 404 for bot requests without logging
    res.status(404).json({
      success: false,
      message: 'Not Found',
      statusCode: 404
    });
    return;
  }
  
  next();
};
