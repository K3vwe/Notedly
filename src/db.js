// Database Connection Code
const mongoose = require('mongoose');

module.exports = {
    connect: DB_HOST => {
        // Mongo driver updated URL string parser
        mongoose.set('useNewUrlParser', true);
        // use findOneAndUpdate in plcae of findAndModify()
        mongoose.set('useFindAndModify', false);
        // use createIndex() in place of ensureIndex()
        mongoose.set('useCreateIndex', true);
        // use new server discovery and monitoring engine
        mongoose.set('useUnifiedTopology', true);

        // Connect to the database
        mongoose.connect(DB_HOST);

        // log an error if we fail to connect to the database
        mongoose.connection.on('error', err=> {
            console.error(err);
            console.log('MongoDB connection error. Please make sure MongoDB is running.'
            );
            process.exit();
        })
    },

    close: () => {
        mongoose.connection.close();
    }
};