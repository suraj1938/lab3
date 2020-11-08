const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("./data.json");
const data_db = low(adapter);

const schedule_adapter = new FileSync("./schedule.json");
const schedule_db = low(schedule_adapter);
const data = require("./data.json");
const fs = require("fs");
var schedule_data = require("./schedule.json");
const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

router.get("/", (req, res) => {
  res.send("hello World!!!");
});
var schedules = [];
var keys = Object.keys(data);

var author = [];
console.log(keys.length);
console.log(schedule_data.length);
router.get("/api/courses", (req, res) => {
  var subject_lists = [];

  for (var i = 0; i < data[keys[0]].length; i++) {
    if (subject_lists.includes(data[keys[0]][i].subject)) continue;
    let course = {
      subject: `${data[keys[0]][i].subject}`,
      className: `${data[keys[0]][i].className}`,
    };
    //console.log("check",data[keys[0]][1].subject);
    //console.log("check",data[keys[0]].length);
    author.push(course);
    subject_lists.push(course.subject);
  }
  res.send(author);
});

router.get("/api/courses/:id", (req, res) => {
  console.log(req.params);
  let c2 = data_db
    .get("data")
    .chain()
    .filter({ subject: req.params.id })
    .value();
  let courseCodes = [];
  if (c2.length === 0) res.status(200).send("The course wasnt found");
  for (var i = 0; i < c2.length; i++) {
    courseCodes.push(c2[i].catalog_nbr);
  }
  res.send(courseCodes);
});

//TIME TABLE ENTRY BY SUBJECT
router.get("/api/courseSchedules/:subject", (req, res) => {
  let c2 = data_db
    .get("data")
    .chain()
    .filter({ subject: req.params.subject })
    .value();
  if (c2.length === 0) res.status(200).send("Please Enter proper Subject Code");
  res.send(c2);
});
//TIME TABLE ENTRY BY SUBJECT AND COURSE
router.get("/api/courseSchedules/:subject/:course", (req, res) => {
  let c2 = data_db
    .get("data")
    .chain()
    .filter({ catalog_nbr: req.params.course, subject: req.params.subject })
    .value();
  if (c2.length === 0) res.send("Please Enter proper Subject and course Code");
  res.send(c2);
});

//TIME TABLE ENTRY BY SUBJECT AND COURSE AND OPTIONAL COMPONENT
router.get("/api/courseSchedules/:subject/:course/:opt_course", (req, res) => {
  let c2 = data_db
    .get("data")
    .chain()
    .filter({
      catalog_nbr: req.params.course,
      subject: req.params.subject,
      course_info: [{ ssr_component: req.params.opt_course }],
    })
    .value();
  if (c2.length === 0) res.send("Please Enter proper Subject and course Code");
  res.send(c2);
});

//create a new schedule to save list of courses
router.post("/api/schedules", (req, res) => {
  const schedule = req.body;
  let c2 = schedule_db
    .get("schedule")
    .chain()
    .filter({ schedule_name: schedule.schedule_name })
    .value();
  if (c2.length !== 0) res.send("Please Enter New Schedule name");
  schedule_db.get("schedule").push(schedule).write();
  res.send(schedule);
});

//Save a list of subject code ,course code pairs under a given schedule name.
router.put("/api/schedules", (req, res) => {
  const schedule = req.body;
  let c2 = schedule_db
    .get("schedule")
    .chain()
    .filter({ schedule_name: schedule.schedule_name })
    .value();
  if (c2.length === 0) res.send("Please Enter valid Schedule name");
  schedule_db
    .get("schedule")
    .find({ schedule_name: schedule.schedule_name })
    .assign({ courses_list: schedule.courses_list })
    .value();
  schedule_db.write();
  res.send(schedule);
});
//GET THE LIST OF SUBJECT_CODE AND COURSE_CODE PAIRS FOR A GIVEN SCHEDULE
router.get("/api/schedules/:schedule_name", (req, res) => {
  let c2 = schedule_db
    .get("schedule")
    .find({ schedule_name: req.params.schedule_name })
    .value();
  if (c2 === null) res.send("please enter valid schedule name");
  res.send(c2);
});

//DELETE A SCHEDULE
router.delete("/api/schedules/:schedule_name", (req, res) => {
  let c2 = schedule_db
    .get("schedule")
    .find({ schedule_name: req.params.schedule_name })
    .value();
  if (c2 === null) res.send("Please enter valid schedule name");
  schedule_db.get("schedule").remove(c2).write();
  res.send("Deleted");
});

//GET LIST OF SCHEDULE NAMES AND NUMBER OF COURSES
router.get("/api/scheduleslist", (req, res) => {
  let c2 = schedule_db.get("schedule").chain().value();
  var list = [];
  for (var i = 0; i < c2.length; i++) {
    let subject_course = {
      schedule: `${c2[i].schedule_name}`,
      numberOfCourses: `${c2[i].courses_list.length}`,
    };
    list.push(subject_course);
  }
  res.send(list);
});

//DELETE ALL SCHEDULES
router.delete("/api/schedules", (req, res) => {
  schedule_db.get("schedule").remove().write();
  res.send("deleted");
});
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
app.use(express.static("website"));
app.use("/", router);

//GET TIMETABLE ENTRY FOR A GIVEN SCHEDULE NAME
router.get("/api/schedulesTimeTable/:schedule_name", (req, res) => {
  let c2 = schedule_db
    .get("schedule")
    .find({ schedule_name: req.params.schedule_name })
    .value();
  if (c2 === null) res.send("please enter valid schedule name");
  let c3 = c2.courses_list;
  console.log(c2.courses_list[0].subject);
  var timetable = [];
  for (var i = 0; i < c3.length; i++) {
    let c4 = data_db
      .get("data")
      .filter({ catalog_nbr: c3[i].catalog_nbr, subject: c3[i].subject })
      .value();
    timetable.push(c4);
  }
  res.send(timetable);
  //let c2=data_db.get('data').chain().filter({catalog_nbr:req.params.course,subject:req.params.subject}).value();
});
