
require('dotenv').config()
const {MongoClient, ObjectID} = require('mongodb');
const {createWorkout, addWorkoutToAppUser} = require('../routes/newWorkout');

async function createUniqueIndexes() {
    const client = new MongoClient(process.env.DB_CONNECTION_STRING, { useUnifiedTopology: true });
    try {
        await client.connect();
        const db = await client.db(process.env.DB_DATABASE_NAME);
        return await db.collection('AppUsers').createIndex({ username: 1 }, { unique: true })
    }
    finally {
        await client.close()
    }
}

createUniqueIndexes().catch(console.log)

async function insertSeedData() {
    const client = new MongoClient(process.env.DB_CONNECTION_STRING, { useUnifiedTopology: true });
    try {
        let currDate = new Date();
        for (let i = 0; i < 30; i++) {
            // Create the workout and add workout to user
            let newDate = new Date(currDate);
            newDate.setDate(currDate.getDate() + i);
            let workout = await createWorkout(newDate, "Pushups", "reps", Number(2), Number(4), Number(10))     
            let workoutId = workout.ops[0]._id.id.toString('hex')
            await addWorkoutToAppUser(workoutId, "user1") 
        }
    }
    catch (error) {
        console.log(error)
    }

    finally {
        await client.close()
    }
}

insertSeedData().catch(console.log)