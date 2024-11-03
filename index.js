import fs from 'fs-extra';
import path from 'path';
import Tesseract from 'tesseract.js';
import dotenv from 'dotenv';

dotenv.config();

const IMAGES_DIR = process.env.IMAGES_DIR;

if (!IMAGES_DIR) {
    console.error('Gotta specify the IMAGES_DIR in the .env file first girly');
    process.exit(1);
};

const CAPTIONS_DIR = path.join(IMAGES_DIR, 'Captions');
const PICTURES_DIR = path.join(IMAGES_DIR, 'Pictures');

// Make the Dirs in case there is none
fs.ensureDirSync(CAPTIONS_DIR);
fs.ensureDirSync(PICTURES_DIR);

async function containsText(imagePath) {
    try {
        // Recognize text in image
        const { data: { text, confidence } } = await Tesseract.recognize(imagePath, 'eng');

// Set thresholds so it doesn't add everything to captions (pls work pls work)
const minConfidence = 50; // Adjust if needed; higher means more certainty
const minTextLength = 5; // Only consider text if longer than 5 characters

return text.trim().length >= minTextLength && confidence >= minConfidence; // Return true if there's any text
    } catch (error) {
        console.error(`Error processing ${imagePath}:`, error);
        return false; // Treat as "no text" if error
    }
};

async function sortImages() {
    const files = await fs.readdir(IMAGES_DIR);

    for (const file of files) {
        const filePath = path.join(IMAGES_DIR, file);

        // Skip dirs and non-image files
        if ((await fs.stat(filePath)).isDirectory() || !/\.(jpg|jpeg|png|gif)$/i.test(file)) {
            continue;
        }

        try {
            if (await containsText(filePath)) {
                await fs.move(filePath, path.join(CAPTIONS_DIR, file), { overwrite: true });
                console.log(`Moved ${file} to Captions`);
            } else {
                await fs.move(filePath, path.join(PICTURES_DIR, file), { overwrite: true });
                console.log(`Moved ${file} to Pictures`);
            }
        } catch (error) {
            console.error(`Error processing ${file}:`, error);
        }
    }
}

sortImages()
    .then(() => console.log('Image sorting complete.'))
    .catch(console.error);