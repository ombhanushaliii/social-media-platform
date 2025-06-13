const express=require('express');
const bodyParser=require('body-parser');
const dotenv=require('dotenv');
const userRoutes=require('./routes/user.routes');
const cors=require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

dotenv.config();
const app=express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const PORT=process.env.PORT||5000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use('/user', userRoutes);

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});