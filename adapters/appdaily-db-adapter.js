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

var dailySearchQuery = 'SELECT * FROM daily WHERE id=? ORDER BY workoutday DESC LIMIT 1'; // id/pw를 이용하여 유저 정보 search
var weightSearchQuery = 'SELECT workoutday, weight FROM daily WHERE id=? ORDER BY workoutday DESC LIMIT 7';
var dailyDupSearchQuery = 'SELECT workoutday FROM daily WHERE id=? AND workoutday=?'; // 유저 daily query
var dailyWriteQuery = 'INSERT INTO daily VALUE (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'; // 유저 daily query

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
            connection.query(dailySearchQuery, [id], function(err, rows1) {
                if (err) { // daily x
                    console.log(err);
                    resultCode = dbResult.Fail;
                    connection.release();
                    cb(resultCode, []);
                } else { // daily o
                    response = rows1;
                    connection.query(weightSearchQuery, [id], function(err, rows2) {
                        if (err) { // daily x
                            console.log(err);
                            resultCode = dbResult.Fail;
                            connection.release();
                            cb(resultCode, []);
                        } else { // daily o
                            resultCode = dbResult.OK;
                            connection.release();
                            response = Object.assign(rows1[0], rows2);
                            console.log(response)
                            cb(resultCode, response);
                        }
                    });
                    resultCode = dbResult.OK;
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
            connection.query(dailyDupSearchQuery, [daily.id, daily.workoutday], function(err, rows) {
                if (!err) { // query가 오는 경우
                    console.log(rows);
                    if(rows[0]) { // 중복 id 존재
                        console.log('duplicated day');
                        resultCode = dbResult.Fail;
                        connection.release();
                        cb(resultCode);
                    } else {
                        connection.query(dailyWriteQuery, [daily.id, daily.workoutday, daily.running_time,
                            daily.weight_time, daily.arm, daily.back, daily.shoulder, daily.chest, daily.leg,
                            daily.sixpack, daily.eat_calories, daily.all_eat_calories, daily.spent_calories,
                            daily.all_spent_calories, daily.weight], function(err) {
                            if (err) {
                                console.log(err)
                                resultCode = dbResult.Fail;
                                connection.release();
                                cb(resultCode);
                            } else {
                                console.log("write success");
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