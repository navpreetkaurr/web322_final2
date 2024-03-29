const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
let Schema = mongoose.Schema;
let userSchema = new Schema({
  "userName":  {
      "type": String,
      "unique": true,
  },
  "password": String,
  "email": String,
  "loginHistory": [{
    "dataTime": Date,
    "userAgent": String
  }]
});

let User;

module.exports.initialize = function () {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection("mongodb+srv://nk79:Gurjeet0#@web322-a6-akaxn.mongodb.net/test?retryWrites=true&w=majority");

   //  let db = mongoose.createConnection("mongodb://nk79:Gurjeet4#@ds000000.mlab.com:27017/web322-a6");
      db.on('error', (err)=>{
          reject(err); // reject the promise with the provided error
      });
      db.once('open', ()=>{
         User = db.model("users", userSchema);
         resolve();
      });
  });
};

module.exports.registerUser = function (userData) {
  return new Promise(function (resolve, reject) {
    if (userData.password != userData.password2) {
      reject("Passwords do not match");
    }
    else {
      bcrypt.genSalt(10, function (err, salt) { // Generate a "salt" using 10 rounds
      if (err) {
        reject("There was an error encrypting the password");
      }
      else{
        bcrypt.hash(userData.password, salt, function (err, hash) { // encrypt the password: userData.password
          if (err) {
             reject("There was an error encrypting the password");
          }
          else {
             userData.password = hash;
             let newUser = new User(userData);
             newUser.save((err) => {
                if (err) {
                  if (err.code == 11000){
                     reject("User Name already taken");
                  } 
                  else {
                     reject("There was an error creating the user: " + err);
                  }
                }
                else {
                   resolve();
                }
              });
           }
        });
      }
    });
    }
  });
};

module.exports.checkUser = function(userData){
  return new Promise((resolve, reject) => {
    User.find({userName: userData.userName})
      .exec()
      .then((users) => {
          if(!users){
            reject('Unable to find user: '+userData.userName);
          }
          else{
            bcrypt.compare(userData.password, users[0].password).then((res)=>{
              if(res===true){
                users[0].loginHistory.push({dateTime: (new Date()).toString(), userAgent: userData.userAgent});
                User.update(
                  { userName: users[0].userName },
                  { $set: {loginHistory: users[0].loginHistory }},
                  { multi: false }
                )
                .exec()
                .then((() => {
                    resolve(users[0]);
                }))
                .catch((err) => {
                    reject("There was an error verifying the user: " + err);
                });
              } 
              else{
                 reject('Incorrect Password for user: '+userData.userName);
              }
            })
          }
        })
      .catch(() => {
         reject('Unable to find user: '+userData.userName);
    })
  });
}
