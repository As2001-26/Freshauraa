const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

const Contact = require("../models/contact");

// SMTP Transporter Setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465", // true for 465, false for 587 or other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Save Contact Form & Send Email
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Save to Database
    const contact = new Contact({ name, email, subject, message });
    await contact.save();

    // Send Email Notification
    const mailOptions = {
      from: `"${name} (Fresh Auraa)" <${process.env.SMTP_USER || "cs@buybuycart.com"}>`,
      to: "cs@buybuycart.com",
      replyTo: email,
      subject: `Fresh Auraa Contact: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0ddd6; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          <div style="background-color: #1a1c17; color: #e5d9c5; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-family: 'Cinzel', serif; letter-spacing: 2px;">NEW CONTACT FORM SUBMISSION</h2>
            <p style="margin: 5px 0 0 0; font-size: 0.9em; color: #b8892f;">Fresh Auraa Store</p>
          </div>
          <div style="padding: 24px; background-color: #ffffff; color: #1e211a;">
            <p>You have received a new message from the contact form on your website.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 120px; border-bottom: 1px solid #f2f2f0; color: #3a3d36;">Name:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f2f2f0;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f2f2f0; color: #3a3d36;">Email:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f2f2f0;"><a href="mailto:${email}" style="color: #b8892f; text-decoration: none;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f2f2f0; color: #3a3d36;">Subject:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f2f2f0;">${subject}</td>
              </tr>
            </table>
            
            <div style="margin-top: 25px;">
              <h3 style="margin-bottom: 10px; color: #3a3d36; font-size: 1.1em; border-bottom: 2px solid #b8892f; padding-bottom: 5px;">Message:</h3>
              <div style="background-color: #fcfcfb; border: 1px solid #d0cfc8; border-radius: 4px; padding: 15px; white-space: pre-wrap; font-style: italic; color: #1e211a;">
                ${message}
              </div>
            </div>
          </div>
          <div style="background-color: #f2f2f0; padding: 15px; text-align: center; font-size: 0.8em; color: #6b6e65; border-top: 1px solid #e0ddd6;">
            This email was automatically generated from the contact form on Fresh Auraa.
          </div>
        </div>
      `
    };

    // Trigger email send in background/async
    transporter.sendMail(mailOptions, (mailErr, info) => {
      if (mailErr) {
        console.error("Nodemailer Error: Failed to send contact email to cs@buybuycart.com:", mailErr.message);
      } else {
        console.log("Contact form email sent successfully to cs@buybuycart.com. Message ID:", info.messageId);
      }
    });

    res.status(201).json({ message: "Message Sent Successfully" });
  } catch (error) {
    console.error("Error in contact route:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get All Messages
router.get("/", async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Contact Status
router.patch("/:id", async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!contact) return res.status(404).json({ message: "Message not found" });
    res.json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Message
router.delete("/:id", async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ message: "Message not found" });
    res.json({ success: true, message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;