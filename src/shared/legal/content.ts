export const PRIVACY_POLICY = `
# Privacy Policy

**Last updated:** June 2026

StorageLens is a developer tool for inspecting and editing browser storage on pages you choose to debug. Your privacy is important to us.

## Summary

- **All data stays on your device.** StorageLens does not send your storage data, cookies, tokens, or snapshots to any remote server.
- **No analytics or tracking** are included in this extension.
- **No accounts** are required.

## What StorageLens accesses

When you use StorageLens, it may read and write:

- **localStorage** and **sessionStorage** on the inspected page
- **Cookies** for the inspected origin (via the Chrome cookies API)
- **IndexedDB** databases on the inspected page

This access only occurs when you open DevTools and use the StorageLens panel on a page you are debugging, or when live tracking is enabled in settings.

## What StorageLens stores locally

The extension may save the following in **chrome.storage.local** on your device:

- Extension settings (theme, toggles, poll interval)
- Snapshots you explicitly capture
- Theme preference

Snapshots and settings never leave your browser unless you export a snapshot file yourself.

## Permissions

| Permission | Why we need it |
|------------|----------------|
| \`cookies\` | Read and edit cookies for the inspected origin |
| \`storage\` | Save settings and snapshots locally |
| \`activeTab\` | Resolve the current tab context |
| \`<all_urls>\` | Access storage on any origin you inspect as a developer |

## Third parties

StorageLens does not integrate third-party analytics, advertising, or cloud sync in v1.

## Children

StorageLens is intended for developers and is not directed at children under 13.

## Changes

We may update this policy as the extension evolves. Material changes will be reflected in the extension options page.

## Contact

For privacy questions about StorageLens, open an issue or contact the maintainer through the project repository.
`.trim()

export const TERMS_OF_SERVICE = `
# Terms of Service

**Last updated:** June 2026

By installing or using StorageLens ("the Extension"), you agree to these Terms of Service.

## 1. Purpose

StorageLens is a **developer debugging tool**. It is designed to help software developers inspect and modify browser storage during development and testing.

## 2. Acceptable use

You agree to use StorageLens only:

- On pages and applications you own, maintain, or have permission to debug
- In compliance with applicable laws and website terms

You must not use StorageLens to access, extract, or modify data on systems you are not authorized to debug.

## 3. Data modification

StorageLens can **edit and delete** localStorage, sessionStorage, cookies, and IndexedDB records. Changes are applied directly to the page under inspection. You are solely responsible for any data loss or application breakage caused by edits you make.

## 4. No warranty

THE EXTENSION IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.

## 5. Limitation of liability

To the maximum extent permitted by law, the authors and contributors of StorageLens shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, profits, or goodwill, arising from your use of the Extension.

## 6. JWT and security

StorageLens can decode JWT payloads for debugging. It does **not** verify signatures. Do not treat decoded JWT output as trusted security validation.

## 7. Updates

We may update the Extension or these Terms. Continued use after updates constitutes acceptance of the revised Terms.

## 8. Termination

You may stop using StorageLens at any time by disabling or uninstalling the Extension.

## 9. Governing law

These Terms are governed by the laws applicable in your jurisdiction, without regard to conflict-of-law principles.

## 10. Contact

For questions about these Terms, contact the maintainer through the project repository.
`.trim()
