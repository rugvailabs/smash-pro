# media/ — Application-Managed Runtime Media

This tree is **owned by the ProSmash application at runtime**. It will eventually hold
dynamic uploads such as supplier-submitted product images, supplier profile media and
document attachments.

Rules:

- **Never hand-place or hand-edit files here.** Curated design-time assets belong in
  `assets/` and `brand/`.
- The internal structure (e.g. `uploads/products/`, `uploads/suppliers/`) will be defined
  by the application once the technology stack and storage approach are chosen — or this
  directory may be replaced entirely by object storage.
- Everything in this directory **except this README is excluded from version control**
  (see the root `.gitignore`).
