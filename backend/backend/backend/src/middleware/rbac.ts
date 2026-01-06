import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/workflow.types';
import logger from '../utils/logger';

type RoleLevel = {
  [key in UserRole]: number;
};

const roleLevels: RoleLevel = {
  [UserRole.VIEWER]: 1,
  [UserRole.MEMBER]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.OWNER]: 4,
};

export const requireRole = (minRole: UserRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const userRoleLevel = roleLevels[req.user.role];
      const requiredRoleLevel = roleLevels[minRole];

      if (userRoleLevel < requiredRoleLevel) {
        res.status(403).json({ 
          error: 'Insufficient permissions',
          required: minRole,
          current: req.user.role,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('RBAC middleware error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

export const requireOwner = requireRole(UserRole.OWNER);
export const requireAdmin = requireRole(UserRole.ADMIN);
export const requireMember = requireRole(UserRole.MEMBER);

// Check if user can modify resource
export const canModifyResource = (
  userRole: UserRole,
  resourceOwnerId: string,
  userId: string
): boolean => {
  // Owners and admins can modify any resource
  if (userRole === UserRole.OWNER || userRole === UserRole.ADMIN) {
    return true;
  }

  // Members can only modify their own resources
  if (userRole === UserRole.MEMBER && resourceOwnerId === userId) {
    return true;
  }

  return false;
};