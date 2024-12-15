const { MongoClient } = require('mongodb');

// MongoDB Localhost Connection URI
const uri = 'mongodb://localhost:27017'; // Localhost URI
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();

        // Connect to the database
        const database = client.db('HomeAutoSys_CloudDB'); // Database name

        // Define the collections
        const owners = database.collection('owners');
        const devices = database.collection('devices');


        // Dummy data insertion
        // // Insert sample devices
        // await devices.insertMany([
        //     { _id: '1', type: 'server', hostname: 'john-laptop' },
        //     { _id: '2', type: 'esp32' },
        // ]);

        // // Insert an owner
        // await owners.insertOne({
        //     _id: '1',
        //     owner_name: 'John Doe',
        //     device_ids: ['1', '2'],
        //     email: 'john.doe@example.com',
        // });

        // console.log('Data inserted successfully!');
    } finally {
        // Close the connection
        await client.close();
    }
}

let database;

async function connectToDatabase() {
    if (!database) {
        try {
            await client.connect();
            console.log('Connected to MongoDB!');
            database = client.db('device_management'); // Replace with your database name
        } catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            throw error;
        }
    }
    return database;
}

run().catch(console.error);
module.exports = { connectToDatabase };


