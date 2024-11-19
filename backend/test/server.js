const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const app = express();

// Allow cross-origin requests
app.use(cors());
app.use(express.json());

// Configure multer to handle file uploads and store files in 'uploads/' directory
const upload = multer({ dest: 'uploads/' });

// Endpoint for reading the uploaded file
app.post('/read-file', upload.single('file'), async (req, res) => {
  const file = req.file;

  // Check if a file was uploaded
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    if (file.mimetype === 'application/pdf') {
      const fileContent = await readPDFFile(file.path);  // Use the file path from multer
        console.log(fileContent);
      res.json({ fileContent });
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const fileContent = await readDOCXFile(file.path);  // Handle .docx files
      console.log(fileContent);
      res.json({ fileContent });
    } else if (file.mimetype === 'text/plain') {
      const fileContent = await readTXTFile(file.path);  // Handle .txt files
      console.log(fileContent);
      res.json({ fileContent });
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error processing file', details: err.message });
  }
});

// Function to read and extract text from PDF file
const readPDFFile = async (filePath) => {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const data = await pdfParse(fileBuffer);
    return data.text;
  } catch (err) {
    console.error('Error reading PDF file:', err.message);
    throw new Error('Error reading PDF file: ' + err.message);
  }
};

// Function to read and extract text from DOCX file
const readDOCXFile = async (filePath) => {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const data = await mammoth.extractRawText({ buffer: fileBuffer });
    return data.value;
  } catch (err) {
    console.error('Error reading DOCX file:', err.message);
    throw new Error('Error reading DOCX file: ' + err.message);
  }
};

// Function to read and extract text from TXT file
const readTXTFile = async (filePath) => {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    return fileContent;
  } catch (err) {
    console.error('Error reading TXT file:', err.message);
    throw new Error('Error reading TXT file: ' + err.message);
  }
};

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
