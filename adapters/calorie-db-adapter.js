var mysql = require('mysql');
var db_config = require('../db-config');
var dbConfig = {
    host: db_config.host,
    port: db_config.port,
    user: db_config.user,
    password: db_config.password,
    database: db_config.database,
    connectionLimit: db_config.connectionLimit
}
var dbResult = require('../routes/result');
var pool = mysql.createPool(dbConfig);
var adapter = {};

var userDataSearchQuery = 'SELECT * FROM daily WHERE id=? AND workoutday=?';
var calorieNewWriteQuery = 'INSERT INTO daily VALUE (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'; // id 없는경우 새로등록
var calorieWriteQuery = 'UPDATE daily SET eat_calories=? WHERE id=? AND workoutday=?'; // id 있는경우 update

adapter.calorieWrite = function(user, cb) {
    var resultCode = dbResult.Fail;

    pool.getConnection(function(err, connection) {
        if (err) {
            console.log(err)
            resultCode = dbResult.Fail;
            connection.release();
            cb(resultCode);
        } else {
            connection.query(userDataSearchQuery, [user.id, user.workoutday], function(err, rows) {
                if (!err) { // query가 오는 경우
                    console.log(rows);
                    if(!rows[0]) { // 중복 id x
                        console.log('not duplicated id');
                        connection.query(calorieNewWriteQuery, [user.id, user.workoutday, 0, 0, 0, 0, 0, 0, 0, 0,
                            user.eat_calories, 0, 0, 0, 0, 0], function(err) {
                            if (err) {
                                console.log(err)
                                resultCode = dbResult.Fail;
                                connection.release();
                                cb(resultCode);
                            } else {
                                console.log("calorie success");
                                resultCode = dbResult.OK;
                                connection.release();
                                cb(resultCode);
                            }
                        });
                    } else {
                        console.log('duplicated id');
                        connection.query(calorieWriteQuery, [user.eat_calories, user.id, user.workoutday],
                            function(err) {
                            if (err) {
                                console.log(err)
                                resultCode = dbResult.Fail;
                                connection.release();
                                cb(resultCode);
                            } else {
                                console.log("calorie success");
                                resultCode = dbResult.OK;
                                connection.release();
                                cb(resultCode);
                            }
                        });
                    }
                } else { // query가 오지 않는 경우
                    console.log(err);
                }
            });
        }
    });
}

module.exports = adapter;
