import { favicons, type FaviconImage, type FaviconOptions } from "favicons";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { assert } from "console";

// emulate __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configuration: FaviconOptions = {
  path: "/", // Path for overriding default icons path. `string`
  background: "#fff", // Background colour for flattened icons. `string`
  appleStatusBarStyle: "black-translucent", // Style for Apple status bar: "black-translucent", "default", "black". `string`
  display: "standalone", // Preferred display mode: "fullscreen", "standalone", "minimal-ui" or "browser". `string`
  orientation: "any", // Default orientation: "any", "natural", "portrait" or "landscape". `string`
  scope: "/", // set of URLs that the browser considers within your app
  pixel_art: false, // Keeps pixels "sharp" when scaling up, for pixel art.  Only supported in offline mode.
  icons: {
    // Platform Options:
    // - offset - offset in percentage
    // - background:
    //   * false - use default
    //   * true - force use default, e.g. set background for Android icons
    //   * color - set background for the specified icons
    //
    appleStartup: false, // Create Apple startup images. `boolean` or `{ offset, background }` or an array of sources
    windows: false, // Create Windows 8 tile icons. `boolean` or `{ offset, background }` or an array of sources
    yandex: false, // Create Yandex browser icon. `boolean` or `{ offset, background }` or an array of sources
    android: [
      "android-chrome-144x144.png",
      "android-chrome-192x192.png",
      "android-chrome-256x256.png",
      "android-chrome-36x36.png",
      "android-chrome-384x384.png",
      "android-chrome-48x48.png",
      "android-chrome-512x512.png",
      "android-chrome-72x72.png",
      "android-chrome-96x96.png"
    ],
    appleIcon: [
      "apple-touch-icon-1024x1024.png",
      "apple-touch-icon-114x114.png",
      "apple-touch-icon-120x120.png",
      "apple-touch-icon-144x144.png",
      "apple-touch-icon-152x152.png",
      "apple-touch-icon-167x167.png",
      "apple-touch-icon-180x180.png",
      "apple-touch-icon-57x57.png",
      "apple-touch-icon-60x60.png",
      "apple-touch-icon-72x72.png",
      "apple-touch-icon-76x76.png",
      "apple-touch-icon-precomposed.png",
      "apple-touch-icon.png"
    ],
    favicons: [
      "favicon.ico"
    ],
  },
  output: {
    images: true,
    files: false,
    html: false,
  }
};

const appDir = path.join(__dirname, "..", "..", "src", "app");
const dest = path.join(__dirname, "generated");
const source = path.join(__dirname, "..", "..", "src", "images", "avatar.jpg");

const response = await favicons(source, configuration);
await fs.mkdir(dest, { recursive: true });

interface FaviconAndMetadata {
  icon: FaviconImage;
  size?: number;
  targetPrefix?: string;
  index?: number;
}

const imagesAndMetadata: FaviconAndMetadata[] = response.images
  .filter((icon) => icon.name !== "apple-touch-icon-precomposed.png")
  .map((icon) => {
    let size: number | undefined = undefined;
    const sizeMatch = icon.name.match(/-(\d+)x(\d+)\.png$/);
    if (sizeMatch) {
      size = parseInt(sizeMatch[1], 10);
    }
    
    let targetPrefix: string | undefined = undefined;
    if (icon.name.startsWith("apple-touch-icon")) {
      targetPrefix = "apple-icon";
    } else if (icon.name.startsWith("android-chrome")) {
      targetPrefix = "icon";
    }

    return {
      icon,
      size,
      targetPrefix,
    };
  });

const sortedImagesAndMetadata = imagesAndMetadata
  .sort((a, b) => {
    function compareBySize(a: FaviconAndMetadata, b: FaviconAndMetadata): number {
      if (a.size && b.size) {
        return b.size - a.size;
      } else if (b.size) {
        return -1;
      } else if (a.size) {
        return 1;
      } else {
        return 0;
      }
    }

    if (a.targetPrefix && b.targetPrefix) {
      if (a.targetPrefix === b.targetPrefix) {
        return compareBySize(a, b);
      }
      return a.targetPrefix.localeCompare(b.targetPrefix);
    } else if (a.targetPrefix) {
      return -1;
    } else if (b.targetPrefix) {
      return 1;
    } else {
      return compareBySize(a, b);
    }
  });

const groupedIcons = Object
  .groupBy(sortedImagesAndMetadata, (item: FaviconAndMetadata) => 
    item.targetPrefix !== undefined ? item.targetPrefix : "other");

Object.values(groupedIcons).forEach((group) => {
  if (!group) {
    return;
  }

  group.forEach((item, index) => {
    item.index = index + 1;
  });
});

await Promise.all(
  sortedImagesAndMetadata.map(
    async (image) => {
      const destinations = [
        path.join(dest, image.icon.name)
      ];

      if (!image.targetPrefix) {
        destinations.push(path.join(appDir, image.icon.name));
      } else {
        assert(image.index !== undefined);
        destinations.push(
          path.join(appDir, `${image.targetPrefix}${image.index}.png`)
        );
      }

      await Promise.all(
        destinations.map((destination) =>
          fs.writeFile(destination, image.icon.contents)
        )
      );
    },
  ),
);




