// Shapes every model's JSON output like the frontend's TypeScript types expect:
// `id` instead of `_id`, no `__v`, and no accidental password leakage.
function toJSONPlugin(schema, options = {}) {
  const hide = options.hide ?? [];
  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      for (const field of hide) delete ret[field];
      return ret;
    },
  });
}

module.exports = { toJSONPlugin };
