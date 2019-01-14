var async = require("async")
const createCsvWriter = require('csv-writer').createArrayCsvWriter;

var Fork = function() {
    this.state = 0;
    return this;
}

Fork.prototype.acquire = function(cb) { 
    var time = 1
    var beb = function(wait, fork) {
        setTimeout(function () {
            if(fork.state == 1) {
                time *= 2
                beb(Math.floor(Math.random()) * time, fork)
            } else {
                fork.state = 1
                if (cb) cb()
            }
        }, wait)
    }
    beb(1, this)
}

Fork.prototype.release = function(cb) { 
    this.state = 0; 
    if (cb) {
        cb();
    }
}

var Philosopher = function(id, forks) {
    this.id = id;
    this.forks = forks;
    this.f1 = id % forks.length;
    this.f2 = (id+1) % forks.length;
    return this;
}

Philosopher.prototype.startNaive = function(count) {
    var forks = this.forks,
        f1 = this.f1,
        f2 = this.f2,
        id = this.id;

    if (count > 0) {
        asymTimesStart[id] = new Date().getTime();
        forks[f1].acquire(function () {
            console.log("Philosopher ", id, " acquired first fork")
            forks[f2].acquire(function () {
                console.log("Philosopher ", id, " acquired second fork")
                if (asymTimes[id] === undefined) {
                    asymTimes[id] = new Date().getTime() - asymTimesStart[id];
                } else {
                    asymTimes[id] += new Date().getTime() - asymTimesStart[id];
                }
                philosophers[id].eat(count);
            })
        })
    }
}

Philosopher.prototype.eat = function (count) {
    var forks = this.forks,
        f1 = this.f1,
        f2 = this.f2,
        id = this.id;
    console.log("Philosopher ", id, " starting eating")
    setTimeout(function () {
        async.waterfall([
            function (cb) {
                forks[f1].release(cb);
                console.log("Philosopher ", id, " released first fork")
            },
            function (cb) {
                forks[f2].release(cb);
                console.log("Philosopher ", id, " released second fork")
            },
            function (cb) {
                philosophers[id].startNaive(count - 1);
            }
        ]);
    }, Math.floor(Math.random()) * 15);
    console.log("Philosopher ", id, " done eating, now thinking")
}

Philosopher.prototype.startAsym = function(count) {
     if(this.id% 2 == 0) {
        var tmp = this.f1;
        this.f1 = this.f2;
        this.f2 = tmp;
        this.startNaive(count);
    } else {
        this.startNaive(count);
    }
}

Philosopher.prototype.startConductor = function(count) {
    var philosopher = this;
    if (count > 0) {
        conductorTimesStart[philosopher.id] = new Date().getTime();
        console.log("Philosopher ", this.id, " asks the conductor")
        conductor.acquire(function() {
            philosopher.forks[philosopher.f1].acquire(function () {
                console.log("Philosopher ", philosopher.id, " acquired fork ", philosopher.f1)
                philosopher.forks[philosopher.f2].acquire(function () {
                    console.log("Philosopher ", philosopher.id, " acquired fork ", philosopher.f2)
                    if (conductorTimes[philosopher.id] === undefined) {
                        conductorTimes[philosopher.id] = new Date().getTime() - conductorTimesStart[philosopher.id];
                    } else {
                        conductorTimes[philosopher.id] += new Date().getTime() - conductorTimesStart[philosopher.id];
                    }
                    philosopher.eatAndRelease(count);
                })
            })
        })
    }
}

var Conductor = function () {
    this.counter = N - 1;
    return this;
}

Philosopher.prototype.eatAndRelease = function (count) {
    var philosopher = this;
    console.log("Philosopher ", philosopher.id, " starting eating")
    setTimeout(function () {
        console.log("Philosopher ", philosopher.id, " is done eating")
        async.waterfall([
            function (cb) {
                philosopher.forks[philosopher.f1].release(cb);
                console.log("Philosopher ", philosopher.id, " released fork ", philosopher.f1)
            },
            function (cb) {
                philosopher.forks[philosopher.f2].release(cb);
                console.log("Philosopher ", philosopher.id, " released fork ", philosopher.f2)
            },
            function (cb) {
                conductor.release(cb);
            },
            function(cb) {
                philosopher.startConductor(count - 1);
            }
        ]);
    }, Math.floor(Math.random() * philosopher.eatTime));
}

Conductor.prototype.acquire = function(cb) { 
    var time = 1
    var beb = function(wait, cond) {
        setTimeout(function () {
            if(cond.counter > 0) {
                cond.counter -= 1;
                if (cb) cb()
            } else {
                time *= 2
                beb(Math.floor(Math.random()) * time, cond)
            }
        }, wait)
    }
    beb(1, this)
}

Conductor.prototype.release = function(cb) { 
    this.counter += 1;
    if (cb) cb();
}

var N = 100;
var MAX_COUNT = 10;
var forks = [];
var philosophers = [];
var conductor = new Conductor();

var asymTimesStart = [];
var conductorTimesStart = [];
var asymTimes = [];
var conductorTimes = [];

for (var i = 0; i < N; i++) {
    forks.push(new Fork());
}

for (var i = 0; i < N; i++) {
    philosophers.push(new Philosopher(i, forks));
}

for (var i = 0; i < N; i++) {
    philosophers[i].startConductor(MAX_COUNT);
}

setTimeout(function() {

    const csvWriter = createCsvWriter({
        path: 'phil_data_' + N + '.csv'
    });
    
    var records = [];
    for(var i = 0; i < N; i++) {
        records[i] = [i, conductorTimes[i]];
    }
    
    csvWriter.writeRecords(records)
        .then(() => {
            console.log('...Done');
        });

}, 2000);