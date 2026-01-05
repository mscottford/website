import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import https from 'https';
import TurndownService from 'turndown';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..', '..');
const contentDir = path.join(projectRoot, 'content', 'posts');

// Tumblr API types
interface TumblrPost {
  id: string;
  url: string;
  'url-with-slug': string;
  type: 'regular' | 'photo' | 'quote' | 'link' | 'conversation';
  date: string;
  'date-gmt': string;
  'unix-timestamp': number;
  format: 'html' | 'markdown';
  slug: string;
  'regular-title'?: string;
  'regular-body'?: string;
  'photo-caption'?: string;
  'photo-url-1280'?: string;
  'photo-url-500'?: string;
  'quote-text'?: string;
  'quote-source'?: string;
  'link-text'?: string;
  'link-url'?: string;
  'link-description'?: string;
  'conversation-title'?: string;
  'conversation-text'?: string;
  conversation?: Array<{ name: string; label: string; phrase: string }>;
}

interface TumblrResponse {
  tumblelog: {
    title: string;
    name: string;
  };
  'posts-total': number;
  posts: TumblrPost[];
}

interface ImportedPost {
  title: string;
  description: string;
  content: string;
  date: Date;
  slug: string;
  tumblrId: string;
  tumblrSlug: string;
  images: Array<{ url: string; filename: string; alt: string }>;
}

// Fetch with HTTPS
function fetch(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Download binary file
function downloadFile(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : require('http');
    protocol.get(url, (res: any) => {
      // Follow redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadFile(res.headers.location).then(resolve).catch(reject);
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Parse JSONP response
function parseJSONP(jsonp: string): TumblrResponse {
  // Response is: var tumblr_api_read = {...};
  const match = jsonp.match(/var tumblr_api_read = ({[\s\S]*});/);
  if (!match) {
    throw new Error('Failed to parse JSONP response');
  }
  return JSON.parse(match[1]);
}

// Initialize Turndown for HTML to Markdown conversion
function createTurndownService(): TurndownService {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });

  // Remove Tumblr ALT helper spans
  turndown.addRule('tumblrAltHelper', {
    filter: (node) => {
      return (
        node.nodeName === 'SPAN' &&
        (node as Element).classList?.contains('tmblr-alt-text-helper')
      );
    },
    replacement: () => '',
  });

  // Handle Tumblr figure elements
  turndown.addRule('tumblrFigure', {
    filter: (node) => {
      return node.nodeName === 'FIGURE';
    },
    replacement: (content, node) => {
      const img = (node as Element).querySelector('img');
      if (img) {
        const alt = img.getAttribute('alt') || '';
        const src = img.getAttribute('src') || '';
        return `\n![${alt}](${src})\n`;
      }
      return content;
    },
  });

  // Better code block handling
  turndown.addRule('preCode', {
    filter: (node) => {
      return node.nodeName === 'PRE' && node.querySelector('code') !== null;
    },
    replacement: (content, node) => {
      const codeEl = (node as Element).querySelector('code');
      const code = codeEl?.textContent || content;
      // Try to detect language from class
      const langClass = codeEl?.className.match(/language-(\w+)/);
      const lang = langClass ? langClass[1] : '';
      return `\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n`;
    },
  });

  // Handle standalone pre tags
  turndown.addRule('pre', {
    filter: (node) => {
      return node.nodeName === 'PRE' && node.querySelector('code') === null;
    },
    replacement: (content, node) => {
      const text = (node as Element).textContent || content;
      return `\n\`\`\`\n${text.trim()}\n\`\`\`\n`;
    },
  });

  return turndown;
}

// Decode HTML entities
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&rsquo;': "'",
    '&lsquo;': "'",
    '&rdquo;': '"',
    '&ldquo;': '"',
    '&ndash;': '–',
    '&mdash;': '—',
    '&hellip;': '…',
    '&nbsp;': ' ',
  };
  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'g'), char);
  }
  // Handle numeric entities
  result = result.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  return result;
}

// Extract H1 heading from HTML content
function extractH1Title(html: string): string | null {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (match) {
    // Strip HTML tags and decode entities
    return decodeHtmlEntities(match[1].replace(/<[^>]+>/g, '').trim());
  }
  return null;
}

