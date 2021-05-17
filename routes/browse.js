const express = require('express');
const router = express.Router();
const {MongoClient, ObjectID} = require('mongodb');
const printf = require('printf');

router.get('/', async function(req, res, next) {
  try {
    let workouts = await findWorkouts(res.locals.user.Username, 0);
    res.locals.workouts = workouts;
    res.locals.printf = printf;
    res.render('browse');
  }
  catch (error) {
    next(error)
  }
});


// Database operations for these routes
async function findWorkouts(Username, pageNumber=0) {
  const client = new MongoClient(process.env.DB_CONNECTION_STRING, { useUnifiedTopology: true });
  try {
    await client.connect();
    const db = await client.db(process.env.DB_DATABASE_NAME);
    let pipeline = [
      {'$match': {
        'Username': Username
      }}, 
      
      {'$lookup': {
        'from': 'Workouts', 
        'foreignField': '_id', 
        'localField': 'Workouts', 
        'as': 'Workouts'
      }}, 
      
      {'$project': {
        'Workouts': 1
      }}, 
      
      {'$unwind': {
        'path': '$Workouts'
      }}, 
      
      {'$unwind': {
        'path': '$Workouts.Levels'
      }}, 
      
      {'$group': {
        '_id': '$Workouts._id', 
        'CreationDate': {'$first': '$Workouts.CreationDate'}, 
        'ExerciseName': {'$first': '$Workouts.ExerciseName'}, 
        'Units': {'$first': '$Workouts.Units'}, 
        'GoalTotal': {'$sum': '$Workouts.Levels.Goal'}, 
        'ActualTotal': {'$sum': '$Workouts.Levels.Actual'},
      }},

      {'$addFields': {
        'Percent': {'$multiply': [100, {'$divide': ['$ActualTotal', '$GoalTotal']}]}
      }},

    ]
    let workouts = await db.collection('AppUsers')
      .aggregate(pipeline)
      .sort({'CreationDate': -1})
      .skip(pageNumber*Number(process.env.WORKOUTS_PER_PAGE))
      .limit(Number(process.env.WORKOUTS_PER_PAGE))
    workouts = await workouts.toArray();
    return workouts;
  }
  finally {
    await client.close()
  }
}

// Middleware functions ---


// Utility functions ---



module.exports.router = router;