// ─────────────────────────────────────────────
// modules/profileStore.js
// All profile-related Supabase reads and writes.
//
// Usage (all methods are async and return { data?, error? }):
//   ProfileStore.uploadImage(userId, file, type)     → { url } | { error }
//   ProfileStore.removeImage(userId, type)           → { ok }  | { error }
//   ProfileStore.updateUsername(userId, username)    → { ok }  | { error }
//   ProfileStore.updateDisplayName(userId, name)     → { ok }  | { error }
//   ProfileStore.saveBio(userId, bio)                → { ok }  | { error }
//   ProfileStore.deleteAccount(userId)               → { ok }  | { error }
//   ProfileStore.isUsernameTaken(username, selfId)   → boolean
// ─────────────────────────────────────────────
window.ProfileStore = (function () {
  'use strict';

  var BUCKET  = 'images';
  var MAX_MB  = 5 * 1024 * 1024;

  // ── Upload a profile or cover image; returns { url } or { error } ──
  async function uploadImage(userId, file, type) {
    if (!file) return { error: 'No file provided.' };
    if (file.size > MAX_MB) return { error: 'Image must be under 5 MB.' };

    var ext      = file.name.split('.').pop();
    var fileName = userId + '_' + type + '_' + Date.now() + '.' + ext;
    var filePath = 'profiles/' + fileName;
    var field    = type === 'profile' ? 'profile_image_url' : 'cover_image_url';

    var { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file);

    if (uploadError) return { error: 'Upload failed. Please try again.' };

    var { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    var url = urlData.publicUrl;

    var patch = {};
    patch[field] = url;
    var { error: dbError } = await supabase.from('profiles').update(patch).eq('id', userId);
    if (dbError) return { error: 'Image uploaded but profile update failed.' };

    return { url: url };
  }

  // ── Null out a profile or cover image URL in the DB ──
  async function removeImage(userId, type) {
    var field  = type === 'profile' ? 'profile_image_url' : 'cover_image_url';
    var patch  = {};
    patch[field] = null;
    var { error } = await supabase.from('profiles').update(patch).eq('id', userId);
    if (error) return { error: 'Failed to remove image.' };
    return { ok: true };
  }

  // ── Update username after checking availability ──
  async function updateUsername(userId, newUsername) {
    var taken = await isUsernameTaken(newUsername, userId);
    if (taken) return { error: 'Username already taken.' };
    var { error } = await supabase.from('profiles').update({ username: newUsername }).eq('id', userId);
    if (error) return { error: 'Failed to update username.' };
    return { ok: true };
  }

  // ── Update display name (nullable, max 50 chars) ──
  async function updateDisplayName(userId, name) {
    var trimmed = name ? name.trim() : '';
    if (trimmed.length > 50) return { error: 'Display name must be 50 characters or fewer.' };
    var { error } = await supabase
      .from('profiles')
      .update({ display_name: trimmed || null })
      .eq('id', userId);
    if (error) return { error: 'Failed to update display name.' };
    return { ok: true };
  }

  // ── Save bio (null when empty) ──
  async function saveBio(userId, bio) {
    if (bio && bio.length > 500) return { error: 'Bio must be 500 characters or fewer.' };
    var { error } = await supabase.from('profiles').update({ bio: bio || null }).eq('id', userId);
    if (error) return { error: 'Failed to save bio.' };
    return { ok: true };
  }

  // ── Hard-delete the authenticated user's account ──
  // Order: delete content → delete profile → call auth.signOut
  // The auth user record itself is deleted via a Supabase Edge Function
  // (auth.admin.deleteUser) — client-side cannot delete its own auth row.
  // Here we delete all owned data and sign out; the auth user becomes
  // an orphan and is cleaned up by the Edge Function (or a DB trigger).
  async function deleteAccount(userId) {
    // Cascade deletes on posts/comments/likes handle most cleanup,
    // but stars are on other posts so we delete them explicitly.
    var steps = [
      supabase.from('stars').delete().eq('user_id', userId),
      supabase.from('likes').delete().eq('user_id', userId),
    ];
    await Promise.all(steps);

    // Posts cascade → comments, comment_likes, likes, stars on those posts
    var { error: postErr } = await supabase.from('posts').delete().eq('author_id', userId);
    if (postErr) return { error: 'Failed to delete your posts.' };

    // Profile row (cascade → comments where user_id = userId)
    var { error: profileErr } = await supabase.from('profiles').delete().eq('id', userId);
    if (profileErr) return { error: 'Failed to delete profile.' };

    // Sign out — clears the session token
    await supabase.auth.signOut();
    return { ok: true };
  }

  // ── Returns true if the given username is already taken by someone else ──
  async function isUsernameTaken(username, selfId) {
    var query = supabase.from('profiles').select('id').eq('username', username);
    if (selfId) query = query.neq('id', selfId);
    var { data } = await query.maybeSingle();
    return !!data;
  }

  return {
    uploadImage,
    removeImage,
    updateUsername,
    updateDisplayName,
    saveBio,
    deleteAccount,
    isUsernameTaken,
  };
})();