// Extract first paragraph for description
function extractDescription(html: string): string {
  const match = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (match) {
    // Strip HTML tags from the paragraph and decode entities
    const text = decodeHtmlEntities(match[1].replace(/<[^>]+>/g, '').trim());
    // Limit to 160 characters
    if (text.length > 160) {
      return text.substring(0, 157) + '...';
    }
    return text;
  }
  return '';
}

// Extract best image URL from srcset or src
function getBestImageUrl(imgTag: string): string {
  // Try to get highest resolution from srcset
  const srcsetMatch = imgTag.match(/srcset=["']([^"']+)["']/i);
  if (srcsetMatch) {
    const srcset = srcsetMatch[1];
    // Parse srcset entries like "url1 640w, url2 1280w"
    const entries = srcset.split(',').map((entry) => {
      const parts = entry.trim().split(/\s+/);
      const url = parts[0];
      const width = parts[1] ? parseInt(parts[1].replace('w', ''), 10) : 0;
      return { url, width };
    });
    // Sort by width descending and get the largest
    entries.sort((a, b) => b.width - a.width);
    if (entries.length > 0) {
      return entries[0].url;
    }
  }
  // Fall back to src attribute
  const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
  return srcMatch ? srcMatch[1] : '';
}

// Extract alt text from img tag
function getAltText(imgTag: string): string {
  const match = imgTag.match(/alt=["']([^"']*)["']/i);
  return match ? decodeHtmlEntities(match[1]) : '';
}

// Extract images from HTML and return updated HTML with local paths
function extractImages(
  html: string,
  postDate: Date,
  slug: string
): { html: string; images: Array<{ url: string; filename: string; alt: string }> } {
  const images: Array<{ url: string; filename: string; alt: string }> = [];
  let imageIndex = 0;

  // First handle figure elements
  let updatedHtml = html.replace(
    /<figure[^>]*>[\s\S]*?<img([^>]+)>[\s\S]*?<\/figure>/gi,
    (match, imgAttrs) => {
      const src = getBestImageUrl(imgAttrs);
      if (!src) return match;

      const alt = getAltText(imgAttrs);

      // Get file extension from URL
      try {
        const urlPath = new URL(src).pathname;
        const ext = path.extname(urlPath) || '.jpg';
        // Prefix with slug to avoid collisions between posts on same date
        const filename = `${slug}-image-${++imageIndex}${ext}`;

        images.push({ url: src, filename, alt });

        // Return img tag with relative path and preserved alt
        return `<img src="./${filename}" alt="${alt.replace(/"/g, '&quot;')}" />`;
      } catch {
        return match;
      }
    }
  );

  // Then handle standalone img tags
  updatedHtml = updatedHtml.replace(
    /<img([^>]+)>/gi,
    (match, attrs) => {
      // Skip if already processed (has relative src)
      if (match.includes('src="./')) return match;

      const src = getBestImageUrl(attrs);
      if (!src) return match;

      const alt = getAltText(attrs);

      // Get file extension from URL
      try {
        const urlPath = new URL(src).pathname;
        const ext = path.extname(urlPath) || '.jpg';
        // Prefix with slug to avoid collisions between posts on same date
        const filename = `${slug}-image-${++imageIndex}${ext}`;

        images.push({ url: src, filename, alt });

        // Return img tag with relative path and preserved alt
        return `<img src="./${filename}" alt="${alt.replace(/"/g, '&quot;')}" />`;
      } catch {
        return match;
      }
    }
  );

  // Remove Tumblr ALT helper spans
  updatedHtml = updatedHtml.replace(/<span[^>]*class="[^"]*tmblr-alt-text-helper[^"]*"[^>]*>ALT<\/span>/gi, '');

  return { html: updatedHtml, images };
}

