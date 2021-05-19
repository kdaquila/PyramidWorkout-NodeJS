const express = require('express');
const router = express.Router();
const {MongoClient, ObjectID, ObjectId} = require('mongodb');
const printf = require('printf');
const debug = require('debug')('app:detail')

router.get('/:WorkoutId/:LevelIndex', async function(req, res, next) {
  try {
    res.locals.workoutId = req.params.WorkoutId;
    res.locals.levelIndex = req.params.LevelIndex;

    let workout = await findWorkout(res.locals.user, res.locals.workoutId)
    res.locals.CreationDate = workout.CreationDate;
    res.locals.ExerciseName = workout.ExerciseName;
    res.locals.Units = workout.Units;
    res.locals.Levels = workout.Levels;

    res.locals.dateString = workout.CreationDate.getFullYear() + "-" + printf('%02d', workout.CreationDate.getMonth()+1) + "-" + printf('%02d', workout.CreationDate.getDate())
    let hours = workout.CreationDate.getHours();
    if (hours === 0) {hours = 12;}
    else if (hours > 12) {hours = hours - 12;}
    let am_pm = workout.CreationDate.getHours()/11 > 1 ? "PM" : "AM"
    res.locals.timeString = printf('%02d', hours) + ":" + printf('%02d', workout.CreationDate.getMinutes()) + " " + am_pm;
    
    let workoutStats = await findWorkoutStats(res.locals.user, res.locals.workoutId)
    res.locals.minGoal = workoutStats.minGoal;
    res.locals.maxGoal = workoutStats.maxGoal;
    res.locals.totalDone = workoutStats.totalDone;
    res.locals.percentDone = workoutStats.percentDone;
    res.locals.isPrevAvail = res.locals.levelIndex > 0;
    res.locals.isNextAvail = res.locals.levelIndex < (workout.Levels.length - 1);
    res.locals.printf = printf;

    res.render('detail');
  }
  catch (error) {
    next(error)
  }
});

router.post('/:WorkoutId/:LevelIndex', async function(req, res, next) {
  try {
    let actualDone = Number(req.body.actualDone)
    let workoutStats = await findWorkoutStats(res.locals.user, req.params.WorkoutId)
    if(actualDone > workoutStats.maxGoal) actualDone = workoutStats.maxGoal;

    await updateWorkoutActualReps(res.locals.user, req.params.WorkoutId, req.params.LevelIndex, actualDone)

    return res.redirect('/detail/' + req.url);
  }
  catch (error) {
    debug(error.message)
    debug(error.stack)
    req.session.flash = {
      status: "error",
      message:  "Sorry, the save attempt failed."
    }
    return res.redirect('/detail/' + req.url);
  }
});


// Database operations for these routes
async function findWorkout(user, workoutId) {
  const client = new MongoClient(process.env.DB_CONNECTION_STRING, { useUnifiedTopology: true });

  // Make sure user owns the workout
  let isAuthorized = user.Workouts.filter((workout)=> workout.id.toString('hex') === workoutId).length === 1;
  if (!isAuthorized) throw Error("Invalid workout id for current user")

  try {
    await client.connect();
    const db = await client.db(process.env.DB_DATABASE_NAME);
    return await db.collection('Workouts').findOne({_id: ObjectID(workoutId)})
  }
  finally {
    await client.close()
  }
}

async function findWorkoutStats(user, workoutId) {
  // Make sure user owns the workout
  let isAuthorized = user.Workouts.filter((workout)=> workout.id.toString('hex') === workoutId).length === 1;
  if (!isAuthorized) throw Error("Invalid workout id for current user")

  const client = new MongoClient(process.env.DB_CONNECTION_STRING, { useUnifiedTopology: true });

  try {
    await client.connect();
    const db = await client.db(process.env.DB_DATABASE_NAME);
    let pipeline = [
      {"$match": {"_id": ObjectId(workoutId)}},

      {"$unwind": {"path": "$Levels"}},

      {"$group": {
        "_id": "$_id", 
        "maxGoal": {"$max": "$Levels.Goal"}, 
        "minGoal": {"$min": "$Levels.Goal"},
        "totalDone": {"$sum": "$Levels.Actual"},
        "totalGoal": {"$sum": "$Levels.Goal"},
      }},

      {'$addFields': {
        'percentDone': {'$multiply': [100, {'$divide': ['$totalDone', '$totalGoal']}]}
      }},
    ]
    let results = await db.collection('Workouts').aggregate(pipeline)
    results = (await results.toArray())[0]
    return results;
  }
  finally {
    await client.close()
  }
}

async function updateWorkoutActualReps(user, workoutId, levelIndex, actualReps) {
  const client = new MongoClient(process.env.DB_CONNECTION_STRING, { useUnifiedTopology: true });

  // Make sure user owns the workout
  let isAuthorized = user.Workouts.filter((workout)=> workout.id.toString('hex') === workoutId).length === 1;
  if (!isAuthorized) throw Error("Invalid workout id for current user")

  try {
    await client.connect();
    const db = await client.db(process.env.DB_DATABASE_NAME);
    let updateObj = {};
    updateObj["$set"] = {};
    updateObj["$set"][`Levels.${levelIndex}.Actual`] = actualReps;
    return await db.collection('Workouts').updateOne({_id: ObjectID(workoutId)}, updateObj)
  }
  finally {
    await client.close()
  }
}

// Middleware functions ---


// Utility functions ---



module.exports.router = router;