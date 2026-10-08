const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const Employee = require('./models/employee');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env');
  process.exit(1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

const checkDbConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database connection failed. Unable to communicate with the database.'
    });
  }

  next();
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/employees', checkDbConnection, async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });

    res.json(employees);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve employees: ' + error.message
    });
  }
});

app.post('/api/employees', checkDbConnection, async (req, res) => {
  try {
    const {
      employeeId,
      name,
      salary,
      email,
      designation
    } = req.body;

    const newEmployee = new Employee({
      employeeId,
      name,
      salary,
      email,
      designation
    });

    await newEmployee.save();

    res.status(201).json({
      message: 'Employee added successfully!',
      employee: newEmployee
    });

  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

app.put('/api/employees/:id', checkDbConnection, async (req, res) => {
  try {
    const {
      employeeId,
      name,
      salary,
      email,
      designation
    } = req.body;

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        employeeId,
        name,
        salary,
        email,
        designation
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedEmployee) {
      return res.status(404).json({
        error: 'Employee not found'
      });
    }

    res.json({
      message: 'Employee updated successfully!',
      employee: updatedEmployee
    });

  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

app.delete('/api/employees/:id', checkDbConnection, async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);

    if (!deletedEmployee) {
      return res.status(404).json({
        error: 'Employee not found'
      });
    }

    res.json({
      message: 'Employee deleted successfully!'
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});