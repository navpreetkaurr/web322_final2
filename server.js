/*********************************************************************************
*  WEB322 –Assignment 05
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.
*  No part of this assignment has been copied manually or electronically from any other source
*  (including 3rd party web sites) or distributed to other students.
*
*  Name: Navpreet Kaur Student ID: 148332182 Date: 27/03/2020
*
*  Online (Heroku) URL: https://powerful-ocean-46263.herokuapp.com/
*
********************************************************************************/

const express = require("express");
const app = express();
const dataService = require("./data-service.js")
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const bodyParser = require("body-parser");
const exphbs = require("express-handlebars");
const HTTP_PORT = process.env.PORT || 8080;

function onHttpStart() {
    console.log("Express http server listening on: " + HTTP_PORT);
}

app.use(express.static('public'));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.engine('.hbs', exphbs({
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
        navLink: function (url, options) {
            return '<li' +
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }
    }
}));

app.set('view engine', '.hbs');

app.use(function (req, res, next) {
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
    next();
});

const storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: function (req, file, cb) {

        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage
});

app.get("/", function (req, res) {
    res.render("home");
});


app.get("/about", function (req, res) {
    res.render("about");
});

app.get("/employees/add", function (req, res) {
    dataService.getDepartments().then((data) => {
        res.render("addEmployee", {
            departments: data
        });
    }).catch(() => {
        res.render("addEmployee", {
            departments: []
        });
    });
});

app.get("/departments/add", function (req, res) {
    res.render("addDepartment");
});

app.get("/images/add", function (req, res) {
    res.render("addImage");
});

app.get("/images", (req, res) => {
    fs.readdir("./public/images/uploaded", function (err, data) {
        res.render('images', {
            images: data
        });
    });
});

app.get("/departments", function (req, res) {
    dataService.getDepartments().then((data) => {
        if (data.length > 0) {
            res.render("departments", {
                departments: data
            });
        } else {
            res.render("departments", {
                message: "no results"
            });
        }
    }).catch(() => {
        res.render("departments", {
            message: "no results"
        });
    });
});

app.get("/employee/:empNum", (req, res) => {
    let viewData = {};
    dataService.getEmployeeByNum(req.params.empNum).then((data) => {
            if (data) {
                viewData.employee = data; 
            } else {
                viewData.employee = null; 
            }
        }).catch(() => {
            viewData.employee = null; 
        }).then(dataService.getDepartments)
        .then((data) => {
            viewData.departments = data; 
            for (let i = 0; i < viewData.departments.length; i++) {
                if (viewData.departments[i].departmentId == viewData.employee.department) {
                    viewData.departments[i].selected = true;
                }
            }
        }).catch(() => {
            viewData.departments = []; 
        }).then(() => {
            if (viewData.employee == null) { 
                res.status(404).send("Employee Not Found");
            } else {
                res.render("employee", {
                    viewData: viewData
                }); 
            }
        });
});

app.get('/employees/delete/:empNum', (req, res) => {
    dataService.deleteEmployeeByNum(req.params.empNum)
        .then(() => {
            res.redirect("/employees");
        }).catch(() => {
            res.status(500).send("Unable to Remove Employee / Employee not found");
        });
});

app.get('/department/:departmentId', (req, res) => {

    dataService.getDepartmentById(req.params.departmentId)
        .then((data) => {
            if (data) {
                res.render("department", {
                    department: data
                });
            } else {
                res.status(404).send("Department Not Found");
            }
        })
        .catch(() => {
            res.status(404).send("Department Not Found");
        })
});

app.get('/departments/delete/:departmentId', (req, res) => {

    dataService.deleteDepartmentById(req.params.departmentId)
        .then(() => {
            res.redirect("/departments");
        }).catch(() => {
            res.status(500).send("Unable to Remove Department / Department not found");
        });
});

app.get("/employees", function (req, res) {
    if (req.query.status) {
        dataService.getEmployeesByStatus(req.query.status).then((data) => {
            if (data.length > 0) {
                res.render("employees", {
                    employees: data
                });
            } else {
                res.render("employees", {
                    message: "no results"
                });
            }
        }).catch(() => {
            res.status(500).send("unable to get employees by status");
        })

    } else if (req.query.department) {

        if (parseInt(req.query.department)) {
            dataService.getEmployeesByDepartment(req.query.department).then((data) => {
                if (data.length > 0) {
                    res.render("employees", {
                        employees: data
                    });
                } else {
                    res.render("employees", {
                        message: "no results"
                    });
                }
            }).catch(() => {
                res.status(500).send("unable to get employees by department");
            })
        } else {
            var dept;
            dataService.getDepartments().then((data) => {
                for (let i = 0; i < data.length; i++) {
                    if (data[i].departmentName == req.query.department) {
                        dept = data[i];
                        dataService.getEmployeesByDepartment(dept.departmentId).then((data) => {
                            if (data.length > 0) {
                                res.render("employees", {
                                    employees: data
                                });
                            } else {
                                res.render("employees", {
                                    message: "no results"
                                });
                            }
                        }).catch(() => {
                            res.status(500).send("unable to get employees by department");
                        });
                        break;
                    }
                }
            }).catch(() => {
                res.status(500).send("unable to get employees by department");
            })
        }
    } else if (req.query.manager) {
        dataService.getEmployeesByManager(req.query.manager).then((data) => {
            if (data.length > 0) {
                res.render("employees", {
                    employees: data
                });
            } else {
                res.render("employees", {
                    message: "no results"
                });
            }
        }).catch(() => {
            res.status(500).send("unable to get employees by manager");
        })
    } else {
        dataService.getAllEmployees().then((data) => {
            if (data.length > 0) {
                res.render("employees", {
                    employees: data
                });
            } else {
                res.render("employees", {
                    message: "no results"
                });
            }
        }).catch(() => {
            res.status(500).send("unable to get all employees");

        })
    }
});

app.get("/images", (req, res) => {
    fs.readdir("./public/images/uploaded", function (err, imageFile) {
        res.json(imageFile);
    });
});

app.post("/departments", (req, res) => {
    dataService.getDepartments().then((data) => {
        res.render("employees", {
            employees: data
        });
    }).catch(() => {
        res.status(500).send("No Departments");
    })
});

app.post("/employees/add", (req, res) => {
    dataService.addEmployee(req.body)
        .then(() => {
            res.redirect("/employees")
        })
        .catch(() => {
            res.status(500).send("unable to add employee");
        });
});

app.post("/departments/add", (req, res) => {
    dataService.addDepartment(req.body)
        .then(() => {
            res.redirect("/departments");
        })
        .catch(() => {
            res.status(500).send("unable to add department");
        });
});

app.post("/employee/update", (req, res) => {
    dataService.updateEmployee(req.body)
        .then(() => {
            res.redirect("/employees");
        })
        .catch(() => {
            res.status(500).send("Unable to Update Employee");
        });
});

app.post("/department/update", (req, res) => {
    dataService.updateDepartment(req.body)
        .then(() => {
            res.redirect("/departments");
        })
        .catch(() => {
            res.status(500).send("Unable to Update Department");
        });
});

app.post("/images/add", upload.single(("imageFile")), (req, res) => {
    res.redirect("/images");
});

app.use((req, res) => {
    res.status(404).send("Page Not Found!");
});

dataService.initialize().then(() => {
    app.listen(HTTP_PORT, onHttpStart);
}).catch((err) => {
    console.log("unable to start the server: " + err.message);
});
