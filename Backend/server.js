const express=require('express');
const bodyParser=require('body-parser');
const dotenv=require('dotenv');
const userRoutes=require('./routes/user.routes');
const cors=require('cors');

dotenv.config();
const app=express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const PORT=process.env.PORT||5000;

app.use('/user', userRoutes);

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});