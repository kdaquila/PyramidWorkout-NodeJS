const express = require('express');
const router = express.Router();
const {MongoClient, ObjectID} = require('mongodb');
const printf = require('printf');

router.get('/', async function(req, res, next) {
  try {
    res.locals.sortKey = req.query.sortKey || "CreationDate";
    res.locals.sortDir =req.query.sortDir || "-1";
    let pageNumber = Number(req.query.page) || 0;
    let workouts = await findWorkouts(res.locals.user.Username, pageNumber, res.locals.sortKey, Number(res.locals.sortDir));
    res.locals.workoutCount = await countWorkouts(res.locals.user.Username);
    res.locals.workouts = workouts;
    res.locals.printf = printf;
    res.locals.startIndex = pageNumber * process.env.WORKOUTS_PER_PAGE + 1;
    res.locals.stopIndex = res.locals.workoutCount < process.env.WORKOUTS_PER_PAGE ? res.locals.workoutCount : (pageNumber + 1) * process.env.WORKOUTS_PER_PAGE;
    res.locals.isPrevAvail = res.locals.startIndex > 1;
    res.locals.isNextAvail = workouts && workouts.length > 0 && res.locals.stopIndex < res.locals.workoutCount;
    res.locals.nextPage = pageNumber + 1;
    res.locals.prevPage = ((pageNumber - 1) < 0) ? 0 : (pageNumber - 1);

    res.locals.query = Object.entries(req.query).reduce((accumulator, [key,value])=>{
      if (key === "sortKey" || key === "sortDir") {
        accumulator = accumulator + key + "=" + value + "&";
      }
      return accumulator;
    }, "")
    res.render('browse');
  }
  catch (error) {
    next(error)
  }
});

router.post('/delete', async function(req, res, next) {
  try {
    let workoutObjectIds = Object.keys(req.body).filter((id)=> id!=="selectAll").map((id)=>new ObjectID(id))    
    deleteWorkouts(res.locals.user.Username, workoutObjectIds)
    return res.redirect('/browse');
  }
  catch (error) {
    next(error)
  }
});


// Database operations for these routes
async function findWorkouts(Username, pageNumber=0, sortKey="CreationDate", sortDir=-1) {
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
    let sortObj = {}
    sortObj[sortKey] = sortDir;
    let workouts = await db.collection('AppUsers')
      .aggregate(pipeline)
      .sort(sortObj)
      .skip(pageNumber*Number(process.env.WORKOUTS_PER_PAGE))
      .limit(Number(process.env.WORKOUTS_PER_PAGE))
    workouts = await workouts.toArray();
    return workouts;
  }
  finally {
    await client.close()
  }
}

async function countWorkouts(Username) {
  const client = new MongoClient(process.env.DB_CONNECTION_STRING, { useUnifiedTopology: true });
  try {
    await client.connect();
    const db = await client.db(process.env.DB_DATABASE_NAME);    
    let pipeline = [
      {'$match': {
        'Username': Username
      }}, 
      
      {'$project': {
        'WorkoutCount': {'$size': "$Workouts"}
      }}, 
    ]
    let workouts = await db.collection('AppUsers').aggregate(pipeline)
    workouts = await workouts.toArray();
    return workouts[0].WorkoutCount;
  }
  finally {
    await client.close()
  }
}

async function deleteWorkouts(Username, idObjArray) {
  const client = new MongoClient(process.env.DB_CONNECTION_STRING, { useUnifiedTopology: true });
  try {
    await client.connect();
    const db = await client.db(process.env.DB_DATABASE_NAME);    

    // Delete workouts ids from AppUser document
    await db.collection('AppUsers').updateOne(
      {Username},
      {$pull: {Workouts: {$in: idObjArray}}})

    // Delete workout documents from Workouts collection
    await db.collection('Workouts').deleteMany(
      {_id: {$in: idObjArray}}
    )

  }
  finally {
    await client.close()
  }
}

// Middleware functions ---


// Utility functions ---



module.exports.router = router;