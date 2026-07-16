import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { Subscriber } from "../models/Subscriber";
import { User } from "../models/User";

/**
 * @desc    Subscribe the logged-in user's email to the newsletter
 * @route   POST /api/subscribers
 * @access  Private
 */
export const subscribeToNewsletter = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please log in to subscribe." });
    }

    const emailStr = user.email.trim().toLowerCase();

    // Check if already subscribed
    const existing = await Subscriber.findOne({ email: emailStr });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You are already subscribed to the Kaumudi Circle!",
      });
    }

    // Create new subscriber
    await Subscriber.create({ email: emailStr });

    res.status(201).json({
      success: true,
      message: "Successfully subscribed to the Kaumudi Circle!",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error during subscription",
    });
  }
};

/**
 * @desc    Get all subscribers with user profile details (sorted by newest first)
 * @route   GET /api/subscribers
 * @access  Private/Admin
 */
export const getSubscribers = async (req: AuthRequest, res: Response) => {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    const emails = subscribers.map(s => s.email);

    // Fetch all user details matching subscriber emails
    const users = await User.find({ email: { $in: emails } });

    // Create a mapping of email -> user details
    const userMap = new Map();
    users.forEach(u => {
      // Build address string
      const addrParts = [
        u.houseNumber,
        u.street,
        u.landmark,
        u.city,
        u.state,
        u.postalCode,
      ].filter(Boolean);
      
      const fullAddress = addrParts.length > 0 ? addrParts.join(", ") : (u.address || "");

      userMap.set(u.email.toLowerCase(), {
        name: u.name,
        mobile: u.mobile || "—",
        address: fullAddress || "—",
        registered: true
      });
    });

    // Map user details onto each subscriber item
    const data = subscribers.map(sub => {
      const emailLower = sub.email.toLowerCase();
      const userDetails = userMap.get(emailLower) || {
        name: "—",
        mobile: "—",
        address: "—",
        registered: false
      };

      return {
        _id: sub._id,
        email: sub.email,
        createdAt: sub.createdAt,
        ...userDetails
      };
    });

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve subscribers",
    });
  }
};

/**
 * @desc    Remove a subscriber (Admin action)
 * @route   DELETE /api/subscribers/:id
 * @access  Private/Admin
 */
export const removeSubscriber = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const subscriber = await Subscriber.findById(id);
    if (!subscriber) {
      return res.status(404).json({ success: false, message: "Subscriber not found" });
    }

    await subscriber.deleteOne();

    res.status(200).json({
      success: true,
      message: "Subscriber removed successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to remove subscriber",
    });
  }
};
