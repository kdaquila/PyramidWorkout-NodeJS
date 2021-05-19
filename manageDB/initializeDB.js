require('dotenv').config()
const {MongoClient, ObjectID} = require('mongodb');
const {createWorkout, addWorkoutToAppUser} = require('../routes/newWorkout');
const {createUserWithSession} = require('../routes/signup');
const bcrypt = require('bcryptjs');

async function createUniqueIndexes() {
    const client = new MongoClient(process.env.DB_CONNECTION_STRING, { useUnifiedTopology: true });
    try {
        await client.connect();
        const db = await client.db(process.env.DB_DATABASE_NAME);
        return await db.collection('AppUsers').createIndex({ Username: 1 }, { unique: true })
    }
    finally {
        await client.close()
    }
}

async function insertSeedData() {
    // Generate admin's password's hash
    let username = 'user1';
    let password = 'password';
    let passwordHash = await new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, (err, hash) => {
          if (err) reject(err);
          resolve(hash);
        })
      })   

    const client = new MongoClient(process.env.DB_CONNECTION_STRING, { useUnifiedTopology: true });
    try {
        // Create admin user
        await createUserWithSession(username, passwordHash);

        // Create some workouts for admin user
        let currDate = new Date();
        for (let i = 0; i > -30; i--) {
            // Create the workout and add workout to user
            let newDate = new Date(currDate);
            newDate.setDate(currDate.getDate() + i);
            let workout = await createWorkout(newDate, "Pushups", "reps", Number(2), Number(4), Number(10))     
            let workoutId = workout.ops[0]._id.id.toString('hex')
            await addWorkoutToAppUser(workoutId, username) 
        }
    }
    catch (error) {
        console.log(error)
    }

    finally {
        await client.close()
    }
}

createUniqueIndexes().catch(console.log)
insertSeedData().catch(console.log)