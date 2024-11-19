import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib';
import multer from 'multer';

const app = express();

app.use(cors());

  app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

app.post('/read-file', upload.single('file'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  let fileContent = '';
  try {
    if (file.mimetype === 'text/plain') {
      fileContent = await readTXTFile(file.path);
    } else if (file.mimetype === 'application/pdf') {
      fileContent = await readPDFFile(file.path);
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      fileContent = await readDOCXFile(file.path);
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }
    res.send({ fileContent });
  } catch (err) {
    res.status(500).json({ error: 'Error reading file', details: err.message });
  }
});

const readTXTFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log(data); // Display the file content
    return data;
  } catch (err) {
    console.error('Error reading file:', err);
    throw err;
  }
}

const readPDFFile = async (filePath) => { 
  try { 
    const existingPdfBytes = await fs.readFile(filePath); 
    const pdfDoc = await PDFDocument.load(existingPdfBytes); 
    const pages = pdfDoc.getPages(); 
    const textContent = pages.map(page => page.getTextContent().items.map(item => item.str).join(' ')).join('\n'); 
    console.log(textContent); 
    return textContent; 
  } catch (err) { 
    console.error('Error reading PDF file:', err); 
    throw err; 
  } 
}

const readDOCXFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath);
    const docx = await mammoth.extractRawText({ buffer: data });
    console.log(docx.value);
    return docx.value;
  } catch (err) {
    console.error('Error reading file:', err);
    throw err;
  }
}


app.get('/', (req, res) => {
    res.send('Hello World');
});


app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
