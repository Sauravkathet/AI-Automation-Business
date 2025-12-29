import { Request, Response } from 'express';
import Organization from '../models/Organization';
import User from '../models/User';
import Invitation from '../models/Invitation';
import EmailService from '../services/auth/EmailService';
import { generateToken, hashToken } from '../utils/crypto';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';

export const getCurrent = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.organizationId!;

  const organization = await Organization.findById(organizationId);

  res.json({
    success: true,
    data: { organization },
  });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.organizationId!;
  const { name, settings } = req.body;

  const organization = await Organization.findByIdAndUpdate(
    organizationId,
    { $set: { name, settings } },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Organization updated',
    data: { organization },
  });
});

export const getMembers = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.organizationId!;

  const members = await User.find({ organizationId }).select(
    '-password -verificationToken -resetPasswordToken'
  );

  res.json({
    success: true,
    data: { members },
  });
});

export const inviteMember = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.organizationId!;
  const userId = req.user!._id.toString();
  const { email, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(400, 'User already exists');
  }

  // Check if invitation already sent
  const existingInvitation = await Invitation.findOne({
    organizationId,
    email,
    status: 'pending',
  });

  if (existingInvitation) {
    throw new AppError(400, 'Invitation already sent');
  }

  // Create invitation
  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await Invitation.create({
    organizationId,
    email,
    role,
    invitedBy: userId,
    token: hashToken(token),
    expiresAt,
  });

  // Get organization and inviter details
  const organization = await Organization.findById(organizationId);
  const inviter = await User.findById(userId);

  // Send invitation email
  await EmailService.sendInvitationEmail(
    email,
    organization!.name,
    `${inviter!.firstName} ${inviter!.lastName}`,
    token
  );

  res.status(201).json({
    success: true,
    message: 'Invitation sent',
    data: { invitation },
  });
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.organizationId!;
  const { userId } = req.params;

  const user = await User.findOne({ _id: userId, organizationId });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (user.role === 'owner') {
    throw new AppError(400, 'Cannot remove organization owner');
  }

  await User.findByIdAndDelete(userId);

  res.json({
    success: true,
    message: 'Member removed',
  });
});

export const updateMemberRole = asyncHandler(
  async (req: Request, res: Response) => {
    const organizationId = req.organizationId!;
    const { userId } = req.params;
    const { role } = req.body;

    const user = await User.findOne({ _id: userId, organizationId });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (user.role === 'owner') {
      throw new AppError(400, 'Cannot change owner role');
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: 'Role updated',
      data: { user },
    });
  }
);