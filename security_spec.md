# Security Specification for ClassiAds Editorial Firestore Database

This document details the security invariants, boundary rules, and a Red-Team payload catalog ("Dirty Dozen") designed to stress-test the validation mechanisms.

## 1. Data Invariants
- **Autonomy & Identity**: A user profile document `/users/{userId}` can only be created or modified by the authenticated user with the exact equivalent `userId === request.auth.uid`. No user can read or overwrite another user's PII.
- **Author Identity Integrity**: Any post created in `/posts/{postId}` must have its `authorId` matched strictly with `request.auth.uid`.
- **Relational Integrity**: If a user likes a post, the `postId` in `/users/{userId}/likes/{postId}` must match an existing post in `/posts/` (or be created atomically), validating the like relationship.
- **Temporal Verification**: The `createdAt` property of entities cannot be updated post-creation, and must match server timestamp `request.time` upon creation.
- **Verification Rule**: Standard write operations must be executed by authenticated users whose emails are verified if authentication is present (or simple verification if user signed in).

## 2. The "Dirty Dozen" Threat Payloads (Attack Catalog)

1. **The Ghost Role injection**: Creating/updating `/users/attackerId` with custom claims or roles such as `{ "role": "admin" }` or `{ "isAdmin": true }` to gain unauthorized access.
2. **The Spoof Identity Hijack**: Writing an editorial post to `/posts/maliciousPostId` with `{ "authorId": "victimUserId" }` to masquerade as an editor.
3. **The Eternal Past Timestamp**: Setting a custom past `createdAt: "1970-01-01"` to break sorting or analytics.
4. **Denial of Wallet Long-Field Attack**: Creating a post with a title of 500KB or an author avatar URL of 1MB to exhaust Firestore storage.
5. **The Orphan Like**: Liking a post `/users/attackerId/likes/like123` with `postId: "nonExistentPostId"` to poison references.
6. **Cross-User Leak (PII Blanket read)**: Reading other users' profile documents `/users/victimUserId` as a different logged-in user.
7. **The Post Overwrite**: Updating an existing post in `/posts/somePostId` created by user A, by issuing an update from user B who is not the original author and lacks admin rights.
8. **Malicious Content Swapping**: Replacing complete write-ups in `/posts/{postId}` with advertisement links or unvetted text.
9. **Spam Like Generator**: Attempting to write like documents for another user (i.e., attacker writes into `users/victimUserId/likes/post123`).
10. **The Immune Creation Overwrite**: Modifying the immutable `createdAt` timestamp on an existing article to cheat publication dates.
11. **ID Injection Poisoning**: Specifying an document ID with 10,000 special characters or URL encodings e.g., `/posts/%2F..%2Fsys%2Fconfig` to bypass router parsing.
12. **The Phantom Views increment**: Force-updating views from `15` to `999999` on a post the attacker does not own.

## 3. Test Rules Blueprint
We have drafted tests that ensure all malicious payloads are blocked under standard circumstances. Security rules will use `isValidBlogPost` and verification helpers to block these attempts.
