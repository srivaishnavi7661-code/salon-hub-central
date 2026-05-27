const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Appointment, DailySnapshot } = require('./models');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon_db')
  .then(() => console.log('Connected to Salon Database successfully'))
  .catch(err => console.error('Database connection error:', err));

/**
 * GET /api/dashboard/stats
 * Fetches current day metrics: Today's Revenue, Appointment Count, New Clients, Avg Ticket
 */
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 5, 59, 999);

    // Fetch all bookings for today
    const todaysAppointments = await Appointment.find({
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'Cancelled' }
    });

    // Calculate Metrics
    let todaysRevenue = 0;
    let newClientsCount = 0;
    const completedOrConfirmed = todaysAppointments.filter(app => 
      app.status === 'Completed' || app.status === 'Confirmed'
    );

    todaysAppointments.forEach(appt => {
      if (appt.status === 'Completed') {
        todaysRevenue += appt.price;
      }
      if (appt.isNewClient) {
        newClientsCount++;
      }
    });

    const appointmentCount = completedOrConfirmed.length;
    const avgTicket = appointmentCount > 0 ? Math.round(todaysRevenue / appointmentCount) : 0;

    res.json({
      todaysRevenue,
      appointmentCount,
      newClientsCount,
      avgTicket
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to aggregate dashboard stats', details: error.message });
  }
});

/**
 * GET /api/dashboard/revenue-trend
 * Returns data formatted over the last 30 days for the frontend graph line
 */
app.get('/api/dashboard/revenue-trend', async (req, res) => {
  try {
    // Fetches past 30 logged timeline snapshots ordered chronologically
    const snapshots = await DailySnapshot.find()
      .sort({ date: 1 })
      .limit(30);
    
    res.json(snapshots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve revenue analytics trends.' });
  }
});

/**
 * GET /api/appointments/today
 * Retrieves a time-sorted list of today's schedule tracking
 */
app.get('/api/appointments/today', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const schedule = await Appointment.find({
      appointmentDate: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ appointmentDate: 1 }); // Sort chronologically (earliest first)

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: 'Error pulling todays schedules.' });
  }
});

/**
 * POST /api/appointments
 * Schedules a brand new salon visit booking & auto-updates snapshot aggregates
 */
app.post('/api/appointments', async (req, res) => {
  try {
    const { customerName, serviceName, staffName, price, appointmentDate, isNewClient } = req.body;
    
    const newAppointment = new Appointment({
      customerName,
      serviceName,
      staffName,
      price,
      appointmentDate: new Date(appointmentDate),
      isNewClient
    });

    await newAppointment.save();
    res.status(201).json({ message: 'Appointment booked successfully!', appointment: newAppointment });
  } catch (error) {
    res.status(400).json({ error: 'Failed to book appointment', details: error.message });
  }
});

// Start application runtime 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Salon Backend Server running on port ${PORT}`);
});