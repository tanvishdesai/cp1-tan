import * as taxonomyService from '../services/taxonomyService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Public: the categories + tags the question form offers.
export const list = asyncHandler(async (_req, res) => {
  res.json(await taxonomyService.getTaxonomy());
});
