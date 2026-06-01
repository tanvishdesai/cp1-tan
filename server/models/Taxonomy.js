import mongoose from 'mongoose';

// Admin-managed taxonomy: the ONLY categories and tags a user may attach to a
// question. Users pick from these (plus the built-in "others" tag); they can
// never create their own. Admins curate this list.
const taxonomySchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['category', 'tag'], required: true, index: true },
    name: { type: String, required: true, trim: true }, // display label
    slug: { type: String, required: true }, // stored on queries; lowercased
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

taxonomySchema.index({ kind: 1, slug: 1 }, { unique: true });

export const Taxonomy = mongoose.model('Taxonomy', taxonomySchema);
export default Taxonomy;
