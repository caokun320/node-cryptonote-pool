var cnUtil = require('cryptonote-util');
var deasync = require('deasync');
const bs58check = require('bs58check');
var apiInterfaces = require('./apiInterfaces.js')(config.daemon);

// Convert rpcDaemon from async to sync function. Only used for
// address validation without restructuring code.
var rpcDaemon = deasync(apiInterfaces.rpcDaemon);

var addressBase58Prefix = cnUtil.address_decode(Buffer.from(config.poolServer.poolAddress));

exports.uid = function(){
    var min = 100000000000000;
    var max = 999999999999999;
    var id = Math.floor(Math.random() * (max - min + 1)) + min;
    return id.toString();
};

exports.ringBuffer = function(maxSize){
    var data = [];
    var cursor = 0;
    var isFull = false;

    return {
        append: function(x){
            if (isFull){
                data[cursor] = x;
                cursor = (cursor + 1) % maxSize;
            }
            else{
                data.push(x);
                cursor++;
                if (data.length === maxSize){
                    cursor = 0;
                    isFull = true;
                }
            }
        },
        avg: function(plusOne){
            var sum = data.reduce(function(a, b){ return a + b }, plusOne || 0);
            return sum / ((isFull ? maxSize : cursor) + (plusOne ? 1 : 0));
        },
        size: function(){
            return isFull ? maxSize : cursor;
        },
        clear: function(){
            data = [];
            cursor = 0;
            isFull = false;
        }
    };
};

exports.varIntEncode = function(n){

};


function validateKevaAddress(address) {
    try {
        let decoded = bs58check.decode(address);
        // A valid address starts with 'V'.
        return (decoded.readInt8(0) === 70);
    } catch (e) {
        return false;
    }
}

// Kevacoin testnet address validation.
function validateKevaAddress_Testnet(address) {
    try {
        let decoded = bs58check.decode(address);
        // A testnet valid address starts with 'T'.
        return (decoded.readInt8(0) === 65);
    } catch (e) {
        return false;
    }
}

exports.isValidAddress = function(addr){
    if (config.coin === "monero") {
        return addressBase58Prefix === cnUtil.address_decode(Buffer.from(addr));
    } else {
        return validateKevaAddress(addr);
    }
};


exports.isValidPoolAddress = function(addr){
    if (config.coin === "monero") {
        return true;
    }
    var result = rpcDaemon('validateaddress', [addr]);
    return result.ismine;
};