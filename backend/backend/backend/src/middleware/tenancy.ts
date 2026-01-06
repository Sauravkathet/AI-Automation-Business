import { Request, Response, NextFunction } from 'express';
import Organization from '../models/Organization';
import logger from '../utils/logger';

export const ensureTenancy = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.organizationId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Fetch organization
    const organization = await Organization.findById(req.organizationId);

    if (!organization) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    req.organization = organization;
    next();
  } catch (error) {
    logger.error('Tenancy middleware error:', error);
    res.status(500).json({ error: 'Tenancy check failed' });
  }
};

// Utility to add organizationId filter to all queries
export const addTenantFilter = (
  organizationId: string,
  filter: any = {}
): any => {
  return {
    ...filter,
    organizationId,
  };
};