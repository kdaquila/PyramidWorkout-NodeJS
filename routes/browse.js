const express = require('express');
const router = express.Router();
const {MongoClient, ObjectID} = require('mongodb');
const printf = require('printf');

router.get('/', async function(req, res, next) {
  try {
    let pageNumber = Number(req.query.page) || 0;
    let workouts = await findWorkouts(res.locals.user.Username, pageNumber);
    res.locals.workouts = workouts;
    res.locals.printf = printf;
    res.locals.startIndex = pageNumber * process.env.WORKOUTS_PER_PAGE + 1;
    res.locals.stopIndex = workouts && workouts.length < process.env.WORKOUTS_PER_PAGE ? workouts.length : (pageNumber + 1) * process.env.WORKOUTS_PER_PAGE;
    res.locals.isPrevAvail = res.locals.startIndex > 1;
    res.locals.isNextAvail = workouts && workouts.length > 0 && res.locals.stopIndex < workouts.length;
    res.locals.nextPage = pageNumber + 1;
    res.locals.prevPage = ((pageNumber - 1) < 0) ? 0 : (pageNumber - 1);
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