// Convert a Tumblr post to an ImportedPost
function convertPost(post: TumblrPost, turndown: TurndownService): ImportedPost | null {
  const date = new Date(post['unix-timestamp'] * 1000);
  const tumblrSlug = post.slug || '';

  let title = '';
  let htmlContent = '';
  let description = '';

  switch (post.type) {
    case 'regular':
      title = decodeHtmlEntities(post['regular-title'] || '');
      htmlContent = post['regular-body'] || '';
      // Try to extract H1 from content if no title
      if (!title && htmlContent) {
        title = extractH1Title(htmlContent) || '';
      }
      break;

    case 'quote':
      title = 'Quote';
      const quoteText = post['quote-text'] || '';
      const quoteSource = post['quote-source'] || '';
      htmlContent = `<blockquote>${quoteText}</blockquote>\n${quoteSource ? `<p>— ${quoteSource}</p>` : ''}`;
      // Use quote text as description (decoded)
      description = decodeHtmlEntities(quoteText.replace(/<[^>]+>/g, '').trim()).substring(0, 157);
      break;

    case 'photo':
      title = 'Photo';
      const photoUrl = post['photo-url-1280'] || post['photo-url-500'] || '';
      const caption = post['photo-caption'] || '';
      htmlContent = `<img src="${photoUrl}" alt="" />\n${caption}`;
      description = decodeHtmlEntities(caption.replace(/<[^>]+>/g, '').trim()).substring(0, 157);
      break;

    case 'link':
      title = decodeHtmlEntities(post['link-text'] || 'Link');
      const linkUrl = post['link-url'] || '';
      const linkDesc = post['link-description'] || '';
      htmlContent = `<p><a href="${linkUrl}">${title}</a></p>\n${linkDesc}`;
      description = decodeHtmlEntities(linkDesc.replace(/<[^>]+>/g, '').trim()).substring(0, 157) || `Link to ${linkUrl}`;
      break;

    case 'conversation':
      title = decodeHtmlEntities(post['conversation-title'] || '') || 'Conversation';
      if (post.conversation && post.conversation.length > 0) {
        htmlContent = post.conversation
          .map((line) => `<p><strong>${line.label}</strong> ${line.phrase}</p>`)
          .join('\n');
      } else {
        htmlContent = `<pre>${post['conversation-text'] || ''}</pre>`;
      }
      break;

    default:
      console.log(`Skipping unknown post type: ${post.type}`);
      return null;
  }

  // If no title, generate one from date
  if (!title) {
    title = `Post from ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  }

  // Generate slug from title if tumblr slug is empty
  const slug = tumblrSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Extract images and update HTML
  const { html: processedHtml, images } = extractImages(htmlContent, date, slug);

  // Convert HTML to Markdown
  const markdown = turndown.turndown(processedHtml);

  // Generate description if not already set
  if (!description) {
    description = extractDescription(htmlContent) || `${title} - A blog post from ${date.getFullYear()}`;
  }

  return {
    title,
    description,
    content: markdown,
    date,
    slug,
    tumblrId: post.id,
    tumblrSlug,
    images,
  };
}

// Generate MDX frontmatter and content
function generateMDX(post: ImportedPost): string {
  // Escape quotes in title and description
  const safeTitle = post.title.replace(/"/g, '\\"');
  const safeDescription = post.description.replace(/"/g, '\\"');

  return `---
title: "${safeTitle}"
description: "${safeDescription}"
dateTime: "${post.date.toISOString()}"
tumblrId: "${post.tumblrId}"
tumblrSlug: "${post.tumblrSlug}"
---

${post.content}
`;
}

// Format date for directory name
function formatDateDir(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Main import function
async function importPosts() {
  console.log('Fetching posts from Tumblr API...');

  const response = await fetch('https://mscottford.com/api/read/json?num=50');
  const data = parseJSONP(response);

  console.log(`Found ${data['posts-total']} posts`);

  const turndown = createTurndownService();
  const posts: ImportedPost[] = [];

  for (const post of data.posts) {
    const converted = convertPost(post, turndown);
    if (converted) {
      posts.push(converted);
    }
  }

  // Sort by date (oldest first)
  posts.sort((a, b) => a.date.getTime() - b.date.getTime());

  console.log(`\nConverted ${posts.length} posts\n`);

  for (const post of posts) {
    const dateDir = formatDateDir(post.date);
    const postDir = path.join(contentDir, dateDir);
    const mdxPath = path.join(postDir, `${post.slug}.mdx`);

    // Create directory
    await fs.mkdir(postDir, { recursive: true });

    // Download images
    for (const img of post.images) {
      const imgPath = path.join(postDir, img.filename);
      try {
        console.log(`  Downloading: ${img.url}`);
        const buffer = await downloadFile(img.url);
        await fs.writeFile(imgPath, buffer);
      } catch (err) {
        console.error(`  Failed to download ${img.url}:`, err);
      }
    }

    // Write MDX file
    const mdxContent = generateMDX(post);
    await fs.writeFile(mdxPath, mdxContent);
    console.log(`Created: ${path.relative(projectRoot, mdxPath)}`);
  }

  console.log(`\n✓ Created ${posts.length} MDX files`);
}

// Run
importPosts().catch(console.error);
