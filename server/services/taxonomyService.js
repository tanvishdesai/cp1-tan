import { Taxonomy } from '../models/Taxonomy.js';
import { AuditLog } from '../models/AuditLog.js';
import { ApiError } from '../utils/ApiError.js';

// The single built-in tag every user may always apply when no curated tag fits.
// It is NOT stored in the taxonomy collection and cannot be deleted.
export const OTHERS_TAG = 'others';

// Sensible starter taxonomy. Seeded once, on the first read, if the collection
// is empty — admins then curate it from the Categories & Tags admin tab.
const DEFAULT_CATEGORIES = [
  'general',
  'registration',
  'accommodation',
  'travel',
  'schedule',
  'food',
  'technical',
  'payment',
];
const DEFAULT_TAGS = ['urgent', 'question', 'feedback', 'issue'];

export const slugify = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

// Seed defaults when the taxonomy is empty. Idempotent and race-safe (the unique
// {kind, slug} index plus the swallowed insert error guard against duplicates).
async function ensureDefaults() {
  const count = await Taxonomy.countDocuments({});
  if (count > 0) return;
  const docs = [
    ...DEFAULT_CATEGORIES.map((name) => ({ kind: 'category', name, slug: slugify(name) })),
    ...DEFAULT_TAGS.map((name) => ({ kind: 'tag', name, slug: slugify(name) })),
  ];
  await Taxonomy.insertMany(docs, { ordered: false }).catch(() => {});
}

/** Allowed category slugs (always includes the seeded defaults). */
export async function allowedCategories() {
  await ensureDefaults();
  const docs = await Taxonomy.find({ kind: 'category' }).select('slug').lean();
  return docs.map((d) => d.slug);
}

/** Allowed tag slugs, always including the built-in "others" tag. */
export async function allowedTags() {
  await ensureDefaults();
  const docs = await Taxonomy.find({ kind: 'tag' }).select('slug').lean();
  return [...new Set([...docs.map((d) => d.slug), OTHERS_TAG])];
}

/** Full taxonomy for the question form: { categories, tags }. */
export async function getTaxonomy() {
  await ensureDefaults();
  const docs = await Taxonomy.find({}).sort({ kind: 1, name: 1 }).lean();
  const map = (kind) =>
    docs.filter((d) => d.kind === kind).map((d) => ({ id: d._id, name: d.name, slug: d.slug }));
  return { categories: map('category'), tags: map('tag') };
}

/** Admin: add a category or tag. Slug is derived from the name. */
export async function createTerm(admin, kind, name) {
  if (!['category', 'tag'].includes(kind)) throw ApiError.badRequest('kind must be "category" or "tag"');
  const clean = String(name ?? '').trim();
  if (!clean) throw ApiError.badRequest('Name is required');
  const slug = slugify(clean);
  if (!slug) throw ApiError.badRequest('Name must contain letters or numbers');
  if (kind === 'tag' && slug === OTHERS_TAG) {
    throw ApiError.conflict('"others" is a built-in tag and always available');
  }

  const existing = await Taxonomy.findOne({ kind, slug });
  if (existing) throw ApiError.conflict(`That ${kind} already exists`);

  const doc = await Taxonomy.create({ kind, name: clean, slug, created_by: admin._id });
  await AuditLog.create({
    action: `taxonomy.create_${kind}`,
    entity_type: 'taxonomy',
    entity_id: doc._id,
    performed_by: admin._id,
    details: { name: clean, slug },
  });
  return { id: doc._id, kind, name: clean, slug };
}

/** Admin: remove a category or tag. */
export async function deleteTerm(admin, id) {
  const doc = await Taxonomy.findById(id);
  if (!doc) throw ApiError.notFound('Taxonomy term not found');
  await doc.deleteOne();
  await AuditLog.create({
    action: `taxonomy.delete_${doc.kind}`,
    entity_type: 'taxonomy',
    entity_id: doc._id,
    performed_by: admin._id,
    details: { name: doc.name, slug: doc.slug },
  });
  return { ok: true };
}
