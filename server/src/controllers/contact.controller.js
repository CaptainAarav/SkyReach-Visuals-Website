import prisma from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { sendContactNotification } from '../services/email.service.js';

export async function submitContact(req, res, next) {
  try {
    const { name, email, phone, location, serviceType, extraDetails, message } = req.body;

    if (!name || !email || !message) {
      throw new AppError('Name, email, and message are required');
    }

    await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone: phone || null,
        location: location || null,
        serviceType: serviceType || null,
        extraDetails: extraDetails || null,
        message,
      },
    });

    await sendContactNotification({
      name,
      email,
      phone: phone || '',
      location: location || '',
      serviceType: serviceType || '',
      extraDetails: extraDetails || '',
      message,
    });

    res.json({ success: true, data: null, error: null });
  } catch (err) {
    next(err);
  }
}
