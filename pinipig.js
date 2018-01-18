const http = require('http')
const _ = require('lodash')
const core = require('./libs/core')
var options


function sHTTP(req,res){ //simple http
    var cb
    var count = 1
    var exp=false
    var hit = false
    var restful= false
    var pattern = regexify(options.routes)
    _.forEach(pattern, function(value){
        var exp = RegExp(value.regex)
        if(exp.test(req.url) == true) {
            hit = true
            var method = req.method
            var query
            console.log(value.url)
            if(value.url.search(':') > 0){
                console.log('reading url data...')
                query = getURIData(req.url, value.url)
            }
            if( method && value[method]){ // check if a service is available for the request method
                cb =value[method]
                if( method =='POST'){
                    getXwfu(cb,req,res) //run x-www-form-urlencode
                }else{
                    cb(req,res,query)    
                }
            }else{
                console.log('no method')
                cb = core.noMatch
                cb(req,res,query)
            }
        }
    })
    if(!hit){ //display 404 if no match was hit during the iteration
        cb = core.noMatch
        cb(req,res)
    }

}

function regexify(obj){           
    var regexified
    var replaceWith = '([a-z]*)'
   regexified =  _.forEach(obj,function(value){
        value.regex= _.replace(value.url,/(\/:[a-z]*)/,replaceWith)
        if(value.regex =='/'){
            value.regex =_.replace(value.url,'/','^(\/)$')
           }
    })
    return obj
}

function getXwfu(cb,req,res){ //Extract X-WWW-form-urlencoded
    req.on('data', (chunk) => {
        var query =[]
        var data_str = chunk.toString()
        console.log(data_str)
        _.split(decodeURIComponent(data_str),'&')
        .forEach(function(value){
            query.push(_.split(value,'='))
        })
        var results = _.fromPairs(query)
        cb(req,res,results)
      })
    
}

function getURIData(sourcedata, sourcekey){
    keys = sourcekey.split('/')
    data = sourcedata.split('/')
    mapped =_.zipObject(keys,data)
    var qdata =[]
    var result = _.pickBy(mapped, function(value, key) {
        return key.startsWith(":")
    });

    var inv = _.forEach(_.invert(result), function(k,v){
        var newkey = k.replace(':','')
        qdata[newkey] = v
    })
    return qdata
}

function createServer(opt){
    //initiate the options
    options = opt
    http.createServer(function (req, res) {sHTTP(req,res)})
        .listen(options.port)
        .on('error', function(err){console.log(err)})
}

module.exports = {
    createServer: createServer
}