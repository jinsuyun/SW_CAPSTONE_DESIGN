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

var dailySearchQuery = 'SELECT * FROM daily WHERE id=? ORDER BY workoutday DESC limit 7'; // id/pw를 이용하여 유저 정보 search
var dailyDupSearchQuery = 'SELECT workoutday FROM daily WHERE id=? AND workoutday=?'; // 유저 daily query
var dailyNewWriteQuery = 'INSERT INTO daily VALUE (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'; // id 없는경우 새로등록
var dailyWriteQuery = 'UPDATE daily SET running_time=running_time+?, weight_time=weight_time+?, arm=arm+?, back=back+?,' +
    'shoulder=shoulder+?, chest=chest+?, leg=leg+?, sixpack=sixpack+?, spent_calories=spent_calories+?,' +
    'all_spent_calories=?, weight=?, objective=? WHERE id=? AND workoutday=?'; // id 있는경우 update로 누적
var countWriteQuery = 'UPDATE appuser SET exercount=exercount+1 WHERE id=?';
var userSearchQuery = 'SELECT exercount, targetperiod FROM appuser WHERE id=?';
var levelWriteQuery = 'UPDATE appuser SET exercount=?, exerlevel=exerlevel+1 WHERE id=?';

adapter.dailySearch = function(id, cb) {
    var resultCode = dbResult.Fail;

    pool.getConnection(function(err, connection) {
        if (err) { // db연결실패
            console.log(err);
            resultCode = dbResult.Fail;
            connection.release();
            cb(resultCode, []);
        } else { // db연결성공
            connection.query(dailySearchQuery, [id], function(err, rows) {
                if (!rows[0]) { // daily x
                    console.log(err);
                    resultCode = dbResult.Fail;
                    connection.release();
                    cb(resultCode, Object.assign([]));
                } else { // daily o
                    resultCode = dbResult.OK;
                    connection.release();
                    cb(resultCode, Object.assign(rows));
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
                    if(!rows[0]) { // 중복 id x
                        console.log('not duplicated id');
                        connection.query(dailyNewWriteQuery, [daily.id, daily.workoutday, daily.running_time,
                            daily.weight_time, daily.arm, daily.back, daily.shoulder, daily.chest, daily.leg,
                            daily.sixpack, daily.eat_calories, daily.all_eat_calories, daily.spent_calories,
                            daily.all_spent_calories, daily.weight, daily.objective], function(err) {
                            if (err) {
                                console.log(err)
                                resultCode = dbResult.Fail;
                            } else {
                                console.log("exercise success");
                                resultCode = dbResult.OK;
                            }
                        });
                    } else {
                        connection.query(dailyWriteQuery, [daily.running_time, daily.weight_time,
                            daily.arm, daily.back, daily.shoulder, daily.chest, daily.leg, daily.sixpack,
                            daily.spent_calories, daily.all_spent_calories, daily.weight, daily.objective,
                            daily.id, daily.workoutday], function(err) {
                            if (err) {
                                console.log(err)
                                resultCode = dbResult.Fail;
                            } else {
                                console.log("exercise success");
                                resultCode = dbResult.OK;
                            }
                        });
                    }
                    connection.query(countWriteQuery, [daily.id], function(err) {
                        if (err) {
                            console.log(err)
                            resultCode = dbResult.Fail;
                            // connection.release();
                            // cb(resultCode);
                        } else {
                            console.log("count success");
                            resultCode = dbResult.OK;
                            // connection.release();
                            // cb(resultCode);
                        }
                        connection.query(userSearchQuery, [daily.id], function(err, rows) {
                            if (rows[0].exercount / rows[0].targetperiod < 1) {
                                resultCode = dbResult.OK;
                                connection.release();
                                cb(resultCode);
                            } else { // daily o
                                resultCode = dbResult.OK;
                                connection.query(levelWriteQuery, [0, daily.id], function(err) {
                                    if (err) {
                                        console.log(err)
                                        resultCode = dbResult.Fail;
                                        connection.release();
                                        cb(resultCode);
                                    } else {
                                        console.log("level up success");
                                        resultCode = dbResult.OK;
                                        connection.release();
                                        cb(resultCode);
                                    }
                                });
                            }
                        });
                    });
                } else { // query가 오지 않는 경우
                    console.log(err);
                }
            });
        }
    });
}

module.exports = adapter;