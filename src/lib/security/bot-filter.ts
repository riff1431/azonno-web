/**
 * Intelligent Bot & Malicious Threat Probe Filter
 * 
 * Objectives:
 * 1. Whitelist all verified official search engine, AI/LLM, and social media crawlers.
 * 2. Immediately block automated vulnerability scanners, exploit payloads, and malicious path probes with HTTP 403.
 * 3. Never disrupt legitimate customer shopping, APIs, or payment callbacks.
 */

// 1. Whitelist of Official Search Engines, AI LLM Crawlers, and Social Media Previews
export const OFFICIAL_CRAWLERS = [
  // Google
  "googlebot",
  "google-extended",
  "google-inspectiontool",
  "adsbot-google",
  "mediapartners-google",
  
  // Microsoft / Bing
  "bingbot",
  "bingpreview",
  "msnbot",

  // OpenAI / ChatGPT
  "gptbot",
  "chatgpt-user",
  "oai-searchbot",

  // Anthropic / Claude
  "claudebot",
  "anthropic-ai",
  "claude-web",

  // Meta / Facebook / Instagram
  "facebookexternalhit",
  "facebot",
  "meta-externalagent",

  // TikTok / ByteDance
  "tiktokbot",
  "bytedancespider",

  // Other Major Search Engines
  "duckduckbot",
  "baiduspider",
  "yandexbot",
  "slurp", // Yahoo
  "sogou",
  "applebot",

  // Social & Messaging Previews
  "twitterbot",
  "pinterestbot",
  "linkedinbot",
  "whatsapp",
  "telegrambot",
  "discordbot",
  "slackbot",
  "skypeuripreview",
  "vkshare",

  // Reputable AI & Research
  "perplexitybot",
  "cohere-ai",
  "youbot",
];

// 2. Blacklist of Automated Vulnerability Scanners & Exploit Tools
export const MALICIOUS_SCANNERS = [
  "sqlmap",
  "nikto",
  "dirbuster",
  "gobuster",
  "masscan",
  "wpscan",
  "acunetix",
  "havij",
  "zgrab",
  "censys",
  "shodan",
  "nmap",
  "hydra",
  "metasploit",
  "netsparker",
  "burpcollaborator",
  "arachni",
  "openvas",
  "nessus",
  "qualys",
  "whatweb",
  "morfeus",
  "scanner",
];

// 3. Blacklist of Attack Paths (PHP/WordPress/Config Probes & LFI/Traversals)
export const MALICIOUS_PATH_PATTERNS = [
  // Configuration & Environment Leaks
  /\/\.env/i,
  /\/\.git/i,
  /\/\.svn/i,
  /\/\.hg/i,
  /\/\.aws/i,
  /\/\.ssh/i,
  /\/web\.config/i,
  /\/server-status/i,

  // PHP & Legacy CMS Exploit Probing
  /\/wp-admin/i,
  /\/wp-login\.php/i,
  /\/wp-content/i,
  /\/wp-includes/i,
  /\/xmlrpc\.php/i,
  /\/phpinfo\.php/i,
  /\/eval-stdin\.php/i,
  /\/phpmyadmin/i,
  /\/pma/i,
  /\/adminer\.php/i,
  /\/cgi-bin\//i,

  // Path Traversal / LFI
  /\.\.\//,
  /\.\.\\/,
  /%2e%2e%2f/i,
  /%2e%2e\//i,
  /\.\.%2f/i,
  /\.\.%5c/i,
  /%252e%252e%252f/i,
];

/**
 * Checks if a given User-Agent is an authorized official search engine or AI crawler.
 */
export function isOfficialCrawler(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return OFFICIAL_CRAWLERS.some((crawler) => ua.includes(crawler));
}

/**
 * Evaluates whether an incoming HTTP request is a malicious scanner or probe attack.
 */
export function evaluateThreatRequest(
  pathname: string,
  userAgent: string | null | undefined
): { isThreat: boolean; reason?: string } {
  const ua = (userAgent || "").toLowerCase();

  // If it's a verified official crawler, do NOT block
  if (isOfficialCrawler(ua)) {
    return { isThreat: false };
  }

  // 1. Check for known malicious scanner tools
  const matchedScanner = MALICIOUS_SCANNERS.find((scanner) => ua.includes(scanner));
  if (matchedScanner) {
    return { isThreat: true, reason: `Malicious scanner tool detected: ${matchedScanner}` };
  }

  // 2. Check for suspicious probing attack paths
  const decodedPath = decodeURIComponentSafe(pathname);
  for (const pattern of MALICIOUS_PATH_PATTERNS) {
    if (pattern.test(pathname) || pattern.test(decodedPath)) {
      return { isThreat: true, reason: `Unauthorized attack probe path: ${pathname}` };
    }
  }

  return { isThreat: false };
}

function decodeURIComponentSafe(uri: string): string {
  try {
    return decodeURIComponent(uri);
  } catch {
    return uri;
  }
}
