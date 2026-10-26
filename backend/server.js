require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");
const { seedExercises, migrateLegacyWorkouts } = require("./utils/seed");

// connect to db
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const added = await seedExercises();
    if (added) console.log(`Seeded ${added} exercises`);
    const migrated = await migrateLegacyWorkouts();
    if (migrated) console.log(`Migrated ${migrated} legacy workouts`);

    // listen for requests
    app.listen(process.env.PORT, () => {
      console.log("Connected to db & listening on port", process.env.PORT);
    });
  })
  .catch((error) => {
    console.log(error);
  });
