var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "wonderlabs",
  database: "student_info"
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

function formatDate(date, type) {
  var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  if (type === 'mysql') {
    return [year, month, day].join('-');
  } else {
    return [day, month, year].join('-');
  } 
}

function getStudentGender(rows, studentGender){
  if(studentGender === 'M'){
    gender = 'Male';
  } else {
    gender = 'Female';
  }
  return gender;
}

///
/// HTTP Method	: GET
/// Endpoint 	: /person
/// 
/// To get collection of person saved in MySQL database.
///

app.get('/students', function(req, res) {
  var studentList = [];

  // Do the query to get data.
  con.query('SELECT * FROM student', function(err, rows, fields) {
    if (err) {
      res.status(500).json({"status_code": 500,"status_message": "internal server error"});
    } else {
      console.log(rows);

      // Loop check on each row
      for (var i = 0; i < rows.length; i++) {
        var dateOfBirth = formatDate(rows[i].date_of_birth);
        var dateTime = formatDate(rows[i].date_time);

        // Create an object to save current row's data
        var student = {
          'student_id':rows[i].student_id,
          'first_name':rows[i].first_name,
          'middle_name':rows[i].middle_name,
          'last_name':rows[i].last_name,
          'gender': rows[i].gender,
          'place_of_birth':rows[i].place_of_birth,
          'date_of_birth':dateOfBirth,
          'phone_number': rows[i].phone_number,
          'email_address': rows[i].email_address,
          'date_time': dateTime,
        }
        // Add object into array
        studentList.push(student);
    }
    // Render index.pug page using array 
    res.render('index.pug', {title: 'Student List', data: studentList});
    }
  })
});

app.get('/input', function (req, res) {
    res.render('input');
});
 //write student details
app.post('/input', function (req, res) {
  // this is where you handle the POST request.
  var createStudent = {
   student_id: req.body.student_id,
   first_name: req.body.first_name,
   middle_name: req.body.middle_name,
   last_name: req.body.last_name,
   gender: req.body.radio,
   place_of_birth: req.body.place_of_birth,
   date_of_birth: req.body.date_of_birth,
   phone_number: req.body.phone_number,
   email_address: req.body.email_address,
   date_time: req.body.date_time
  }
  console.log(createStudent);

  con.query('INSERT INTO student SET ?', createStudent, function (error, results, fields) {
    if (error) throw error;
		res.redirect('/students');
  });
});

app.get('/student/:id', function(req, res){
	con.query('SELECT * FROM student WHERE student_id = ?', [req.params.id], function(err, rows, fields) {
		if(err) throw err
		
		// if user not found
		if (rows.length <= 0) {
				res.redirect('/students')
		} else { 
      var studentDoB = formatDate(rows[0].date_of_birth, 'mysql');
      var dateTime = formatDate(rows[0].date_time);
      console.log(studentDoB);

			// if user found
			// render to views/index.pug template file
			res.render('edit', {
				title: 'Edit Student', 
        student_id: rows[0].student_id,
				first_name: rows[0].first_name,
				middle_name: rows[0].middle_name,
        last_name: rows[0].last_name,
        gender: rows[0].gender,
				place_of_birth: rows[0].place_of_birth,
        date_of_birth: studentDoB,
        phone_number: rows[0].phone_number,
        email_address: rows[0].email_address,
        date_time: dateTime,
        sOldId: rows[0].student_id
			})
		}            
	});
});

///
/// HTTP Method	: POST
/// Endpoint 	: /updated-student
/// 
/// To insert or update student data in MySQL database.
///
app.post('/updated-student', function(req, res) {
	var student_id = req.body.student_id;
	var first_name = req.body.first_name;
	var middle_name = req.body.middle_name;
  var last_name = req.body.last_name;
  var gender= req.body.radio;
	var place_of_birth = req.body.place_of_birth;
  var date_of_birth = req.body.date_of_birth;
  var phone_number = req.body.phone_number;
  var email_address = req.body.email_address;
  var date_time = req.body.date_time;
  var studentOldId = req.body.oldId;
	console.log(student_id+' '+first_name+' '+middle_name+' '+last_name+' '+gender+' '+place_of_birth+' '+date_of_birth+' '+phone_number+' '+email_address +' '+date_time+' '+studentOldId);

	var postData  = {student_id: student_id, first_name: first_name, middle_name: middle_name, last_name: last_name, gender: gender, date_of_birth: date_of_birth, phone_number: phone_number, date_time:date_time, email_address: email_address};

  
	if(studentOldId !== undefined && studentOldId !== '') {
		con.query('UPDATE student SET student_id = ?, first_name = ?, middle_name = ?, last_name = ?, gender = ? ,place_of_birth = ?, date_of_birth = ?, phone_number = ?, email_address = ?, date_time = ? WHERE student_id = ?', [student_id, first_name, middle_name, last_name, gender, place_of_birth, date_of_birth, phone_number, email_address, date_time, studentOldId], function (error, results, fields) {
			if (error) throw error;
			res.redirect('/students');
		});
	} else {
		con.query('INSERT INTO student SET ?', postData, function (error, results, fields) {
			if (error) throw error;
			res.redirect('/students');
		});
	}
});

