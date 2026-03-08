'use strict';

const { default: DefaultChangelogRenderer } = require('nx/release/changelog-renderer');

/**
 * Extends the default nx changelog renderer to support filtering out specific
 * authors from the "❤️ Thank You" section via renderOptions.excludeAuthors.
 *
 * Configure in nx.json:
 *   "changelog": {
 *     "renderer": "scripts/changelog-renderer.cjs",
 *     "renderOptions": {
 *       "excludeAuthors": ["K-4U", "some-bot"]
 *     }
 *   }
 */
class FilteredChangelogRenderer extends DefaultChangelogRenderer {
  async renderAuthors() {
    const lines = await super.renderAuthors();
    const excluded = this.changelogRenderOptions.excludeAuthors || [];
    if (excluded.length === 0) return lines;

    // Filter out author list entries matching any excluded name/username.
    // Keep non-author lines (header, blank lines) for now, then decide below.
    const authorLines = lines.filter(
      (line) =>
        line.startsWith('- ') &&
        excluded.some((ex) => line.toLowerCase().includes(ex.toLowerCase()))
    );
    if (authorLines.length === 0) return lines;

    const filtered = lines.filter(
      (line) =>
        !line.startsWith('- ') ||
        !excluded.some((ex) => line.toLowerCase().includes(ex.toLowerCase()))
    );

    // If no author entries remain, drop the entire section (header + blanks).
    const hasRemainingAuthors = filtered.some((line) => line.startsWith('- '));
    if (!hasRemainingAuthors) return [];

    return filtered;
  }
}

module.exports = FilteredChangelogRenderer;
module.exports.default = FilteredChangelogRenderer;
