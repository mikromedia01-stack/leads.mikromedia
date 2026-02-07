const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.error('CRITICAL: MongoDB connection failed.');
        console.error('Please ensure MongoDB is running locally on port 27017');
        console.error('OR update .env with a valid MongoDB URI (e.g. MongoDB Atlas)');
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        // Do not verify process.exit(1) so it can retry or let the user see the log? 
        // Actually, without DB, the app is useless. But exiting makes nodemon crash loop.
        // Let's exit to prompt user action.
        process.exit(1);
    }
};

module.exports = connectDB;
