var async = require("async")

var Semaphore = function(initialValue) {
    this.counter = initialValue;
    return this;
}

Semaphore.prototype.acquire = function(cb) { 
    var time = 1
    var beb = function(wait, sem) {
        setTimeout(function () {
            if(sem.counter > 0) {
                sem.counter -= 1;
                if (cb) cb()
            } else {
                time *= 2
                beb(Math.floor(Math.random()) * time, sem)
            }
        }, wait)
    }
    beb(1, this)
}

Semaphore.prototype.release = function(cb) { 
    this.counter += 1;
    if (cb) cb();
}

var Barber = function() {
    return this;
}

Barber.prototype.start = function(count) {
    var barber = this;
    if( count > 0 ) {
        customersSem.acquire(function() {
            accessSeatsSem.release();
            numberOfFreeSeats += 1;
            barberSem.release();
            accessSeatsSem.release();
            console.log("The barber is cutting...")
            barber.start(count);    // -1 if we want the barber to eventually finish
        })
    } else {
        console.log("The barber has finished for today")
    }
}

var Customer = function(id) {
    this.id = id;
    this.notYetCut = true;
    return this;
}

Customer.prototype.start = function() {
    var customer = this;
    if(this.notYetCut) {
        accessSeatsSem.acquire(function() {
            if(numberOfFreeSeats > 0) {
                console.log("Customer ", customer.id, " just sat down");
                numberOfFreeSeats -= 1;
                customersSem.release();
                accessSeatsSem.release();
                barberSem.acquire(function() {
                    customer.notYetCut = false;
                    console.log("Customer ", customer.id, " is getting his hair cut");
                    customer.start();
                })
            } else {
                console.log("There are no free seats. Customer " + customer.id + " has left the barbershop");
                accessSeatsSem.release();
                customer.notYetCut = false;
                customer.start();
            }
        })
    }
}

var customersSem = new Semaphore(0);
var barberSem = new Semaphore(0);
var accessSeatsSem = new Semaphore(1);
const CHAIRS = 20;
const NUMBER_OF_CLIENTS = 25;
var numberOfFreeSeats = CHAIRS;
var customers = [];

var barber = new Barber();
barber.start(10);

console.log("after barber");

for (var i = 0; i < NUMBER_OF_CLIENTS; i++) {
    customers.push(new Customer(i));
}

console.log("after creating customers");


for (var i = 0; i < NUMBER_OF_CLIENTS; i++) {
    customers[i].start();
}

console.log("after starting customers");