app.post('/delete/:id', function (req, res) { 
    con.query('DELETE FROM student WHERE student_id = ?', [req.params.id], function(err, result) {
      if(err) throw err
      res.redirect('/students');
    });
  });



  function transpose(original) {
    var copy = [];
    for (var i = 0; i < original.length; ++i) {
        for (var j = 0; j < original[i].length; ++j) {
            // skip undefined values to preserve sparse array
            if (original[i][j] === undefined) continue;
            // create row if it doesn't exist yet
            if (copy[j] === undefined) copy[j] = [];
            // swap the x and y coords for the copy
            copy[j][i] = original[i][j];
        }
    }
    return copy;
    }
  
  app.get('/statistics', function(req, res)  {
    var getMonth = []; getFreq = []; temp_MonthFreq=[]; trans_month=[]; getGender = []; getFreqGen = []; temp_genderFreq=[]; trans_gend=[];
    con.query('select * from frek', function(err, rows, fields) {
       if (err) {
          console.log(err);
        } else {
          getMonth.push('mount')
          getFreq.push('freq')
          for (var j = 0 ; j < rows.length ; j++) {
            if (rows[j].month === 1) {
              getMonth.push('January')
            } else if (rows[j].month === 2) {
              getMonth.push('February')
            } else {
              getMonth.push('March')
            }       
            getFreq.push(rows[j].freq)       
          }
          temp_MonthFreq.push(getMonth,getFreq)
        }
        var trans_month = transpose(temp_MonthFreq);  
        console.log(trans_month);
  
      con.query('select * from freq_gen', function(err, rows, fields) {
        if (err) {
          console.log(err)
        } else {
          getGender.push('gender')
          getFreqGen.push('freq_gender')
          for (var j = 0 ; j < rows.length ; j++) {
            if (rows[j].gender === 'F') {
              getGender.push('F')
            } else {
              getGender.push('M')
            }
            getFreqGen.push(rows[j].freq_gender)       
          }
          temp_genderFreq.push(getGender,getFreqGen)
        }
        var trans_gend = transpose(temp_genderFreq);  
        console.log(trans_gend);
        res.render('statistics',{obj1: JSON.stringify(trans_month), obj2: JSON.stringify(trans_gend)});
      })  
    })  
  });  

app.post('/search', function(req, res) {
  var studentFilter = [];
  var keyword = req.body.keyword;
  var opt = req.body.opt;
  var sortBy = req.body.sortBy;
  var mysqlquery;
  var sort= req.body.sort;

  // if (search = null){
  //   mysqlquery = "SELECT * FROM student WHERE "+opt+" order by "+opt+" DESC";
  // } else {
  //   mysqlquery = "SELECT * FROM student WHERE "+opt+" LIKE '%"+keyword+"%' ORDER BY "+opt+" "+sort;
  // } 

  // var sql = "SELECT * FORM student where "+opt+" like '%" + keyword + "%' order by "+opt+" "+order+"";
  // console.log(mysql, function(err, rows, fields){
  // Do the query to get data.
  con.query('SELECT * FROM student WHERE '+opt+' LIKE  \'%' + keyword +'%\' ORDER BY '+opt+' '+sortBy+'', function(err, rows, fields) {
    if (err) {
      res.status(500).json({"status_code": 500,"status_message": "internal server error"});
    } else {
      console.log(rows);
   // console.log(sql, function(err, rows, fields){
      // Loop check on each row
      for (var i = 0; i < rows.length; i++) {
        var dateOfBirth = formatDate(rows[i].date_of_birth);
        var dateTime = formatDate(rows[i].date_time);

        // Create an object to save current row's data
        var student = {
          'student_id':rows[i].student_id,
          'first_name':rows[i].first_name,
          'middle_name':rows[i].middle_name,
          'last_name':rows[i].last_name,
          'gender': rows[i].gender,
          'place_of_birth':rows[i].place_of_birth,
          'date_of_birth':dateOfBirth,
          'phone_number': rows[i].phone_number,
          'email_address': rows[i].email_address,
          'date_time': dateTime
        }
       // Add object into array
        studentFilter.push(student);
    }
    // Render index.pug page using array 
    res.render('index.pug', {title: 'Student Filter', data: studentFilter});
    }
  }
);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;