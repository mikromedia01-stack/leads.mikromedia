const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const importData = async () => {
    try {
        await User.deleteMany();

        const adminUser = {
            name: 'Admin User',
            email: 'admin@mikromedia.com',
            password: 'password123',
            role: 'admin'
        };

        const managerUser = {
            name: 'Manager User',
            email: 'manager@mikromedia.com',
            password: 'password123',
            role: 'manager'
        };

        const salesUser = {
            name: 'Sales User',
            email: 'sales@mikromedia.com',
            password: 'password123',
            role: 'sales'
        };

        await User.create([adminUser, managerUser, salesUser]);

        console.log('Data Imported!');
        console.log('Login with: admin@mikromedia.com / password123');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
