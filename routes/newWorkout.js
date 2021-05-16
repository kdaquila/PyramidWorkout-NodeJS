const express = require('express');
const {MongoClient, ObjectID} = require('mongodb');
const router = express.Router();
const debug = require('debug')('app:newWorkout')

router.get('/', async function(req, res, next) {
  try {
    res.render('newWorkout');
  }
  catch (error) {
    next(error)
  }
});

router.post('/', async function(req, res, next) {
  try {
    // Create the workout
    let workout = await createWorkout(new Date(), 
      req.body.exerciseName, 
      req.body.unitsName, 
      Number(req.body.level1Goal), 
      Number(req.body.level2Goal), 
      Number(req.body.highestLevel))

    // Add workout to user
    let workoutId = workout.ops[0]._id.id.toString('hex')
    await addWorkoutToAppUser(workoutId, res.locals.user.username)

    req.session.flash = {
      status: "success",
      message: "Success, workout created. Enjoy!"
    }
    return res.redirect('detail');
  }
  catch (error) {
    debug(error.message)
    debug(error.stack)
    req.session.flash = {
      status: "error",
      message:  "Sorry, the request failed."
    }
    return res.redirect('newWorkout');
  }
});

// Database operations for these routes
async function createWorkout(CreationDate, ExerciseName, Units, Level1Goal, Level2Goal, HighestLevel) {
  // Generate the 'Level' documents
  let Levels = []
  let LevelNumber = 1
  let isRising = true;
  while (LevelNumber > 0) {
    Levels.push({
      _id: new ObjectID(),
      LevelNumber,
      LevelName: `Level ${LevelNumber} ${isRising ? "Rising" : "Falling"} `,
      Goal: Level1Goal + (Level2Goal - Level1Goal)*(LevelNumber - 1),
      Actual: 0
    })
    if (LevelNumber === HighestLevel) {
      isRising = false;
      LevelNumber--;
    }
    else if (isRising) {
      LevelNumber++;
    }
    else {
      LevelNumber--;
    }
  }

  // Add the new Workout Document with its embedded Levels
  const client = new MongoClient(process.env.DB_CONNECTION_STRING, { useUnifiedTopology: true });
  try {
    await client.connect();
    const db = await client.db(process.env.DB_DATABASE_NAME);
    return await db.collection('Workouts').insertOne({
      CreationDate,
      ExerciseName,
      Units,
      Levels
    })
  }
  finally {
    await client.close()
  }
}

async function addWorkoutToAppUser(workoutId, username) {
  const client = new MongoClient(process.env.DB_CONNECTION_STRING, { useUnifiedTopology: true });
  try {
    await client.connect();
    const db = await client.db(process.env.DB_DATABASE_NAME);
    return await db.collection('AppUsers').updateOne({username},{$push: {Workouts: new ObjectID(workoutId)}})
  }
  finally {
    await client.close()
  }
}

// Middleware functions ---


// Utility functions ---



module.exports.router = router;