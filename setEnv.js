const path = require('path');

const tesseractPath = path.resolve(__dirname, './Tesseract-OCR');
process.env.TESSERACT_PATH = tesseractPath;
