const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const {MongoClient} = require("mongodb")
const {GridFSBucket} = require('mongodb')
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');


const app = express();  

// Middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

// const mongoURI = 'mongodb+srv://hemarana9099852230:12345@cluster0.rakth2q.mongodb.net/GRAPHQL';
// Mongo URI

const mongoURI = 'mongodb://localhost:27017/fileU';
mongoose.connect(mongoURI);
conn=mongoose.connection;

let gfs;
conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads'); // Use the collection name you've used for uploads
});

// Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
        const filename = file.originalname;
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
    });
  }
});
const upload = multer({ storage})

app.get("/",(req,res)=>{

  
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      res.render('index', { files: false });
    } else {
      files.map(file => {
        
        if (
          file.contentType === 'image/jpeg' ||
          file.contentType === 'image/png'
        ) {
          file.isImage = true;
        } else {
          file.isImage = false;
        }
      });
      res.render('index', { files: files });
    }
  });
})

app.post('/upload', upload.single('file'), (req, res) => {
  res.redirect('/');
});

app.get('/image/:filename', (req, res) => {


  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    // Check if image
    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }
  });
});

app.listen(5000,()=>{
  console.log("PORT 5000")
})
