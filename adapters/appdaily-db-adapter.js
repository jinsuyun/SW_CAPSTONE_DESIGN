var mysql = require('mysql');
var dbConfig = {
    host: '18.221.204.247',
    port: '3306',
    user: 'root', // mysql user
    password: '5907', // mysql password
    database: 'capstone',
    connectionLimit: 10
}

var dbResult = require('../routes/result');
var pool = mysql.createPool(dbConfig);
var adapter = {};

var dailySearchQuery = 'SELECT * FROM daily WHERE id=? ORDER BY workoutday DESC'; // id/pw를 이용하여 유저 정보 search
var dailyDupSearchQuery = 'SELECT workoutday FROM daily WHERE id=? AND workoutday=?'; // 유저 daily query
var dailyNewWriteQuery = 'INSERT INTO daily(id, workoutday, running_time, weight_time, arm, back, shoulder, chest, leg, sixpack, spent_calories, all_spent_calories, weight, objective) VALUE (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'; // id 없는경우 새로등록
var dailyWriteQuery = 'UPDATE daily SET running_time=?, weight_time=?, arm=?, back=?, shoulder=?, chest=?, leg=?, sixpack=?, spent_calories=?, all_spent_calories=?, weight=?, objective=? WHERE id=? AND workoutday=?'; // id 있는경우 update

adapter.dailySearch = function(id, cb) {
    var resultCode = dbResult.Fail;
    var response;

    pool.getConnection(function(err, connection) {
        if (err) { // db연결실패
            console.log(err);
            resultCode = dbResult.Fail;
            connection.release();
            cb(resultCode, []);
        } else { // db연결성공
            connection.query(dailySearchQuery, [id], function(err, rows) {
                if (err) { // daily x
                    console.log(err);
                    resultCode = dbResult.Fail;
                    connection.release();
                    cb(resultCode, Object.assign([], [{"success":false}]));
                } else { // daily o
                    resultCode = dbResult.OK;
                    connection.release();
                    cb(resultCode, Object.assign(rows, [{"success":true}]));
                }
            });
        }
    });
}

adapter.dailyWrite = function(daily, cb) {
    console.log(daily)
    var resultCode = dbResult.Fail;
    pool.getConnection(function(err, connection) {
        if (err) {
            console.log(err)
            resultCode = dbResult.Fail;
            connection.release();
            cb(resultCode);
        } else {
            connection.query(dailyDupSearchQuery, [daily.id, user.workoutday], function(err, rows) {
                if (!err) { // query가 오는 경우
                    console.log(rows);
                    if(!rows[0]) { // 중복 id x
                        console.log('duplicated id');
                        connection.query(dailyNewWriteQuery, [daily.id, daily.workoutday, daily.running_time,
                            daily.weight_time, daily.arm, daily.back, daily.shoulder, daily.chest, daily.leg,
                            daily.sixpack, daily.spent_calories, daily.all_spent_calories, daily.weight, daily.objective], function(err) {
                            if (err) {
                                console.log(err)
                                resultCode = dbResult.Fail;
                                connection.release();
                                cb(resultCode);
                            } else {
                                console.log("exercise success");
                                resultCode = dbResult.OK;
                                connection.release();
                                cb(resultCode);
                            }
                        });
                    } else {
                        connection.query(dailyWriteQuery, [daily.running_time, daily.weight_time, daily.arm, daily.back, daily.shoulder, daily.chest, daily.leg,
                            daily.sixpack, daily.spent_calories, daily.all_spent_calories, daily.weight, daily.objective, daily.id, daily.workoutday], function(err) {
                            if (err) {
                                console.log(err)
                                resultCode = dbResult.Fail;
                                connection.release();
                                cb(resultCode);
                            } else {
                                console.log("exercise success");
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