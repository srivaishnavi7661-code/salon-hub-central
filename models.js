const mongoose = require('mongoose');

// 1. Appointment Schema
const AppointmentSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  serviceName: { type: String, required: true },
  staffName: { type: String, required: true },
  price: { type: Number, required: true },
  appointmentDate: { type: Date, required: true }, // Date and time of appointment
  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'], 
    default: 'Confirmed' 
  },
  isNewClient: { type: Boolean, default: false }
}, { timestamps: true });

// 2. Daily Analytics Snapshot Schema (For the 30-day trend chart)
const DailySnapshotSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD
  totalRevenue: { type: Number, default: 0 },
  appointmentCount: { type: Number, default: 0 }
});

const Appointment = mongoose.model('Appointment', AppointmentSchema);
const DailySnapshot = mongoose.model('DailySnapshot', DailySnapshotSchema);

module.exports = { Appointment, DailySnapshot };